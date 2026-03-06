from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.scraping_job import ScrapingJob
from app.scrapers.pipeline import start_pipeline_async
import logging

logger = logging.getLogger(__name__)

async def scheduled_prospection():
    """Tâche planifiée pour lancer la prospection."""
    logger.info("Lancement de la prospection planifiée (Lundi 8h)")
    db: Session = SessionLocal()
    try:
        # Création d'un job par défaut pour tous les secteurs
        job = ScrapingJob(
            secteurs=["evenementiel", "mode", "com", "hotel", "ehpad"],
            status="pending"
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        start_pipeline_async(job.id)
    except Exception as e:
        logger.error(f"Erreur scheduler: {e}")
    finally:
        db.close()

def setup_scheduler():
    """Configure APScheduler."""
    scheduler = AsyncIOScheduler()
    
    # Chaque lundi à 08:00
    scheduler.add_job(
        scheduled_prospection,
        CronTrigger(day_of_week='mon', hour=8, minute=0)
    )
    
    scheduler.start()
    logger.info("Scheduler de prospection démarré (Cron: Lundi 8h)")
    return scheduler
