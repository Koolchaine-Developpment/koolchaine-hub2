import csv
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional

from app.db.session import get_db
from app.models.company import Company
from app.models.contact import Contact, ContactStatus
from app.models.sequence import EmailSequence
from app.models.email_log import EmailLog, EmailStatus
from app.schemas.prospection import (
    CompanyOut, ContactOut, EmailSequenceCreate, EmailSequenceOut
)
from app.services.dropcontact import dropcontact_service

router = APIRouter()

@router.get("/companies", response_model=List[CompanyOut])
def get_companies(db: Session = Depends(get_db)):
    # Add pagination and filtering later
    return db.query(Company).limit(100).all()

@router.post("/companies/import")
async def import_companies(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    
    content = await file.read()
    csv_reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    
    imported_count = 0
    for row in csv_reader:
        siren = row.get("siren")
        if siren and not db.query(Company).filter(Company.siren == siren).first():
            new_company = Company(
                siren=siren,
                name=row.get("denominationUsuelleEtablissement") or row.get("nomUniteLegale", "Unknown"),
                naf_code=row.get("activitePrincipaleEtablissement"),
                size_range=row.get("trancheEffectifsEtablissement"),
                city=row.get("libelleCommuneEtablissement"),
                domain="" # Will need manual or automated enrichment
            )
            db.add(new_company)
            imported_count += 1
            
    db.commit()
    return {"message": f"{imported_count} companies imported."}

@router.post("/enrich")
def enrich_contacts(company_ids: List[int], db: Session = Depends(get_db)):
    # Identify domains to enrich
    companies = db.query(Company).filter(Company.id.in_(company_ids)).all()
    contacts_data = [{"domain": c.domain, "company_id": c.id} for c in companies if c.domain]
    
    if not contacts_data:
        return {"message": "No valid domains to enrich"}
        
    enriched_results = dropcontact_service.enrich_contacts(contacts_data)
    
    added_contacts = 0
    for result in enriched_results:
        # Sort and filter results based on priority here if needed
        # We assume Dropcontact returns multiple contacts per domain
        c_domain = result.get("domain")
        company = next((c for c in companies if c.domain == c_domain), None)
        if company and result.get("email"):
            if not db.query(Contact).filter(Contact.email == result["email"]).first():
                new_contact = Contact(
                    company_id=company.id,
                    first_name=result.get("first_name", ""),
                    last_name=result.get("last_name", ""),
                    email=result.get("email"),
                    job_title=result.get("job_title", ""),
                )
                db.add(new_contact)
                added_contacts += 1
                
    db.commit()
    return {"message": f"{added_contacts} contacts enriched and added."}

@router.get("/contacts", response_model=List[ContactOut])
def get_contacts(
    campaign_id: Optional[int] = None,
    status: Optional[str] = None,
    naf_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Contact).join(Company)
    
    if campaign_id:
        query = query.filter(Contact.campaign_id == campaign_id)
    if status:
        query = query.filter(Contact.status == status)
    if naf_code:
        query = query.filter(Company.naf_code == naf_code)
        
    return query.order_by(Contact.created_at.desc()).limit(1000).all()

@router.delete("/contacts/bulk")
def bulk_delete_contacts(contact_ids: List[int], db: Session = Depends(get_db)):
    db.query(Contact).filter(Contact.id.in_(contact_ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"{len(contact_ids)} contacts deleted."}

@router.post("/sequences", response_model=EmailSequenceOut)
def create_sequence(sequence_in: EmailSequenceCreate, db: Session = Depends(get_db)):
    # Convert SequenceStep Pydantic models to dicts for JSON column
    steps_list = [step.model_dump() for step in sequence_in.steps]
    new_sequence = EmailSequence(
        name=sequence_in.name,
        steps=steps_list
    )
    db.add(new_sequence)
    db.commit()
    db.refresh(new_sequence)
    return new_sequence

@router.get("/sequences", response_model=List[EmailSequenceOut])
def list_sequences(db: Session = Depends(get_db)):
    return db.query(EmailSequence).all()

@router.post("/sequences/{sequence_id}/launch")
def launch_sequence(sequence_id: int, contact_ids: List[int], db: Session = Depends(get_db)):
    sequence = db.query(EmailSequence).filter(EmailSequence.id == sequence_id).first()
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")
        
    contacts = db.query(Contact).filter(Contact.id.in_(contact_ids)).all()
    if not contacts:
        raise HTTPException(status_code=404, detail="No contacts found")

    import datetime
    scheduled_count = 0
    now = datetime.datetime.utcnow()
    
    for contact in contacts:
        if contact.status in (ContactStatus.REPLIED, ContactStatus.UNSUBSCRIBED):
            continue
            
        # Optional: check if already in sequence
        existing_log = db.query(EmailLog).filter(EmailLog.contact_id == contact.id, EmailLog.sequence_id == sequence.id).first()
        if existing_log:
            continue
            
        # Schedule the first step
        if not sequence.steps:
            continue
            
        first_step = sequence.steps[0]
        delay_days = first_step.get("delay_days", 0)
        scheduled_for = now + datetime.timedelta(days=delay_days)
        
        log = EmailLog(
            contact_id=contact.id,
            sequence_id=sequence.id,
            step_index=0,
            status=EmailStatus.PENDING,
            scheduled_for=scheduled_for
        )
        db.add(log)
        
        if contact.status == ContactStatus.NEW:
            contact.status = ContactStatus.CONTACTED
            
        scheduled_count += 1
        
    db.commit()
    return {"message": f"Sequence launched for {scheduled_count} contacts."}
    
from app.models.template import EmailTemplate
from app.schemas.prospection import EmailTemplateCreate, EmailTemplateOut

@router.get("/templates", response_model=List[EmailTemplateOut])
def list_templates(db: Session = Depends(get_db)):
    return db.query(EmailTemplate).order_by(EmailTemplate.updated_at.desc()).all()

@router.post("/templates", response_model=EmailTemplateOut)
def create_template(template_in: EmailTemplateCreate, db: Session = Depends(get_db)):
    new_template = EmailTemplate(
        name=template_in.name,
        category=template_in.category,
        subject=template_in.subject,
        html_content=template_in.html_content,
        placeholders=template_in.placeholders,
        has_signature=template_in.has_signature,
        signature_html=template_in.signature_html
    )
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    return new_template

@router.put("/templates/{template_id}", response_model=EmailTemplateOut)
def update_template(template_id: int, template_in: EmailTemplateCreate, db: Session = Depends(get_db)):
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    for key, value in template_in.model_dump().items():
        setattr(template, key, value)
        
    db.commit()
    db.refresh(template)
    return template

@router.delete("/templates/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}

@router.post("/templates/{template_id}/duplicate", response_model=EmailTemplateOut)
def duplicate_template(template_id: int, db: Session = Depends(get_db)):
    original = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Template not found")
        
    new_template = EmailTemplate(
        name=f"{original.name} (Copie)",
        category=original.category,
        subject=original.subject,
        html_content=original.html_content,
        placeholders=original.placeholders,
        has_signature=original.has_signature,
        signature_html=original.signature_html
    )
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    return new_template

from app.models.campaign import Campaign, CampaignStatus
from app.services.sirene import sirene_service
from app.services.campaign_processor import campaign_processor

@router.get("/campaigns")
def list_campaigns(db: Session = Depends(get_db)):
    return db.query(Campaign).order_by(Campaign.created_at.desc()).all()

@router.post("/campaigns")
def create_campaign(data: Dict[str, Any], db: Session = Depends(get_db)):
    new_campaign = Campaign(
        name=data.get("name"),
        filters=data.get("filters"),
        role_priority=data.get("role_priority", []),
        sequence_id=data.get("sequence_id"),
        status=CampaignStatus.PENDING,
        stats={"total_found": 0, "enriched": 0}
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    
    # Start processing in background
    campaign_processor.start_campaign(new_campaign.id)
    
    return new_campaign

@router.post("/campaigns/estimate")
def estimate_campaign(filters: Dict[str, Any]):
    count = sirene_service.estimate_count(filters)
    return {"estimated_count": count}

@router.post("/campaigns/{campaign_id}/pause")
def pause_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign.status = CampaignStatus.PAUSED
    db.commit()
    return campaign

@router.post("/campaigns/{campaign_id}/resume")
def resume_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign.status = CampaignStatus.PROCESSING
    db.commit()
    # Logic to restart the background job if needed would go here
    campaign_processor.start_campaign(campaign.id)
    return campaign

@router.get("/stats")
def get_pipeline_stats(db: Session = Depends(get_db)):
    try:
        total = db.query(func.count(Contact.id)).scalar() or 0
        contacted = db.query(func.count(Contact.id)).filter(
            Contact.status.in_([ContactStatus.CONTACTED, ContactStatus.ENVOYE])
        ).scalar() or 0
        replied = db.query(func.count(Contact.id)).filter(Contact.status == ContactStatus.REPLIED).scalar() or 0
        a_valider = db.query(func.count(Contact.id)).filter(Contact.status == ContactStatus.A_VALIDER).scalar() or 0
        
        conversion_rate = (replied / contacted * 100) if contacted > 0 else 0
        
        from app.models.email_log import EmailLog, EmailStatus
        from app.models.scraping_job import ScrapingJob
        import datetime
        
        total_companies = db.query(func.count(Company.id)).scalar() or 0
        emails_sent = db.query(func.count(EmailLog.id)).filter(
            EmailLog.status.in_([EmailStatus.SENT, EmailStatus.OPENED])
        ).scalar() or 0
        
        # Active sectors
        sectors = db.query(Company.naf_code, func.count(Company.id).label('count')) \
            .filter(Company.naf_code.isnot(None)) \
            .group_by(Company.naf_code) \
            .order_by(func.count(Company.id).desc()) \
            .limit(3) \
            .all()
        active_sectors = [s.naf_code for s in sectors]
        
        # Contacted this week
        today = datetime.datetime.utcnow().date()
        start_of_week = today - datetime.timedelta(days=today.weekday())
        contacted_week = db.query(func.count(Contact.id)).filter(
            Contact.created_at >= start_of_week,
            Contact.status != ContactStatus.NEW
        ).scalar() or 0
        
        # Last job
        last_job = db.query(ScrapingJob).order_by(ScrapingJob.created_at.desc()).first()
        last_job_data = None
        if last_job:
            last_job_data = {
                "id": last_job.id,
                "status": last_job.status,
                "nb_societes_trouvees": last_job.nb_societes_trouvees,
                "nb_contacts_enrichis": last_job.nb_contacts_enrichis,
                "nb_emails_generes": last_job.nb_emails_generes,
                "started_at": last_job.started_at.isoformat() if last_job.started_at else None,
                "finished_at": last_job.finished_at.isoformat() if last_job.finished_at else None,
            }
        
        return {
            "total_prospects": total,
            "contacted": contacted,
            "replied": replied,
            "a_valider": a_valider,
            "conversion_rate": round(conversion_rate, 2),
            "total_scraped": total_companies,
            "emails_found": total,
            "emails_sent": emails_sent,
            "scraping_pct": min(100, 85) if total_companies > 0 else 0,
            "enrichment_pct": round((total / total_companies) * 100) if total_companies > 0 else 0,
            "contacted_pct": round((contacted / total) * 100) if total > 0 else 0,
            "reply_pct": round((replied / contacted) * 100) if contacted > 0 else 0,
            "active_sectors": active_sectors or ["Services", "Commerce", "Industrie"],
            "contacted_week": contacted_week,
            "last_job": last_job_data,
        }
    except Exception:
        return {
            "total_prospects": 0, "contacted": 0, "replied": 0, "a_valider": 0,
            "conversion_rate": 0, "total_scraped": 0, "emails_found": 0,
            "emails_sent": 0, "scraping_pct": 0, "enrichment_pct": 0,
            "contacted_pct": 0, "reply_pct": 0, "active_sectors": [],
            "contacted_week": 0, "last_job": None,
        }


# =============================================
# PIPELINE JOBS
# =============================================

from app.models.scraping_job import ScrapingJob
from app.scrapers.pipeline import start_pipeline_async

@router.post("/jobs/run")
def run_pipeline_job(data: Dict[str, Any], db: Session = Depends(get_db)):
    """Lance un job de scraping manuellement."""
    job = ScrapingJob(
        secteurs=data.get("secteurs", ["evenementiel", "mode", "com", "hotel", "ehpad"]),
        effectifs_min=data.get("effectifs_min", 200),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    start_pipeline_async(job.id)
    
    return {"message": "Pipeline lancé", "job_id": job.id}


@router.get("/jobs")
def list_jobs(db: Session = Depends(get_db)):
    """Liste tous les scraping jobs."""
    jobs = db.query(ScrapingJob).order_by(ScrapingJob.created_at.desc()).limit(20).all()
    return [{
        "id": j.id,
        "status": j.status,
        "secteurs": j.secteurs,
        "effectifs_min": j.effectifs_min,
        "nb_societes_trouvees": j.nb_societes_trouvees,
        "nb_contacts_enrichis": j.nb_contacts_enrichis,
        "nb_emails_generes": j.nb_emails_generes,
        "started_at": j.started_at.isoformat() if j.started_at else None,
        "finished_at": j.finished_at.isoformat() if j.finished_at else None,
        "created_at": j.created_at.isoformat() if j.created_at else None,
    } for j in jobs]


@router.get("/jobs/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Détail d'un job avec log complet."""
    job = db.query(ScrapingJob).filter(ScrapingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "id": job.id,
        "status": job.status,
        "secteurs": job.secteurs,
        "effectifs_min": job.effectifs_min,
        "nb_societes_trouvees": job.nb_societes_trouvees,
        "nb_contacts_enrichis": job.nb_contacts_enrichis,
        "nb_emails_generes": job.nb_emails_generes,
        "log": job.log,
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "finished_at": job.finished_at.isoformat() if job.finished_at else None,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }


# =============================================
# SOCIETES avec filtres
# =============================================

@router.get("/societes")
def list_societes(
    secteur: Optional[str] = None,
    intent_score_min: Optional[int] = None,
    page: int = 1,
    per_page: int = 50,
    db: Session = Depends(get_db)
):
    """Liste les sociétés avec filtres."""
    query = db.query(Company)
    
    if secteur:
        query = query.filter(Company.secteur == secteur)
    if intent_score_min is not None:
        query = query.filter(Company.intent_score >= intent_score_min)
    
    total = query.count()
    companies = query.order_by(Company.intent_score.desc()) \
        .offset((page - 1) * per_page) \
        .limit(per_page) \
        .all()
    
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "results": [{
            "id": c.id,
            "siren": c.siren,
            "name": c.name,
            "naf_code": c.naf_code,
            "secteur": c.secteur,
            "effectifs": c.effectifs,
            "city": c.city,
            "domain": c.domain,
            "intent_score": c.intent_score,
            "intent_levee_fonds": c.intent_levee_fonds,
            "intent_salon": c.intent_salon,
            "intent_recrutement_event": c.intent_recrutement_event,
            "nb_contacts": len(c.contacts),
            "enriched_at": c.enriched_at.isoformat() if c.enriched_at else None,
        } for c in companies]
    }


# =============================================
# CONTACTS VALIDATION
# =============================================

@router.patch("/contacts/{contact_id}/valider")
def valider_contact(contact_id: int, db: Session = Depends(get_db)):
    """Valide un contact (passe en status 'valide')."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    contact.status = ContactStatus.VALIDE
    contact.email_valide = True
    db.commit()
    return {"message": "Contact validé", "id": contact_id}


@router.patch("/contacts/{contact_id}/rejeter")
def rejeter_contact(contact_id: int, db: Session = Depends(get_db)):
    """Rejette un contact."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    contact.status = ContactStatus.REJETE
    db.commit()
    return {"message": "Contact rejeté", "id": contact_id}


@router.patch("/contacts/{contact_id}/email")
def update_contact_email(contact_id: int, data: Dict[str, Any], db: Session = Depends(get_db)):
    """Modifie l'email généré d'un contact."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    if "email_genere" in data:
        contact.email_genere = data["email_genere"]
    db.commit()
    return {"message": "Email mis à jour", "id": contact_id}


@router.post("/contacts/valider-batch")
def valider_batch(data: Dict[str, Any], db: Session = Depends(get_db)):
    """Valide un lot de contacts."""
    contact_ids = data.get("contact_ids", [])
    if not contact_ids:
        raise HTTPException(status_code=400, detail="No contact IDs provided")
    
    updated = db.query(Contact).filter(Contact.id.in_(contact_ids)).update(
        {Contact.status: ContactStatus.VALIDE, Contact.email_valide: True},
        synchronize_session=False
    )
    db.commit()
    return {"message": f"{updated} contacts validés"}

