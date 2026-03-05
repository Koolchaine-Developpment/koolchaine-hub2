import os
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from starlette.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User as UserModel, UserRole
from app.schemas.user import UserOut
from app.core import security
from app.core.config import settings
from app.api.deps import get_current_user
import json

router = APIRouter()

oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

ALLOWED_EMAILS = [email.strip() for email in os.getenv("ALLOWED_EMAILS", "").split(",") if email.strip()]

@router.get("/google/login")
async def login_google(request: Request):
    """Initiates the Google OAuth 2.0 flow"""
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost/api/auth/callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/callback")
async def auth_callback(request: Request, response: Response, db: Session = Depends(get_db)):
    """Handles the Google OAuth 2.0 callback, sets JWT in HTTPOnly cookie if allowed"""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
    except Exception as e:
        print(f"OAuth error: {e}")
        return RedirectResponse("/login?error=oauth_failed")

    if not user_info:
        return RedirectResponse("/login?error=no_user_info")

    email = user_info.get("email")
    if not email or email not in ALLOWED_EMAILS:
        print(f"Unauthorized email attempted login: {email}")
        return RedirectResponse("/unauthorized")

    # Check if user exists, else create
    user = db.query(UserModel).filter(UserModel.email == email).first()
    
    if not user:
        print(f"Creating new whitelisted user: {email}")
        user = UserModel(
            email=email,
            full_name=user_info.get("name"),
            google_id=user_info.get("sub"),
            avatar_url=user_info.get("picture"),
            role=UserRole.MEMBER,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update existing user data with fresh Google info
        user.full_name = user_info.get("name")
        user.google_id = user_info.get("sub")
        user.avatar_url = user_info.get("picture")
        db.commit()

    # Create Hub JWT
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )

    # Redirect to frontend callback with the token
    # The frontend will store it in localStorage
    frontend_url = os.getenv("FRONTEND_URL", "https://koolchaine.duckdns.org")
    # Si on est en local (sur le port 8000), le frontend est généralement sur 5173
    if "localhost:8000" in str(request.url) or "127.0.0.1:8000" in str(request.url):
        frontend_url = "http://localhost:5173"
    
    return RedirectResponse(f"{frontend_url}/login/callback?token={access_token}")

@router.post("/logout")
def logout():
    """Logs the user out (stateless)"""
    return {"message": "Logged out"}

@router.get("/me", response_model=UserOut)
def get_me(user: UserModel = Depends(get_current_user)):
    """Returns the current user based on the Authorization header"""
    return user

@router.get("/unauthorized")
def unauthorized():
    """Endpoint hit when a non-whitelisted user tries to login"""
    return {
        "error": "Email non autorisé", 
        "message": "Contacte Meryl ou Maxime pour obtenir l'accès au Hub Koolchaine."
    }
