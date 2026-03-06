from sqlalchemy import Column, Integer, String, DateTime, JSON, Text
from datetime import datetime
from app.db.session import Base

class ScrapingJob(Base):
    __tablename__ = "scraping_jobs"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="pending")  # pending | running | done | error
    secteurs = Column(JSON, default=[])
    effectifs_min = Column(Integer, default=200)
    nb_societes_trouvees = Column(Integer, default=0)
    nb_contacts_enrichis = Column(Integer, default=0)
    nb_emails_generes = Column(Integer, default=0)
    log = Column(JSON, default=[])
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
