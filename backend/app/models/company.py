from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    siren = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    naf_code = Column(String)
    size_range = Column(String)
    city = Column(String)
    domain = Column(String)
    
    # Nouveaux champs pipeline
    secteur = Column(String, nullable=True)          # evenementiel | mode | com | hotel | ehpad
    code_naf = Column(String, nullable=True)         # Alias pour naf_code
    effectifs = Column(Integer, nullable=True)
    telephone = Column(String, nullable=True)
    site_url = Column(String, nullable=True)
    site_web = Column(String, nullable=True)         # Alias ou champ additionnel
    ville = Column(String, nullable=True)
    code_postal = Column(String, nullable=True)
    statut = Column(String, default="nouveau")       # nouveau | a_contacter | en_cours | refuse
    
    # Intent signals
    intent_levee_fonds = Column(Boolean, default=False)
    intent_salon = Column(Boolean, default=False)
    intent_recrutement_event = Column(Boolean, default=False)
    intent_score = Column(Integer, default=0)        # 0-100
    intent_detail = Column(JSON, default={})         # détail signals
    
    # Meta
    enriched_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    contacts = relationship("Contact", back_populates="company", cascade="all, delete-orphan")
