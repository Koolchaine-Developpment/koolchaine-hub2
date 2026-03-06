import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from app.db.session import get_db, SessionLocal
from app.models.shopify_order import Order
from app.models.stock_alert import StockAlert
from app.schemas.shopify import OrderOut, StockAlertOut, StockAlertUpdate
from app.services.shopify import shopify_service
from app.services.boxtal import boxtal_service
from app.services.pdf import pdf_service

router = APIRouter()

@router.get("/stats")
def get_shopify_stats(db: Session = Depends(get_db)):
    """Stub: To be implemented for B2C analytics."""
    return {
        "pending_orders": 0,
        "revenue_month": 0.0,
        "to_ship_today": 0
    }

@router.get("/orders", response_model=List[OrderOut])
def list_orders(status: str = "unfulfilled", limit: int = 50, db: Session = Depends(get_db)):
    """Stub: Returns empty list for now."""
    return []

@router.post("/orders/sync")
def sync_orders(db: Session = Depends(get_db)):
    """Stub: Manual sync placeholder."""
    return {"message": "Sync feature is currently being refactored."}

@router.get("/orders/packing-list")
def generate_packing_list(db: Session = Depends(get_db)):
    """Stub: PDF generation placeholder."""
    return Response(content=b"", media_type="application/pdf")

@router.post("/orders/{order_id}/label")
def generate_label(order_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Stub: Label generation placeholder."""
    return {"message": "Label generation feature is currently being refactored."}

@router.get("/stock", response_model=List[StockAlertOut])
def get_stock(db: Session = Depends(get_db)):
    """Stub: Stock alerts placeholder."""
    return []

@router.post("/webhook")
def shopify_webhook(payload: dict, db: Session = Depends(get_db)):
    """Stub: Webhook receiver placeholder."""
    return {"status": "received"}
