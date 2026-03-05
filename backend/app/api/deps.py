from sqlalchemy.orm import Session
from fastapi import Depends
from app.db.session import get_db
from app.models.user import User

def get_current_user(db: Session = Depends(get_db)) -> User:
    """
    AUTH DISABLED TEMPORARILY — returns first user in DB.
    TODO: re-enable OAuth once configured in prod.
    """
    user = db.query(User).first()
    if not user:
        user = User(
            email="admin@koolchaine.fr",
            full_name="Admin",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
