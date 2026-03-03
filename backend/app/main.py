from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api import auth
from app.core.config import settings
from app.db.session import engine, Base

# Create tables in development (In production use Alembic)
# Base.metadata.create_all(bind=engine) # Disabled, use Alembic instead

from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
from app.tasks import process_pending_emails, sync_shopify_orders, check_stock_alerts

# Background scheduler setup
scheduler = BackgroundScheduler()
scheduler.add_job(process_pending_emails, "interval", hours=1)
scheduler.add_job(sync_shopify_orders, "interval", minutes=30)
scheduler.add_job(check_stock_alerts, "cron", hour=8, minute=0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    scheduler.start()
    yield
    # Shutdown actions
    scheduler.shutdown()

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — restrict to configured origins (never wildcard in production)
allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

from app.api import prospection
from app.api import shopify
from app.api import analytics
from app.api import tracking

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(prospection.router, prefix=f"{settings.API_V1_STR}/prospection", tags=["prospection"])
app.include_router(shopify.router, prefix=f"{settings.API_V1_STR}/shopify", tags=["shopify"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.include_router(tracking.router, prefix="/track", tags=["tracking"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
