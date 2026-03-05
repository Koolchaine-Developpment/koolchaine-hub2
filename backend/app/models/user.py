from sqlalchemy import Column, Integer, String, Enum, Boolean
import enum
from app.db.session import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True) # Now nullable for OAuth users
    google_id = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String)
    avatar_url = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.MEMBER, nullable=False)
    is_active = Column(Boolean, default=True)
