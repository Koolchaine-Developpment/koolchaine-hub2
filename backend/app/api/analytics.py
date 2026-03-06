import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.shopify_order import Order
from app.models.company import Company
from app.models.campaign import Campaign
from app.models.sequence import EmailSequence
from app.models.email_log import EmailLog
from app.models.contact import Contact, ContactStatus

router = APIRouter()

# Data paths for Social Module
# Note: In Docker, these are mounted volumes. Locally, they are relative paths.
INSTA_DATA_DIR = "/app/insta-post/data" if os.path.exists("/app/insta-post/data") else os.path.join(os.path.dirname(__file__), "../../../insta-post/data")

def read_json_safe(filename: str) -> list:
    filepath = os.path.join(INSTA_DATA_DIR, filename)
    if os.path.exists(filepath):
        try:
            with open(filepath, "r") as f:
                return json.load(f)
        except Exception:
            return []
    return []

@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    """Stub for aggregated B2C metrics."""
    return {
        "revenus_mois": 0.0,
        "revenus_mois_dernier": 0.0,
        "variation_revenus": 0.0,
        "commandes_attente": 0,
        "prospects_semaine": 0,
        "posts_mois": 0,
        "engagement_mois": 0.0
    }

@router.get("/revenus")
def get_revenus_evolution(periode: int = 30, db: Session = Depends(get_db)):
    """Stub for revenue evolution chart."""
    return []

@router.get("/tunnel-prospection")
def get_tunnel(db: Session = Depends(get_db)):
    """Stub for prospection funnel."""
    return {
        "scraping": 0,
        "enrichissement": 0,
        "contactes": 0,
        "reponses": 0,
    }

@router.get("/recent")
def get_recent(db: Session = Depends(get_db)):
    """Stub for recent activity arrays."""
    return {
        "commandes": [],
        "contacts": [],
        "posts": []
    }
