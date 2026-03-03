import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.shopify_order import Order
from app.models.contact import Contact, ContactStatus

router = APIRouter()

# Data paths for Social Module
# Note: In Docker, these are mounted volumes. Locally, they are relative paths.
INSTA_DATA_DIR = "/app/insta-post/data" if os.path.exists("/app/insta-post/data") else os.path.join(os.path.dirname(__file__), "../../../insta-post/data")

def read_json_safe(filename: str) -> list:
    filepath = os.path.join(INSTA_DATA_DIR, filename)
    if os.path.exists(filepath):
        try:
            with open(filepath, "r") as f:
                return json.load(f)
        except Exception:
            return []
    return []

@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    """Global KPI Snapshot"""
    today = datetime.utcnow().date()
    start_of_month = today.replace(day=1)
    
    # --- 1. Revenue (Shopify) ---
    this_month_orders = db.query(Order).filter(Order.created_at >= start_of_month).all()
    revenue_this_month = sum(o.total_price for o in this_month_orders)
    
    last_month_start = (start_of_month - timedelta(days=1)).replace(day=1)
    last_month_orders = db.query(Order).filter(
        Order.created_at >= last_month_start, 
        Order.created_at < start_of_month
    ).all()
    revenue_last_month = sum(o.total_price for o in last_month_orders)
    
    revenue_diff = 0
    if revenue_last_month > 0:
        revenue_diff = ((revenue_this_month - revenue_last_month) / revenue_last_month) * 100

    # --- 2. Unfulfilled Orders (Shopify) ---
    unfulfilled_count = db.query(Order).filter(Order.status == "unfulfilled").count()

    # --- 3. Prospection (Weekly Contacted) ---
    start_of_week = today - timedelta(days=today.weekday())
    contacted_this_week = db.query(Contact).filter(
        Contact.created_at >= start_of_week,
        Contact.status != ContactStatus.NEW
    ).count()

    # --- 4. Social (Posts this month) ---
    published = read_json_safe("published_queue.json")
    posts_this_month = len([p for p in published if p.get("published_at", "").startswith(today.strftime("%Y-%m"))])
    
    return {
        "revenue_month": round(revenue_this_month, 2),
        "revenue_change_pct": round(revenue_diff, 1),
        "unfulfilled_orders": unfulfilled_count,
        "contacted_week": contacted_this_week,
        "social_posts_month": posts_this_month
    }

@router.get("/revenue")
def get_revenue_timeline(db: Session = Depends(get_db)):
    """Daily revenue for the last 30 days"""
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=29)
    
    orders = db.query(Order).filter(Order.created_at >= start_date).all()
    
    # Initialize timeline
    timeline = {}
    for i in range(30):
        day = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        timeline[day] = 0.0
        
    for o in orders:
        day_str = o.created_at.strftime("%Y-%m-%d")
        if day_str in timeline:
            timeline[day_str] += o.total_price
            
    return [{"date": k, "revenue": round(v, 2)} for k, v in sorted(timeline.items())]

@router.get("/prospection")
def get_prospection_funnel(db: Session = Depends(get_db)):
    """Funnel counts by status"""
    counts = {
        "Nouveaux": db.query(Contact).filter(Contact.status == ContactStatus.NEW).count(),
        "Contactés": db.query(Contact).filter(Contact.status == ContactStatus.CONTACTED).count(),
        "Réponses": db.query(Contact).filter(Contact.status == ContactStatus.REPLIED).count()
    }
    # Conversion is a derived metric (e.g. 10% of replies or simply the replies count if no closed status exists yet)
    counts["Conversions"] = int(counts["Réponses"] * 0.1) if counts["Réponses"] > 0 else 0
    
    return [{"step": k, "value": v} for k, v in counts.items()]

@router.get("/recent")
def get_recent_summary(db: Session = Depends(get_db)):
    """Summary data for cards (Shopify, Prospection, Social)"""
    # 1. Recent Shopify Orders
    recent_orders = db.query(Order).order_by(Order.created_at.desc()).limit(5).all()
    
    # 2. Recent Prospection Contacts
    recent_contacts = db.query(Contact).order_by(Contact.created_at.desc()).limit(5).all()
    
    # 3. Next Social Posts
    scheduled = read_json_safe("scheduled_queue.json")
    # Filter only future posts and sort
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    future_posts = [p for p in scheduled if f"{p.get('scheduled_date')} {p.get('scheduled_time')}" > now_str]
    future_posts.sort(key=lambda x: f"{x.get('scheduled_date')} {x.get('scheduled_time')}")
    
    return {
        "orders": [
            {
                "id": o.id,
                "number": o.order_number,
                "customer": o.customer_name,
                "date": o.created_at.strftime("%d/%m/%Y"),
                "total": round(o.total_price, 2)
            } for o in recent_orders
        ],
        "contacts": [
            {
                "id": c.id,
                "name": f"{c.first_name} {c.last_name}",
                "company": c.company.name if c.company else "N/A",
                "status": c.status.value,
                "date": c.created_at.strftime("%d/%m/%Y")
            } for c in recent_contacts
        ],
        "social": [
            {
                "id": p.get("id"),
                "caption": p.get("caption", "")[:60] + "...",
                "datetime": f"{p.get('scheduled_date')} {p.get('scheduled_time')}"
            } for p in future_posts[:3]
        ]
    }
