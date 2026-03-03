from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class OrderLineItem(BaseModel):
    name: str
    quantity: int
    sku: Optional[str] = None
    price: Optional[float] = None

class OrderAddress(BaseModel):
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    zip: Optional[str] = None
    country_code: Optional[str] = None

class OrderBase(BaseModel):
    shopify_id: str
    order_number: str
    customer_name: str
    customer_email: Optional[str] = None
    status: str
    total_price: float
    shipping_address: Dict[str, Any]
    items: List[Dict[str, Any]]
    label_url: Optional[str] = None

class OrderOut(OrderBase):
    id: int
    created_at: datetime
    label_generated_at: Optional[datetime] = None
    shipped_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class StockAlertBase(BaseModel):
    product_id: str
    product_name: str
    current_stock: int
    threshold: int

class StockAlertCreate(StockAlertBase):
    pass

class StockAlertUpdate(BaseModel):
    threshold: int

class StockAlertOut(StockAlertBase):
    id: int
    alerted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
