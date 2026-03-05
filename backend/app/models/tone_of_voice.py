from sqlalchemy import Column, Integer, String, JSON, DateTime
from app.db.session import Base
from datetime import datetime

class ToneOfVoiceConfig(Base):
    __tablename__ = "tone_of_voice_config"
    id = Column(Integer, primary_key=True)
    persona = Column(String, unique=True, nullable=False)  # koolchaine | koolcorde
    brand_identity = Column(String, nullable=True)
    words_to_use = Column(JSON, default=[])
    words_forbidden = Column(JSON, default=[])
    style_references = Column(JSON, default=[])
    topics_to_avoid = Column(JSON, default=[])
    default_tone = Column(String, default="inspirant")
    default_length = Column(String, default="moyen")
    default_emojis = Column(String, default="subtil")
    default_hashtag_count = Column(Integer, default=15)
    default_language = Column(String, default="fr")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
