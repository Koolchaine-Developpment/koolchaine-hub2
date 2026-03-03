from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.session import Base

class CampaignStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    
    # filters example: {"naf": ["7311Z"], "size": ["11", "12"], "location": {"region": "IDF"}}
    filters = Column(JSON, nullable=False, default=dict)
    
    status = Column(Enum(CampaignStatus), default=CampaignStatus.PENDING, nullable=False)
    
    # stats example: {"total_found": 150, "enriched": 45, "contacted": 10, "replied": 2}
    stats = Column(JSON, nullable=False, default=dict)
    
    # role_priority example: ["Directeur Marketing", "Responsable Marketing"]
    role_priority = Column(JSON, nullable=False, default=list)
    
    sequence_id = Column(Integer, ForeignKey("email_sequences.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    contacts = relationship("Contact", back_populates="campaign")
    sequence = relationship("EmailSequence")
