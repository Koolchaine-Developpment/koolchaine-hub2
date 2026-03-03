import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.db.session import Base

class StockAlert(Base):
    __tablename__ = "stock_alerts"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String, unique=True, index=True, nullable=False)
    product_name = Column(String, nullable=False)
    current_stock = Column(Integer, default=0, nullable=False)
    threshold = Column(Integer, default=5, nullable=False)
    
    alerted_at = Column(DateTime, nullable=True)
