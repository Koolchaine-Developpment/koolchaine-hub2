from typing import Dict, Any

class Scorter:
    def calculate_score(self, intent_data: Dict[str, Any], company_data: Dict[str, Any], contact_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calcule un score de pertinence entre 0 et 100.
        Logique basée sur :
        - Signaux d'intention
        - Secteur d'activité
        - Taille de l'entreprise
        - Qualité de l'email (confidence)
        """
        score = 0
        details = {}

        # 1. Intent Signals (40 pts)
        intent_score = intent_data.get("intent_score", 0)
        score += (intent_score * 0.4)
        details["intent"] = round(intent_score * 0.4, 1)

        # 2. Secteur (20 pts)
        secteur = company_data.get("secteur", "").lower()
        priority_secteurs = ["evenementiel", "hotel", "com"]
        if secteur in priority_secteurs:
            score += 20
            details["secteur"] = 20
        else:
            details["secteur"] = 0

        # 3. Taille (20 pts)
        effectifs = company_data.get("effectifs", 0)
        if effectifs >= 200:
            score += 20
            details["taille"] = 20
        elif effectifs >= 50:
            score += 10
            details["taille"] = 10
        else:
            details["taille"] = 0

        # 4. Email Confidence (20 pts)
        confidence = contact_data.get("email_confidence", 0)
        score += (confidence * 100 * 0.2)
        details["email"] = round(confidence * 100 * 0.2, 1)

        return {
            "score": min(100, round(score)),
            "detail": details
        }

scorer = Scorter()
