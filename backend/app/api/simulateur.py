from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.db.session import get_db
from app.models.simulateur import SimulateurConfig, SimulateurTemplate
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

# --- Pydantic Schemas ---

class ConfigUpdate(BaseModel):
    tarif_1_10: Optional[float] = None
    tarif_11_30: Optional[float] = None
    tarif_31_100: Optional[float] = None
    tarif_101_200: Optional[float] = None
    tarif_201_500: Optional[float] = None
    tarif_500_plus: Optional[float] = None
    cout_horaire_anim: Optional[float] = None
    cout_materiel_par_pers: Optional[float] = None
    cout_prestataires: Optional[float] = None
    cout_personnalisation: Optional[float] = None
    deplacement_type: Optional[str] = None
    deplacement_montant: Optional[float] = None
    marge_pct: Optional[float] = None
    option_prestataires: Optional[bool] = None
    option_deplacement: Optional[bool] = None
    option_materiel: Optional[bool] = None
    option_personnalisation: Optional[bool] = None

class TemplateCreate(BaseModel):
    persona: str
    nom: str
    participants: int
    duree: str
    animateurs: int
    options: Dict[str, Any]
    total_estime: float
    notes: Optional[str] = None

class TemplateUpdate(BaseModel):
    nom: Optional[str] = None
    participants: Optional[int] = None
    duree: Optional[str] = None
    animateurs: Optional[int] = None
    options: Optional[Dict[str, Any]] = None
    total_estime: Optional[float] = None
    notes: Optional[str] = None

# --- Configuration Endpoints ---

@router.get("/config/{persona}")
def get_config(
    persona: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère la configuration tarifaire ou la crée si elle n'existe pas"""
    config = db.query(SimulateurConfig).filter(SimulateurConfig.persona == persona).first()
    
    if not config:
        config = SimulateurConfig(persona=persona)
        db.add(config)
        db.commit()
        db.refresh(config)
        
    return config

@router.put("/config/{persona}")
def update_config(
    persona: str,
    data: ConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour la configuration tarifaire d'un persona"""
    config = db.query(SimulateurConfig).filter(SimulateurConfig.persona == persona).first()
    if not config:
        config = SimulateurConfig(persona=persona)
        db.add(config)
        
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(config, key, value)
        
    db.commit()
    db.refresh(config)
    return config

# --- Templates Endpoints ---

@router.get("/templates/{persona}")
def get_templates(
    persona: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère tous les templates enregistrés pour un persona"""
    templates = db.query(SimulateurTemplate)\
        .filter(SimulateurTemplate.persona == persona)\
        .order_by(SimulateurTemplate.created_at.desc())\
        .all()
    return templates

@router.post("/templates")
def save_template(
    data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enregistre un nouveau template"""
    template = SimulateurTemplate(**data.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template

@router.put("/templates/{template_id}")
def update_template(
    template_id: int,
    data: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Modifie un template existant"""
    template = db.query(SimulateurTemplate).filter(SimulateurTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)
        
    db.commit()
    db.refresh(template)
    return template

@router.delete("/templates/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime un template"""
    template = db.query(SimulateurTemplate).filter(SimulateurTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    db.delete(template)
    db.commit()
    return {"message": "Template deleted successfully"}
