from sqlalchemy import Column, Integer, String, DateTime
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
    created_at = Column(DateTime, default=datetime.utcnow)

    contacts = relationship("Contact", back_populates="company", cascade="all, delete-orphan")
