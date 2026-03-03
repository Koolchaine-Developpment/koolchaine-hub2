from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from app.db.session import Base

class EmailSequence(Base):
    __tablename__ = "email_sequences"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    # steps format: [{"delay_days": int, "subject": str, "body_template": str}, ...]
    steps = Column(JSON, nullable=False, default=list) 
    created_at = Column(DateTime, default=datetime.utcnow)
