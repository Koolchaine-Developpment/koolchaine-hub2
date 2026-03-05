from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, DateTime
from app.db.session import Base
from datetime import datetime

class SimulateurConfig(Base):
    __tablename__ = "simulateur_config"
    id = Column(Integer, primary_key=True)
    persona = Column(String, default="koolchaine", unique=True)  # koolchaine | koolcorde
    
    # Grille tarifaire
    tarif_1_10 = Column(Float, default=450)
    tarif_11_30 = Column(Float, default=650)
    tarif_31_100 = Column(Float, default=950)
    tarif_101_200 = Column(Float, default=1400)
    tarif_201_500 = Column(Float, default=2200)
    tarif_500_plus = Column(Float, default=3500)
    
    # Coûts unitaires
    cout_horaire_anim = Column(Float, default=60)
    cout_materiel_par_pers = Column(Float, default=8)
    cout_prestataires = Column(Float, default=200)
    cout_personnalisation = Column(Float, default=150)
    
    # Déplacement
    deplacement_type = Column(String, default="forfait")  # forfait | km
    deplacement_montant = Column(Float, default=60)
    
    # Marge
    marge_pct = Column(Float, default=20)
    
    # Options activées par défaut
    option_prestataires = Column(Boolean, default=False)
    option_deplacement = Column(Boolean, default=True)
    option_materiel = Column(Boolean, default=True)
    option_personnalisation = Column(Boolean, default=False)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SimulateurTemplate(Base):
    __tablename__ = "simulateur_template"
    id = Column(Integer, primary_key=True)
    persona = Column(String, default="koolchaine")
    nom = Column(String, nullable=False)
    participants = Column(Integer, default=10)
    duree = Column(String, default="1h30")  # 1h | 1h30 | 2h | 3h | Journée
    animateurs = Column(Integer, default=1)
    options = Column(JSON, default={})
    total_estime = Column(Float, default=0)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
