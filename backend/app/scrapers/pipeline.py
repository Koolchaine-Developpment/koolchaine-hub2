import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.company import Company
from app.models.contact import Contact, ContactStatus
from app.models.scraping_job import ScrapingJob

from app.scrapers.sirene_scraper import sirene_scraper
from app.scrapers.web_enricher import web_enricher
from app.scrapers.linkedin_scraper import linkedin_scraper
from app.scrapers.scorer import scorer
from app.scrapers.email_generator import generate_email

logger = logging.getLogger(__name__)

# NAF codes par secteur
SECTEUR_NAFS = {
    "evenementiel": ["82.30Z", "90.01Z", "90.02Z"],
    "mode": ["14.19Z", "47.71Z", "46.42Z"],
    "com": ["73.11Z", "73.12Z", "70.21Z"],
    "hotel": ["55.10Z", "55.20Z"],
    "ehpad": ["87.10A", "87.30A"],
}

async def run_pipeline(job_id: int):
    """Exécute le pipeline complet."""
    db: Session = SessionLocal()
    job = db.query(ScrapingJob).filter(ScrapingJob.id == job_id).first()
    if not job:
        return

    try:
        job.status = "running"
        job.started_at = datetime.utcnow()
        job.log = [{"time": str(datetime.utcnow()), "msg": "Démarrage du pipeline"}]
        db.commit()

        # 1. SIRENE
        naf_codes = []
        for s in (job.secteurs or []):
            naf_codes.extend(SECTEUR_NAFS.get(s, []))
        
        job.log.append({"time": str(datetime.utcnow()), "msg": f"Recherche SIRENE (NAF: {naf_codes})"})
        db.commit()
        
        companies_data = sirene_scraper.search_companies(naf_codes=naf_codes)
        job.nb_societes_trouvees = len(companies_data)
        
        for co in companies_data:
            # Check existance
            db_co = db.query(Company).filter(Company.siren == co["siren"]).first()
            if not db_co:
                db_co = Company(
                    siren=co["siren"],
                    name=co["nom"],
                    code_naf=co["code_naf"],
                    effectifs=co["effectifs"],
                    ville=co["ville"],
                    code_postal=co["code_postal"]
                )
                db.add(db_co)
                db.flush()

            # 2. LinkedIn & Intent
            intent = await linkedin_scraper.detect_intent_signals(db_co.name)
            db_co.intent_score = intent["intent_score"]
            db_co.intent_detail = intent["intent_detail"]
            db_co.intent_levee_fonds = intent["intent_levee_fonds"]
            db_co.intent_salon = intent["intent_salon"]
            db_co.intent_recrutement_event = intent["intent_recrutement_event"]
            
            # 3. Contacts
            if db_co.intent_score > 30:
                contacts = await linkedin_scraper.scrape_contacts(db_co.name, ["Directeur Marketing", "CEO"])
                for c in contacts:
                    # Enrich Domain if missing
                    if not db_co.site_web:
                        db_co.site_web = await web_enricher.find_domain(db_co.name)
                    
                    # Waterfall Email
                    enrich = await web_enricher.waterfall_enrich(c["first_name"], c["last_name"], db_co.site_web)
                    
                    # Creating Contact
                    db_contact = db.query(Contact).filter(Contact.email == enrich["email"]).first()
                    if not db_contact and enrich["email"]:
                        db_contact = Contact(
                            company_id=db_co.id,
                            first_name=c["first_name"],
                            last_name=c["last_name"],
                            email=enrich["email"],
                            job_title=c["job_title"],
                            linkedin_url=c["linkedin_url"],
                            email_source=enrich["source"],
                            email_confidence=enrich["confidence"],
                            status=ContactStatus.A_VALIDER
                        )
                        db.add(db_contact)
                        db.flush()
                        
                        # Scoring
                        score_res = scorer.calculate_score(intent, db_co.__dict__, db_contact.__dict__)
                        db_contact.score_pertinence = score_res["score"]
                        db_contact.score_detail = score_res["detail"]
                        
                        job.nb_contacts_enrichis += 1

        job.status = "done"
        job.finished_at = datetime.utcnow()
        job.log.append({"time": str(datetime.utcnow()), "msg": "Pipeline terminé avec succès"})
        db.commit()

    except Exception as e:
        logger.error(f"Pipeline error: {e}")
        job.status = "error"
        job.log.append({"time": str(datetime.utcnow()), "msg": f"Erreur: {str(e)}"})
        db.commit()
    finally:
        db.close()

def start_pipeline_async(job_id: int):
    """Lance le pipeline en tâche de fond via asyncio."""
    import asyncio
    import threading

    def run_in_new_loop():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(run_pipeline(job_id))
        loop.close()

    thread = threading.Thread(target=run_in_new_loop)
    thread.start()
