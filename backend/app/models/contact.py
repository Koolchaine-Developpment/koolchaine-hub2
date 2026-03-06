from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Float, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.session import Base

class ContactStatus(str, enum.Enum):
    NEW = "new"
    A_VALIDER = "a_valider"
    VALIDE = "valide"
    CONTACTED = "contacted"
    ENVOYE = "envoye"
    REPLIED = "replied"
    REJETE = "rejete"
    UNSUBSCRIBED = "unsubscribed"

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    job_title = Column(String)
    status = Column(Enum(ContactStatus), default=ContactStatus.NEW, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Nouveaux champs pipeline
    email_source = Column(String, nullable=True)     # web | pattern | smtp | google
    email_confidence = Column(Float, default=0)      # 0-1
    linkedin_url = Column(String, nullable=True)
    score_pertinence = Column(Integer, default=0)    # 0-100
    score_detail = Column(JSON, default={})
    email_genere = Column(Text, nullable=True)       # email Claude généré
    email_valide = Column(Boolean, default=False)
    enriched_at = Column(DateTime, nullable=True)

    company = relationship("Company", back_populates="contacts")
    campaign = relationship("Campaign", back_populates="contacts")
    email_logs = relationship("EmailLog", back_populates="contact", cascade="all, delete-orphan")

    @property
    def prenom(self): return self.first_name
    @property
    def nom(self): return self.last_name
    @property
    def poste(self): return self.job_title
    @property
    def statut(self): return self.status
