"""
Orchestre l'ensemble du pipeline de prospection :
1. Scrape SIRENE → liste sociétés
2. Enrichissement + intent signals par société
3. Contacts : waterfall email + scoring + génération email Claude
4. Mise à jour ScrapingJob avec stats
"""

import threading
import time
from datetime import datetime
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.company import Company
from app.models.contact import Contact, ContactStatus
from app.models.scraping_job import ScrapingJob
from app.services.sirene import sirene_service
from app.scrapers.enricher import waterfall_email
from app.scrapers.intent_detector import detect_intent
from app.scrapers.scorer import score_contact
from app.scrapers.email_generator import generate_email


# Mapping code NAF → secteur Koolchaine
NAF_SECTEUR_MAP = {
    "82.30Z": "evenementiel", "90.01Z": "evenementiel", "90.02Z": "evenementiel",
    "14.19Z": "mode", "47.71Z": "mode", "46.42Z": "mode",
    "73.11Z": "com", "73.12Z": "com", "70.21Z": "com",
    "55.10Z": "hotel", "55.20Z": "hotel",
    "87.10A": "ehpad", "87.30A": "ehpad",
}

# NAF codes par secteur
SECTEUR_NAFS = {
    "evenementiel": ["82.30Z", "90.01Z", "90.02Z"],
    "mode": ["14.19Z", "47.71Z", "46.42Z"],
    "com": ["73.11Z", "73.12Z", "70.21Z"],
    "hotel": ["55.10Z", "55.20Z"],
    "ehpad": ["87.10A", "87.30A"],
}


def _naf_codes_for_secteurs(secteurs: list) -> list:
    """Convertit des noms de secteurs en codes NAF."""
    codes = []
    for s in secteurs:
        codes.extend(SECTEUR_NAFS.get(s, []))
    return codes


def _guess_domain(name: str) -> str:
    """Devine le domaine à partir du nom de l'entreprise."""
    import re
    clean = re.sub(r'[^a-zA-Z0-9]', '', name.lower())
    return f"{clean}.fr"


def run_pipeline(job_id: int):
    """Exécute le pipeline complet en background thread."""
    db: Session = SessionLocal()
    
    try:
        job = db.query(ScrapingJob).filter(ScrapingJob.id == job_id).first()
        if not job:
            return
        
        job.status = "running"
        job.started_at = datetime.utcnow()
        db.commit()
        
        log_lines = []
        
        # 1. SIRENE - Récupérer les sociétés
        naf_codes = _naf_codes_for_secteurs(job.secteurs or [])
        if not naf_codes:
            naf_codes = list(NAF_SECTEUR_MAP.keys())
        
        log_lines.append(f"[1/5] Recherche SIRENE avec codes NAF: {naf_codes}")
        
        # Chercher par pages (max 100 résultats par page)
        all_companies_data = []
        res = sirene_service.search_companies(
            naf_codes=naf_codes,
            size_ranges=["41", "42", "51", "52", "53"],  # 200+ salariés
            per_page=100
        )
        all_companies_data = res.get("results", [])
        
        log_lines.append(f"   → {len(all_companies_data)} sociétés trouvées")
        job.nb_societes_trouvees = len(all_companies_data)
        job.log = "\n".join(log_lines)
        db.commit()
        
        # 2. Créer/mettre à jour les sociétés en DB + intent detection
        log_lines.append("[2/5] Enrichissement sociétés + intent signals")
        
        enriched_companies = []
        for co_data in all_companies_data:
            siren = co_data.get("siren")
            if not siren:
                continue
            
            # Check ou créer la société
            db_company = db.query(Company).filter(Company.siren == siren).first()
            if not db_company:
                naf = co_data.get("activite_principale", "")
                db_company = Company(
                    siren=siren,
                    name=co_data.get("nom_raison_sociale") or "Inconnu",
                    naf_code=naf,
                    size_range=co_data.get("tranche_effectif_salarie"),
                    city=co_data.get("siege", {}).get("libelle_commune"),
                    domain=_guess_domain(co_data.get("nom_raison_sociale", "")),
                    secteur=NAF_SECTEUR_MAP.get(naf, ""),
                    effectifs=int(co_data.get("nombre_etablissements", 0) or 0),
                )
                db.add(db_company)
                db.flush()
            
            # Intent detection (rate limité)
            try:
                intent = detect_intent(db_company.name)
                db_company.intent_levee_fonds = intent["intent_levee_fonds"]
                db_company.intent_salon = intent["intent_salon"]
                db_company.intent_recrutement_event = intent["intent_recrutement_event"]
                db_company.intent_score = intent["intent_score"]
                db_company.intent_detail = intent["intent_detail"]
                db_company.enriched_at = datetime.utcnow()
            except Exception as e:
                log_lines.append(f"   ⚠ Intent error for {db_company.name}: {e}")
            
            db.commit()
            
            # Filtrer : ne continuer que si intent_score > 30
            if db_company.intent_score >= 30:
                enriched_companies.append(db_company)
            
            time.sleep(1)  # Rate limiting Google
        
        log_lines.append(f"   → {len(enriched_companies)} sociétés avec intent score >= 30")
        job.log = "\n".join(log_lines)
        db.commit()
        
        # 3. Pour chaque société retenue : créer des contacts
        log_lines.append("[3/5] Waterfall email pour contacts")
        contacts_enriched = 0
        emails_generated = 0
        
        for company in enriched_companies:
            # Créer un contact fictif basé sur les rôles prioritaires
            # (En production, on scraperait LinkedIn — ici on génère un contact générique)
            roles = ["Directeur Marketing", "Responsable Événementiel", "DRH"]
            
            for role in roles[:1]:  # 1 contact par société pour l'instant
                # Vérifier si un contact existe déjà pour cette société
                existing = db.query(Contact).filter(
                    Contact.company_id == company.id,
                    Contact.job_title == role
                ).first()
                if existing:
                    continue
                
                # Waterfall email
                email_result = waterfall_email("contact", company.name.split()[0].lower(), company.domain or "")
                
                contact = Contact(
                    company_id=company.id,
                    first_name="Contact",
                    last_name=company.name.split()[0] if company.name else "Inconnu",
                    email=email_result["email"],
                    email_source=email_result["source"],
                    email_confidence=email_result["confidence"],
                    job_title=role,
                    status=ContactStatus.NEW,
                )
                db.add(contact)
                db.flush()
                contacts_enriched += 1
                
                # 4. Scoring
                score_result = score_contact(
                    intent_score=company.intent_score,
                    secteur=company.secteur or "",
                    effectifs=company.effectifs or 0,
                    email=email_result["email"],
                    email_confidence=email_result["confidence"],
                )
                contact.score_pertinence = score_result["score"]
                contact.score_detail = score_result["detail"]
                
                # 5. Génération email si score > 20
                if contact.score_pertinence > 20 and email_result["email"]:
                    try:
                        email_body = generate_email(
                            prenom=contact.first_name,
                            nom_entreprise=company.name,
                            secteur=company.secteur or "",
                            effectifs=company.effectifs or 0,
                            intent_detail=company.intent_detail,
                        )
                        contact.email_genere = email_body
                        contact.status = ContactStatus.A_VALIDER
                        emails_generated += 1
                    except Exception as e:
                        log_lines.append(f"   ⚠ Email gen error for {company.name}: {e}")
                
                contact.enriched_at = datetime.utcnow()
                db.commit()
            
            time.sleep(0.5)  # Rate limiting
        
        # Finaliser le job
        log_lines.append(f"[4/5] Résultats : {contacts_enriched} contacts enrichis, {emails_generated} emails générés")
        log_lines.append("[5/5] Pipeline terminé ✅")
        
        job.nb_contacts_enrichis = contacts_enriched
        job.nb_emails_generes = emails_generated
        job.status = "done"
        job.finished_at = datetime.utcnow()
        job.log = "\n".join(log_lines)
        db.commit()
        
    except Exception as e:
        if job:
            job.status = "error"
            job.log = (job.log or "") + f"\n\n❌ ERREUR: {str(e)}"
            job.finished_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()


def start_pipeline_async(job_id: int):
    """Lance le pipeline dans un thread en arrière-plan."""
    thread = threading.Thread(target=run_pipeline, args=(job_id,), daemon=True)
    thread.start()
    return thread
