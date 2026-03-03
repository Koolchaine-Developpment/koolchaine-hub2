import httpx
import time
from typing import Optional, List, Dict, Any
from app.core.config import settings

class DropcontactService:
    def __init__(self):
        # We assume DROPCONTACT_API_KEY is added to settings later.
        self.api_key = getattr(settings, "DROPCONTACT_API_KEY", None)
        self.base_url = "https://api.dropcontact.io/batch"

    def enrich_contacts(self, contacts_data: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """
        Enriches a list of contacts via Dropcontact API.
        contacts_data format: [{"first_name": "...", "last_name": "...", "domain": "..."}]
        """
        if not self.api_key:
            return [] # Fail gracefully if no API key

        headers = {
            "Content-Type": "application/json",
            "X-Access-Token": self.api_key
        }

        # Submit the batch request
        try:
            with httpx.Client() as client:
                response = client.post(
                    self.base_url,
                    json={"data": contacts_data},
                    headers=headers,
                    timeout=10.0
                )
                response.raise_for_status()
                batch_id = response.json().get("batch_id")
                
                if not batch_id:
                    return []
                
                # Poll for results
                return self._poll_results(client, batch_id, headers)
        except Exception as e:
            # Handle gracefully (log error in production)
            return []

    def _poll_results(self, client: httpx.Client, batch_id: str, headers: Dict[str, str], max_retries: int = 12) -> List[Dict[str, Any]]:
        """ Polls the Dropcontact API until the batch is processed. """
        url = f"{self.base_url}/{batch_id}"
        
        for _ in range(max_retries):
            # Dropcontact usually takes a few seconds to a minute
            time.sleep(5) 
            try:
                response = client.get(url, headers=headers, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                if data.get("success"):
                    return data.get("data", [])
            except Exception:
                pass
                
        return []

    @staticmethod
    def _get_job_priority(job_title: str) -> int:
        """ 
        1. Directeur·rice Marketing
        2. Responsable Marketing
        3. Chargé·e de communication
        4. Responsable événementiel
        5. Any other marketing/events profile
        """
        if not job_title:
            return 99 # Lowest priority
            
        title_lower = job_title.lower()
        
        if "directeur" in title_lower and "marketing" in title_lower:
            return 1
        if "responsable" in title_lower and "marketing" in title_lower:
            return 2
        if "chargé" in title_lower and "communication" in title_lower:
            return 3
        if "responsable" in title_lower and "événementiel" in title_lower:
            return 4
        if "marketing" in title_lower or "event" in title_lower or "événementiel" in title_lower:
            return 5
            
        return 99

    @staticmethod
    def sort_contacts_by_priority(contacts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """ Sort enriched contacts by their job title priority. """
        return sorted(contacts, key=lambda c: DropcontactService()._get_job_priority(c.get("job_title", "")))

dropcontact_service = DropcontactService()
