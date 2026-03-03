from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Koolchaine Hub"
    API_V1_STR: str = "/api/v1"
    # REQUIRED — must be set in .env. Generate with: openssl rand -hex 32
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS — comma-separated list of allowed origins
    ALLOWED_ORIGINS: str = "http://localhost,http://localhost:80"

    POSTGRES_SERVER: str = "db"
    POSTGRES_USER: str = "postgres"
    # REQUIRED — must be set in .env
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str = "koolchaine"
    DATABASE_URL: str = "postgresql://postgres:password@db/koolchaine"

    @property
    def sync_database_url(self) -> str:
        return self.DATABASE_URL
    DROPCONTACT_API_KEY: Optional[str] = None
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None
    PROSPECTION_FROM_EMAIL: str = "noreply@example.com"
    PROSPECTION_FROM_NAME: str = "No Reply"
    
    # Shopify Settings
    SHOPIFY_STORE_URL: Optional[str] = None
    SHOPIFY_API_KEY: Optional[str] = None
    SHOPIFY_API_SECRET: Optional[str] = None
    SHOPIFY_ACCESS_TOKEN: Optional[str] = None
    
    # Boxtal Settings
    BOXTAL_API_KEY: Optional[str] = None
    BOXTAL_API_SECRET: Optional[str] = None
    DEFAULT_PACKAGE_WEIGHT: float = 0.1

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

settings = Settings()
