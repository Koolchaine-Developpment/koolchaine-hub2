import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from app.db.session import Base

class Order(Base):
    __tablename__ = "shopify_orders"

    id = Column(Integer, primary_key=True, index=True)
    shopify_id = Column(String, unique=True, index=True, nullable=False)
    order_number = Column(String, unique=True, nullable=False)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=True)
    shipping_address = Column(JSON, nullable=False)
    items = Column(JSON, nullable=False)
    status = Column(String, default="unfulfilled") # e.g. unfulfilled, fulfilled, cancelled
    total_price = Column(Float, nullable=False)
    label_url = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    label_generated_at = Column(DateTime, nullable=True)
    shipped_at = Column(DateTime, nullable=True)
