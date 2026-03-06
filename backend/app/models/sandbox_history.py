from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from app.db.session import Base
from datetime import datetime

class SandboxHistory(Base):
    __tablename__ = "sandbox_history"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_filename = Column(String, nullable=True)
    persona = Column(String, default="koolchaine")
    brief = Column(String, nullable=True)
    tone = Column(String, default="inspirant")
    settings = Column(JSON, default={})
    variants = Column(JSON, default=[])
    scores = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
