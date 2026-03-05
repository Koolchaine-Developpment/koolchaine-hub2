"""
Score de pertinence d'un contact (0-100).

Critères et poids :
- INTENT SIGNALS (50pts max)
- SECTEUR (25pts max)
- TAILLE (15pts max)
- EMAIL TROUVÉ (10pts)

Seuil auto-validation : >= 70
Seuil auto-rejet : <= 20
Entre 20 et 70 : validation manuelle
"""

from typing import Dict, Any


SECTEUR_SCORES = {
    "evenementiel": 25,
    "mode": 20,
    "com": 15,
    "hotel": 10,
    "ehpad": 8,
}


def score_contact(
    intent_score: int = 0,
    secteur: str = "",
    effectifs: int = 0,
    email: str = None,
    email_confidence: float = 0,
) -> Dict[str, Any]:
    """
    Calcule le score de pertinence d'un contact.
    Retourne : { score: int, detail: dict }
    """
    detail = {}
    
    # 1. Intent signals (50pts max, plafonné)
    intent_pts = min(intent_score, 50)
    detail["intent"] = intent_pts
    
    # 2. Secteur (25pts max)
    secteur_pts = SECTEUR_SCORES.get(secteur, 0)
    detail["secteur"] = secteur_pts
    
    # 3. Taille entreprise (15pts max)
    if effectifs >= 500:
        taille_pts = 15
    elif effectifs >= 200:
        taille_pts = 10
    elif effectifs >= 100:
        taille_pts = 5
    else:
        taille_pts = 0
    detail["taille"] = taille_pts
    
    # 4. Email trouvé (10pts)
    if email and email_confidence >= 0.8:
        email_pts = 10
    elif email and email_confidence >= 0.5:
        email_pts = 5
    else:
        email_pts = 0
    detail["email"] = email_pts
    
    # Score final plafonné à 100
    total = min(intent_pts + secteur_pts + taille_pts + email_pts, 100)
    
    return {
        "score": total,
        "detail": detail
    }
