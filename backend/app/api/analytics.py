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

# Directories for Insta Post module (assuming we copied it to /insta-post)
INSTA_DATA_DIR = os.path.join("..", "insta-post", "data")

def read_json_file(filename: str) -> list:
    filepath = os.path.join(INSTA_DATA_DIR, filename)
    if os.path.exists(filepath):
        try:
            with open(filepath, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return []

@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    start_of_month = today.replace(day=1)
    
    # 1. Revenus du mois (Shopify)
    this_month_orders = db.query(Order).filter(Order.created_at >= start_of_month).all()
    revenue_this_month = sum(o.total_price for o in this_month_orders)
    
    # Calculate % change from last month
    last_month_start = (start_of_month - timedelta(days=1)).replace(day=1)
    last_month_orders = db.query(Order).filter(
        Order.created_at >= last_month_start, 
        Order.created_at < start_of_month
    ).all()
    revenue_last_month = sum(o.total_price for o in last_month_orders)
    
    pct_change = 0
    if revenue_last_month > 0:
        pct_change = ((revenue_this_month - revenue_last_month) / revenue_last_month) * 100

    # 2. Commandes en attente (Shopify)
    unfulfilled_count = db.query(Order).filter(Order.status == "unfulfilled").count()

    # 3. Prospects contactés cette semaine
    start_of_week = today - timedelta(days=today.weekday())
    contacted_this_week = db.query(Contact).filter(
        Contact.created_at >= start_of_week,
        Contact.status != ContactStatus.NEW
    ).count()

    # 4. Taux d'engagement IG (Mock or derived from Insta post if we had analytics, for now just show count of published)
    published = read_json_file("published_queue.json")
    posts_this_month = len([p for p in published if p.get("published_at", "").startswith(str(start_of_month)[:7])])
    
    return {
        "revenue_month": revenue_this_month,
        "revenue_change_pct": round(pct_change, 1),
        "unfulfilled_orders": unfulfilled_count,
        "contacted_week": contacted_this_week,
        "social_posts_month": posts_this_month,
        "engagement_rate": 4.8  # Generic mock since Meta Graph API insights are complex and not explicitly in insta-post data files
    }

@router.get("/revenue")
def get_revenue_chart(db: Session = Depends(get_db)):
    """Last 30 days revenue grouped by day"""
    thirty_days_ago = datetime.utcnow().date() - timedelta(days=30)
    
    # Simple Python aggregation for SQLite/Postgres compatibility 
    orders = db.query(Order).filter(Order.created_at >= thirty_days_ago).all()
    
    daily_revenue = {}
    for i in range(31):
        d = (thirty_days_ago + timedelta(days=i)).strftime("%Y-%m-%d")
        daily_revenue[d] = 0.0
        
    for o in orders:
        day_str = o.created_at.strftime("%Y-%m-%d")
        if day_str in daily_revenue:
            daily_revenue[day_str] += o.total_price
            
    # Format for recharts: [{name: '2026-03-01', value: 150.0}, ...]
    result = [{"name": k, "value": v} for k, v in daily_revenue.items()]
    return sorted(result, key=lambda x: x["name"])

@router.get("/prospection")
def get_prospection_funnel(db: Session = Depends(get_db)):
    """Counts grouped by contact status"""
    funnel = {
        "Nouveaux": db.query(Contact).filter(Contact.status == ContactStatus.NEW).count(),
        "Contactés": db.query(Contact).filter(Contact.status == ContactStatus.CONTACTED).count(),
        "Réponses": db.query(Contact).filter(Contact.status == ContactStatus.REPLIED).count(),
        "Convertis": int(db.query(Contact).filter(Contact.status == ContactStatus.REPLIED).count() * 0.3) # Fake metric for Demo 
    }
    
    result = [{"name": k, "value": v} for k, v in funnel.items()]
    return result

@router.get("/social")
def get_social_summary():
    """Reads local Insta Post JSON queues to serve scheduled and published counts"""
    scheduled = read_json_file("scheduled_queue.json")
    
    # Sort by date
    scheduled.sort(key=lambda x: f"{x.get('scheduled_date', '')} {x.get('scheduled_time', '')}")
    next_posts = scheduled[:3]
    
    return {
        "scheduled_count": len(scheduled),
        "next_posts": [
            {
                "id": p.get("id"), 
                "caption": p.get("caption", "")[:100] + "...", 
                "date": f"{p.get('scheduled_date')} {p.get('scheduled_time')}"
            } 
            for p in next_posts
        ]
    }

@router.get("/recent")
def get_recent_activity(db: Session = Depends(get_db)):
    """Returns the last 5 orders and last 5 contacts for the summary cards"""
    recent_orders = db.query(Order).order_by(Order.created_at.desc()).limit(5).all()
    recent_contacts = db.query(Contact).order_by(Contact.created_at.desc()).limit(5).all()
    
    return {
        "orders": [
            {
                "id": o.id,
                "number": o.order_number,
                "customer": o.customer_name,
                "date": o.created_at.strftime("%d/%m/%Y"),
                "total": o.total_price
            } for o in recent_orders
        ],
        "contacts": [
            {
                "id": c.id,
                "name": f"{c.first_name} {c.last_name}",
                "company": c.company.name if c.company else "Unknown",
                "date": c.created_at.strftime("%d/%m/%Y")
            } for c in recent_contacts
        ]
    }
