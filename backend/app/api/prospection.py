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
    total = db.query(func.count(Contact.id)).scalar() or 0
    contacted = db.query(func.count(Contact.id)).filter(Contact.status != ContactStatus.NEW).scalar() or 0
    replied = db.query(func.count(Contact.id)).filter(Contact.status == ContactStatus.REPLIED).scalar() or 0
    
    conversion_rate = (replied / contacted * 100) if contacted > 0 else 0
    
    return {
        "total_prospects": total,
        "contacted": contacted,
        "replied": replied,
        "conversion_rate": round(conversion_rate, 2)
    }
