import httpx
from typing import List, Dict, Any, Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class ShopifyService:
    def __init__(self):
        self.store_url = getattr(settings, "SHOPIFY_STORE_URL", "") or ""
        self.access_token = getattr(settings, "SHOPIFY_ACCESS_TOKEN", "") or ""
        self.api_version = "2024-01" # Using a recent stable version
        
        # Strip trailing slash if any
        if self.store_url.endswith("/"):
            self.store_url = self.store_url[:-1]
            
        if not self.store_url.endswith(".myshopify.com"):
            # Assume it's just the store name
            if not self.store_url.startswith("http"):
                self.store_url = f"https://{self.store_url}.myshopify.com"
                
        self.base_url = f"{self.store_url}/admin/api/{self.api_version}"
        
        self.headers = {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": self.access_token
        }

    def _request(self, method: str, endpoint: str, params: dict = None) -> Optional[Dict]:
        if not self.store_url or not self.access_token:
            logger.error("Shopify credentials not properly configured.")
            return None
            
        url = f"{self.base_url}/{endpoint}"
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.request(method, url, headers=self.headers, params=params)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Shopify API error ({method} {endpoint}): {e}")
            return None

    def fetch_recent_orders(self, limit: int = 50, status: str = "any") -> List[Dict[str, Any]]:
        """Stub: To be implemented by B2C collaborator."""
        logger.info("ShopifyService.fetch_recent_orders called (Stub).")
        return []

    def fetch_product_inventory(self) -> List[Dict[str, Any]]:
        """Stub: To be implemented by B2C collaborator."""
        logger.info("ShopifyService.fetch_product_inventory called (Stub).")
        return []

shopify_service = ShopifyService()
