from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean
from datetime import datetime
from app.db.session import Base

class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False) # e.g., "Introduction", "Relance"
    subject = Column(String, nullable=False)
    html_content = Column(String, nullable=False)
    placeholders = Column(JSON, default=list) # e.g., ["prenom", "entreprise"]
    has_signature = Column(Boolean, default=False)
    signature_html = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
