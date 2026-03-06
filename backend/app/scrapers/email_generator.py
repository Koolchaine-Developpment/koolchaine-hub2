"""
Génère un email de prospection personnalisé via l'API Anthropic (Claude).
ADN Koolchaine injecté dans le system prompt.
"""

import anthropic
import os


SYSTEM_PROMPT = """
Tu es expert en copywriting B2B pour Koolchaine, un atelier créatif qui anime des ateliers
de tressage/bijoux/fabrication manuelle pour des équipes en entreprise.

L'ADN de Koolchaine :
- On reconnecte les adultes à leur âme d'enfant par le travail des mains
- On crée du lien humain authentique dans les équipes
- On a animé des ateliers pour Club Med, des EHPAD, des agences, des hôtels
- On n'est pas un prestataire de team building générique — on est artisans

Règles pour chaque email :
- 10 lignes max
- Commencer par une accroche liée au signal d'intent détecté (si disponible)
- Mentionner 1-2 références clients crédibles selon le secteur
- Terminer par un CTA simple et humain (pas "n'hésitez pas à me contacter")
- Ton : chaleureux, original, jamais corporatif
- Pas de "Madame, Monsieur", pas de "Dans le cadre de"
- Tutoyer si secteur créatif/mode, vouvoyer sinon

Adapte l'angle selon le secteur :
- Événementiel : "Un atelier qui reste dans les mémoires longtemps après le salon"
- Mode : "Créativité manuelle, matière, geste — ça parle à vos équipes"
- Com/agences : "Vos équipes passent leur journée à créer pour les autres, ils méritent de créer pour eux"
- Hôtels : "Une activité que vos clients ne trouveront nulle part ailleurs"
- EHPAD : "Le tressage comme vecteur de lien social et de motricité fine"
"""


def generate_email(
    prenom: str,
    nom_entreprise: str,
    secteur: str,
    effectifs: int,
    intent_detail: dict = None,
) -> str:
    """
    Génère un email de prospection via Claude.
    Retourne le corps de l'email (sans objet, sans signature).
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return "[Erreur : ANTHROPIC_API_KEY non configurée]"
    
    client = anthropic.Anthropic(api_key=api_key)
    
    # Formater les intent signals
    intent_str = "Aucun signal détecté"
    if intent_detail:
        signals = []
        if intent_detail.get("levee_fonds", {}).get("detected"):
            signals.append("Levée de fonds récente")
        if intent_detail.get("salon", {}).get("detected"):
            signals.append("Participation à un salon/événement")
        if intent_detail.get("recrutement_event", {}).get("detected"):
            signals.append("Recrutement event manager en cours")
        if signals:
            intent_str = ", ".join(signals)
    
    prompt = f"""Génère un email de prospection pour ce contact :

Prénom : {prenom}
Entreprise : {nom_entreprise}
Secteur : {secteur}
Taille : {effectifs} salariés
Intent signals détectés : {intent_str}

Retourne uniquement le corps de l'email, sans objet, sans signature.
"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text
    except Exception as e:
        return f"[Erreur génération email : {str(e)}]"
