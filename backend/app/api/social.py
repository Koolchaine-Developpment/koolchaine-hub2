from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
import anthropic
import base64
import json
import os
from datetime import datetime

from app.db.session import get_db
from app.models.sandbox_history import SandboxHistory
from app.models.tone_of_voice import ToneOfVoiceConfig
from app.models.media_asset import MediaAsset, TAGS_AUTO_POSSIBLES
from app.api.deps import get_current_user
from app.models.user import User
from app.brain.meta_agent import brain

router = APIRouter()
anthropic_client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ─── MODÈLES ────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    image_base64: str
    image_mime: str
    persona: str
    ton: str
    longueur: str
    brief: Optional[str] = None

class RegenerateRequest(BaseModel):
    media_id: int
    persona: str
    ton: str
    longueur: str
    brief: Optional[str] = None

class StatusUpdateRequest(BaseModel):
    status: str

class TagsUpdateRequest(BaseModel):
    tags_manual: List[str]

class SandboxRequest(BaseModel):
    # Keep for backward compatibility if needed, but the new flow uses GenerateRequest
    image_description_override: Optional[str] = None
    brief: Optional[str] = None
    tone: str = "inspirant"
    persona: str = "koolchaine"
    length: str = "moyen"
    emojis: str = "subtil"
    hashtag_count: int = 15
    cta: Optional[str] = None
    language: str = "fr"
    variants_count: int = 3

class ToneOfVoiceUpdate(BaseModel):
    persona: str
    brand_identity: Optional[str] = None
    words_to_use: Optional[List[str]] = []
    words_forbidden: Optional[List[str]] = []
    style_references: Optional[List[str]] = []
    topics_to_avoid: Optional[List[str]] = []
    default_tone: Optional[str] = "inspirant"
    default_length: Optional[str] = "moyen"
    default_emojis: Optional[str] = "subtil"
    default_hashtag_count: Optional[int] = 15
    default_language: Optional[int] = "fr"

# ─── GÉNÉRATION & ANALYSE ──────────────────────────────────────

@router.post("/generate")
async def generate_caption(
    payload: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reçoit image en base64 + paramètres.
    1. Analyse l'image avec Claude vision
    2. Extrait les tags auto
    3. Génère la caption
    4. Sauvegarde le MediaAsset en DB
    5. Retourne caption + media_id + tags détectés
    """
    try:
        # Valider que la base64 est bien formée
        try:
            base64.b64decode(payload.image_base64)
        except Exception:
            raise HTTPException(status_code=400, detail="Image base64 invalide")

        # Récupérer le contexte du cerveau (Brain)
        context = await brain.get_context("social", task="caption_generation", db=db)
        system_prompt = await brain.build_system_prompt(context)

        # Appel Claude vision — analyse + tags + caption en un seul appel
        print(f"[SOCIAL] Calling Claude vision with model: claude-3-5-sonnet-latest")
        response = await anthropic_client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=1500,
            system=system_prompt,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": payload.image_mime,
                            "data": payload.image_base64,
                        }
                    },
                    {
                        "type": "text",
                        "text": f"""Analyse cette image en profondeur pour Koolchaine, puis génère une caption Instagram.

Persona : {payload.persona}
Ton souhaité : {payload.ton}
Longueur : {payload.longueur}
Brief supplémentaire : {payload.brief or "Aucun"}

Réponds UNIQUEMENT avec ce JSON (pas de markdown, pas de backticks) :
{{
  "caption": "Le texte complet de la caption avec emojis et hashtags",
  "visual_fiche": {{
    "visuel": {{
      "description": "Ce qu'on voit précisément — sujets, objets, matières, cadrage",
      "couleurs": ["liste", "des", "couleurs", "dominantes"],
      "composition": "Type de plan, lumière, angle, mise en scène",
      "elements_cles": ["éléments", "visuels", "marquants"]
    }},
    "ambiance": {{
      "emotion": "L'émotion principale que dégage la photo",
      "adjectifs": ["3 à 5 adjectifs", "qui décrivent l'ambiance"],
      "ce_que_ca_evoque": "Une phrase sur ce que ça évoque spontanément"
    }},
    "mood": {{
      "energie": "calme | dynamique | festif | concentre | joyeux | serein",
      "rythme": "Description du rythme perçu",
      "tension": "Y a-t-il une tension, une énergie particulière ?"
    }},
    "contexte": {{
      "lieu": "atelier | exterieur | evenement | bureau | studio | autre",
      "moment": "matin | journée | soir | indéterminé",
      "nombre_personnes": 0,
      "activite": "Ce que font les personnes ou ce que montre la photo",
      "occasion_probable": "Quel type d'événement ou moment ça pourrait être"
    }},
    "angles_caption": [
      "3 angles narratifs possibles pour une caption",
      "chacun avec une approche différente",
      "exploitables directement"
    ]
  }},
  "analyse_courte": "Résumé en 2 phrases pour injection rapide dans les prochains prompts",
  "tags_auto": ["tag1", "tag2", "tag3"]
}}

Pour tags_auto, choisis uniquement parmi : {', '.join(TAGS_AUTO_POSSIBLES)}"""
                    }
                ]
            }]
        )

        # Parser la réponse JSON
        raw = response.content[0].text.strip()
        raw = raw.replace('```json', '').replace('```', '').strip()

        try:
            result = json.loads(raw)
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erreur parsing réponse Claude : {str(e)}"
            )

        # Sauvegarder le MediaAsset
        media = MediaAsset(
            filename=f"upload_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.jpg",
            filepath="", # Chemin optionnel si stocké sur S3/local
            mime_type=payload.image_mime,
            status="analysee",
            persona=payload.persona,
            tags_auto=result.get("tags_auto", []),
            visual_fiche=result.get("visual_fiche", {}),
            claude_analysis=result.get("analyse_courte", ""),
            captions_generated=1,
            analyzed_at=datetime.utcnow(),
        )
        db.add(media)
        db.commit()
        db.refresh(media)

        # Brain Integration
        await brain.log_action("social", "caption_generated", {"media_id": media.id}, db=db)
        await brain.remember("social", f"analyse_image_{media.id}", result.get("analyse_courte", ""), "fact", 4, db=db)
        
        mood = result.get("visual_fiche", {}).get("mood", {}).get("energie", "")
        if mood:
            await brain.remember("social", "dernier_mood_photo", mood, "fact", 3, db=db)
            
        ambiance = result.get("visual_fiche", {}).get("ambiance", {}).get("ce_que_ca_evoque")
        if ambiance:
            await brain.remember("social", "ambiance_koolchaine_recente", ambiance, "preference", 5, db=db)

        return {
            "caption": result["caption"],
            "analyse_courte": result.get("analyse_courte", ""),
            "visual_fiche": result.get("visual_fiche", {}),
            "angles_caption": result.get("visual_fiche", {}).get("angles_caption", []),
            "tags_auto": result.get("tags_auto", []),
            "media_id": media.id,
            "is_favorite": media.is_favorite
        }

    except Exception as e:
        import traceback
        print(f"[SOCIAL GENERATE ERROR] {str(e)}")
        print(traceback.format_exc())
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération. Vérifiez vos crédits Claude. DEBUG: {str(e)}")

@router.post("/regenerate")
async def regenerate_caption(
    payload: RegenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Régénère une caption pour un media déjà analysé.
    Utilise visual_fiche stockée — aucun appel vision.
    """
    media = db.query(MediaAsset).filter(MediaAsset.id == payload.media_id).first()
    if not media or not media.visual_fiche:
        raise HTTPException(status_code=404, detail="Media non trouvé ou non analysé")

    context = await brain.get_context("social", task="caption_regeneration", db=db)
    system_prompt = await brain.build_system_prompt(context)

    fiche = media.visual_fiche
    fiche_texte = f"""
ANALYSE VISUELLE DE L'IMAGE :
- Ce qu'on voit : {fiche.get('visuel', {}).get('description', '')}
- Couleurs : {', '.join(fiche.get('visuel', {}).get('couleurs', []))}
- Ambiance : {fiche.get('ambiance', {}).get('emotion', '')} — {', '.join(fiche.get('ambiance', {}).get('adjectifs', []))}
- Ce que ça évoque : {fiche.get('ambiance', {}).get('ce_que_ca_evoque', '')}
- Mood : {fiche.get('mood', {}).get('energie', '')}
- Contexte : {fiche.get('contexte', {}).get('lieu', '')} — {fiche.get('contexte', {}).get('activite', '')}
    """.strip()

    response = await anthropic_client.messages.create(
        model="claude-3-5-sonnet-latest",
        max_tokens=500,
        system=system_prompt,
        messages=[{
            "role": "user",
            "content": f"""Génère une nouvelle caption Instagram basée sur cette analyse visuelle.

{fiche_texte}

Persona : {payload.persona}
Ton souhaité : {payload.ton}
Longueur : {payload.longueur}
Brief supplémentaire : {payload.brief or "Aucun"}

Retourne uniquement le texte de la caption, sans JSON."""
        }]
    )

    media.captions_generated += 1
    db.commit()

    if media.captions_generated >= 3:
        await brain.remember("social", f"image_haute_valeur_{media.id}", f"Image régénérée {media.captions_generated} fois", "preference", 7, db=db)

    return { "caption": response.content[0].text.strip() }

# ─── GESTION MÉDIA ──────────────────────────────────────────────

@router.get("/media")
def list_media(
    status: Optional[str] = None,
    persona: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(MediaAsset)
    if status and status != 'tous':
        query = query.filter(MediaAsset.status == status)
    if persona:
        query = query.filter(MediaAsset.persona == persona)
    if is_favorite is not None:
        query = query.filter(MediaAsset.is_favorite == is_favorite)
    
    return query.order_by(desc(MediaAsset.created_at)).all()

@router.get("/media/{media_id}")
def get_media_detail(media_id: int, db: Session = Depends(get_db)):
    media = db.query(MediaAsset).filter(MediaAsset.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media non trouvé")
    return media

@router.patch("/media/{media_id}/status")
def update_media_status(media_id: int, payload: StatusUpdateRequest, db: Session = Depends(get_db)):
    media = db.query(MediaAsset).filter(MediaAsset.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media non trouvé")
    media.status = payload.status
    if payload.status == "utilisee":
        media.used_at = datetime.utcnow()
    db.commit()
    return {"status": "updated", "new_status": media.status}

@router.patch("/media/{media_id}/favorite")
def toggle_media_favorite(media_id: int, db: Session = Depends(get_db)):
    media = db.query(MediaAsset).filter(MediaAsset.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media non trouvé")
    media.is_favorite = not media.is_favorite
    db.commit()
    return {"status": "updated", "is_favorite": media.is_favorite}

@router.patch("/media/{media_id}/tags")
def update_media_tags(media_id: int, payload: TagsUpdateRequest, db: Session = Depends(get_db)):
    media = db.query(MediaAsset).filter(MediaAsset.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media non trouvé")
    media.tags_manual = payload.tags_manual
    db.commit()
    return {"status": "updated", "tags": media.tags_manual}

# ─── TONE OF VOICE (Legacy / Keep) ──────────────────────────────

@router.get("/settings/tone-of-voice/{persona}")
def get_tone_of_voice(
    persona: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tov = db.query(ToneOfVoiceConfig).filter(ToneOfVoiceConfig.persona == persona).first()
    if not tov:
        return ToneOfVoiceUpdate(persona=persona).model_dump()
        
    return {
        "persona": tov.persona,
        "brand_identity": tov.brand_identity,
        "words_to_use": tov.words_to_use,
        "words_forbidden": tov.words_forbidden,
        "style_references": tov.style_references,
        "topics_to_avoid": tov.topics_to_avoid,
        "default_tone": tov.default_tone,
        "default_length": tov.default_length,
        "default_emojis": tov.default_emojis,
        "default_hashtag_count": tov.default_hashtag_count,
        "default_language": tov.default_language
    }

@router.put("/settings/tone-of-voice")
def update_tone_of_voice(
    config: ToneOfVoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(ToneOfVoiceConfig).filter(ToneOfVoiceConfig.persona == config.persona).first()

    if existing:
        for key, val in config.model_dump(exclude={'persona'}).items():
            setattr(existing, key, val)
    else:
        existing = ToneOfVoiceConfig(**config.model_dump())
        db.add(existing)

    db.commit()
    return {"status": "saved", "persona": config.persona}

# ─── SANDBOX LEGACY (Optional cleanup later) ───────────────────
# Keep for compatibility with existing UI if not fully migrated yet
# but /generate and /media are the new standard
