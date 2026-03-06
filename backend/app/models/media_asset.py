from sqlalchemy import Column, Integer, String, JSON, Boolean, DateTime, ForeignKey, Text
from app.db.session import Base
from datetime import datetime

TAGS_AUTO_POSSIBLES = [
    # Type de contenu
    "atelier", "produit", "portrait", "groupe", "ambiance", "evenement",
    # Matières / techniques
    "tressage", "macrame", "bijoux", "cordes", "perles", "tissage",
    # Contexte
    "mains", "table", "exterieur", "interieur", "gros-plan", "mise-en-scene",
    # Mood
    "lumineux", "chaleureux", "colore", "minimaliste",
]

class MediaAsset(Base):
    __tablename__ = "media_assets"
    
    id = Column(Integer, primary_key=True)

    # Fichier
    filename = Column(String)
    filepath = Column(String)        # chemin relatif stocké sur le serveur
    file_size = Column(Integer, nullable=True)      # bytes
    mime_type = Column(String)       # image/jpeg | image/png | image/webp

    # Statut système
    status = Column(String, default="en_attente")
    # en_attente | analysee | utilisee | archivee

    # Favori
    is_favorite = Column(Boolean, default=False)

    # Persona
    persona = Column(String, nullable=True)  # koolchaine | koolcorde | null = les deux

    # Tags
    tags_auto = Column(JSON, default=[])
    tags_manual = Column(JSON, default=[])

    # Fiche visuelle structurée (Claude analysis)
    visual_fiche = Column(JSON, nullable=True)
    
    # Résumé court pour injection rapide
    claude_analysis = Column(Text, nullable=True)

    # Statistiques
    captions_generated = Column(Integer, default=0)

    # Post lié si utilisée (optionnel, dépend de social_posts si existant)
    # post_id = Column(Integer, ForeignKey("social_posts.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    analyzed_at = Column(DateTime, nullable=True)
    used_at = Column(DateTime, nullable=True)
