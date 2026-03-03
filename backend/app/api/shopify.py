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

@router.get("/orders", response_model=List[OrderOut])
def list_orders(status: str = "unfulfilled", limit: int = 50, db: Session = Depends(get_db)):
    query = db.query(Order)
    if status and status != "any":
        query = query.filter(Order.status == status)
    
    return query.order_by(desc(Order.created_at)).limit(limit).all()

@router.post("/orders/sync")
def sync_orders(db: Session = Depends(get_db)):
    """Manually trigger a sync of recent orders from Shopify."""
    raw_orders = shopify_service.fetch_recent_orders(status="any")
    synced_count = 0
    
    for ro in raw_orders:
        shopify_id = str(ro.get("id"))
        existing = db.query(Order).filter(Order.shopify_id == shopify_id).first()
        
        status = "fulfilled" if ro.get("fulfillment_status") == "fulfilled" else "unfulfilled"
        
        if existing:
            # Update status if changed
            if existing.status != status:
                existing.status = status
                synced_count += 1
            continue
            
        # Parse customer
        customer = ro.get("customer", {})
        customer_name = f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip() or "Unknown Client"
        
        # Parse shipping
        shipping = ro.get("shipping_address", {})
        
        # Parse items
        items = []
        for line in ro.get("line_items", []):
            items.append({
                "name": line.get("title"),
                "quantity": line.get("quantity"),
                "sku": line.get("sku"),
                "price": float(line.get("price", 0))
            })
            
        new_order = Order(
            shopify_id=shopify_id,
            order_number=str(ro.get("order_number", "")),
            customer_name=customer_name,
            customer_email=ro.get("email"),
            shipping_address=shipping,
            items=items,
            status=status,
            total_price=float(ro.get("total_price", 0))
        )
        db.add(new_order)
        synced_count += 1
        
    db.commit()
    return {"message": f"Successfully synced {synced_count} orders"}

@router.get("/orders/packing-list")
def generate_packing_list(db: Session = Depends(get_db)):
    """Generate a PDF of all unfulfilled orders."""
    unfulfilled_orders = db.query(Order).filter(Order.status == "unfulfilled").order_by(Order.created_at).all()
    
    orders_data = []
    for o in unfulfilled_orders:
        orders_data.append({
            "order_number": o.order_number,
            "customer_name": o.customer_name,
            "shipping_address": o.shipping_address,
            "items": o.items
        })
        
    pdf_bytes = pdf_service.generate_packing_list_pdf(orders_data)
    
    return Response(content=pdf_bytes, media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=packing_list.pdf"
    })

def generate_label_task(order_id: int):
    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order or order.label_url:
            return
            
        # Generate label via Boxtal
        label_url = boxtal_service.generate_colissimo_label(
            order_number=order.order_number,
            customer_name=order.customer_name,
            shipping_address=order.shipping_address
        )
        if label_url:
            order.label_url = label_url
            order.label_generated_at = datetime.datetime.utcnow()
            db.commit()
    except Exception as e:
        print(f"Background label generation failed: {e}")
    finally:
        db.close()

@router.post("/orders/{order_id}/label")
def generate_label(order_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.label_url:
        return {"message": "Label already exists", "url": order.label_url}

    background_tasks.add_task(generate_label_task, order_id=order.id)
    return {"message": "Label generation started in background", "status": "pending"}

@router.get("/stock", response_model=List[StockAlertOut])
def get_stock(db: Session = Depends(get_db)):
    """Returns local stock alerts. Ideally syncs with Shopify first if needed."""
    return db.query(StockAlert).all()

@router.post("/webhook")
def shopify_webhook(payload: dict, db: Session = Depends(get_db)):
    """Receive a new order creation webhook from Shopify."""
    # In a real app, verify HMAC signature here
    
    shopify_id = str(payload.get("id"))
    if not shopify_id:
        return {"status": "ignored"}
        
    if db.query(Order).filter(Order.shopify_id == shopify_id).first():
        return {"status": "already_exists"}
        
    # Same parsing logic as sync
    customer = payload.get("customer", {})
    customer_name = f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip() or "Unknown Client"
    
    items = []
    for line in payload.get("line_items", []):
        items.append({
            "name": line.get("title"),
            "quantity": line.get("quantity"),
            "sku": line.get("sku")
        })
        
    new_order = Order(
        shopify_id=shopify_id,
        order_number=str(payload.get("order_number", "")),
        customer_name=customer_name,
        customer_email=payload.get("email"),
        shipping_address=payload.get("shipping_address", {}),
        items=items,
        status="unfulfilled",
        total_price=float(payload.get("total_price", 0))
    )
    db.add(new_order)
    db.commit()
    
    return {"status": "success", "order_id": new_order.id}
