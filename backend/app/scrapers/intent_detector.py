"""
Détecte les signaux d'achat pour chaque société.

SIGNAL 1 — Levée de fonds (poids : 40pts)
SIGNAL 2 — Publication salon / événement (poids : 35pts)
SIGNAL 3 — Recrutement event manager (poids : 25pts)
"""

import re
import httpx
from typing import Dict, Any
from datetime import datetime


def _search_google(query: str) -> str:
    """Effectue une recherche Google et retourne le contenu HTML brut."""
    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.get(
                "https://www.google.com/search",
                params={"q": query, "num": 10, "hl": "fr"},
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )
            if resp.status_code == 200:
                return resp.text
    except Exception:
        pass
    return ""


def detect_levee_fonds(nom_societe: str) -> Dict[str, Any]:
    """Détecte si la société a levé des fonds récemment."""
    query = f'"{nom_societe}" levée de fonds OR fundraising 2024 2025 2026'
    html = _search_google(query)
    
    keywords = ["levée de fonds", "fundraising", "série a", "série b", "millions d'euros", 
                 "capital", "investissement", "tour de table"]
    
    found = any(kw in html.lower() for kw in keywords)
    
    return {
        "detected": found,
        "source": "google_search",
        "date_detection": datetime.utcnow().isoformat() if found else None,
        "extrait": "Signal levée de fonds détecté via recherche web" if found else None
    }


def detect_salon(nom_societe: str) -> Dict[str, Any]:
    """Détecte si la société participe à des salons / événements."""
    query = f'"{nom_societe}" salon OR événement OR stand OR expo OR conférence OR "team building" 2024 2025 2026'
    html = _search_google(query)
    
    keywords = ["salon", "événement", "stand", "expo", "conférence", "team building",
                 "séminaire", "convention", "journée", "soirée"]
    
    found = any(kw in html.lower() for kw in keywords)
    
    return {
        "detected": found,
        "source": "google_search",
        "date_detection": datetime.utcnow().isoformat() if found else None,
        "extrait": "Signal participation salon/événement détecté" if found else None
    }


def detect_recrutement_event(nom_societe: str) -> Dict[str, Any]:
    """Détecte si la société recrute un event manager."""
    query = f'"{nom_societe}" "event manager" OR "chargé événements" OR "responsable événementiel" recrutement'
    html = _search_google(query)
    
    keywords = ["event manager", "chargé événements", "responsable événementiel",
                 "chef de projet événementiel", "coordinateur événements"]
    
    found = any(kw in html.lower() for kw in keywords)
    
    return {
        "detected": found,
        "source": "google_search",
        "date_detection": datetime.utcnow().isoformat() if found else None,
        "extrait": "Signal recrutement event manager détecté" if found else None
    }


def detect_intent(nom_societe: str) -> Dict[str, Any]:
    """
    Détecte l'ensemble des intent signals.
    Retourne : {
        intent_levee_fonds, intent_salon, intent_recrutement_event,
        intent_score, intent_detail
    }
    """
    levee = detect_levee_fonds(nom_societe)
    salon = detect_salon(nom_societe)
    recrutement = detect_recrutement_event(nom_societe)
    
    # Calcul du score intent
    score = 0
    if levee["detected"]:
        score += 40
    if salon["detected"]:
        score += 35
    if recrutement["detected"]:
        score += 25
    
    # Plafonner à 100
    score = min(score, 100)
    
    return {
        "intent_levee_fonds": levee["detected"],
        "intent_salon": salon["detected"],
        "intent_recrutement_event": recrutement["detected"],
        "intent_score": score,
        "intent_detail": {
            "levee_fonds": levee,
            "salon": salon,
            "recrutement_event": recrutement
        }
    }
