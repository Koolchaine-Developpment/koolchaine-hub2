import httpx
import logging
import base64
from typing import Optional, Dict
from app.core.config import settings

logger = logging.getLogger(__name__)

class BoxtalService:
    def __init__(self):
        self.api_key = getattr(settings, "BOXTAL_API_KEY", "")
        self.api_secret = getattr(settings, "BOXTAL_API_SECRET", "")
        self.base_url = "https://www.boxtal.com/api/v2" # Using standard mock URL format
        self.default_weight = float(getattr(settings, "DEFAULT_PACKAGE_WEIGHT", 0.1))
        
        # Prepare basic auth
        credentials = f"{self.api_key}:{self.api_secret}"
        encoded_creds = base64.b64encode(credentials.encode()).decode()
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {encoded_creds}"
        }

    def generate_colissimo_label(self, order_number: str, customer_name: str, shipping_address: Dict) -> Optional[str]:
        """
        Calls Boxtal API to generate a Colissimo label.
        Returns the URL of the generated PDF label, or None if failed.
        """
        if not self.api_key or not self.api_secret:
            logger.warning("Boxtal API keys not configured. Simulating label generation.")
            # Simulation for development/testing if keys are missing
            return f"https://mock.boxtal.com/labels/colissimo_{order_number}.pdf"

        # Note: Actual Boxtal v2 API requires detailed payload for parcel, origin, dest, etc.
        # This is a simplified representation of the request struct.
        payload = {
            "shipment": {
                "recipient": {
                    "company": customer_name,
                    "firstname": customer_name.split()[0] if " " in customer_name else customer_name,
                    "lastname": customer_name.split()[-1] if " " in customer_name else "",
                    "address_line1": shipping_address.get("address1", ""),
                    "address_line2": shipping_address.get("address2", ""),
                    "city": shipping_address.get("city", ""),
                    "zipcode": shipping_address.get("zip", ""),
                    "country": shipping_address.get("country_code", "FR"),
                },
                "parcels": [
                    {
                        "weight": self.default_weight
                    }
                ],
                "operator": "COLISSIMO" # Specific carrier selector
            }
        }
        
        try:
            with httpx.Client(timeout=15.0) as client:
                # Assuming /shipments endpoint returns a label URL or ID to fetch the label
                response = client.post(f"{self.base_url}/shipments", json=payload, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                
                # Mocking the JSON path based on typical carrier API responses
                return data.get("shipment", {}).get("label_url")
        except httpx.HTTPError as e:
            logger.error(f"Failed to generate Boxtal label for order {order_number}: {e}")
            return None

boxtal_service = BoxtalService()
