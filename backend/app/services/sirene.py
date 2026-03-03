import httpx
from typing import List, Dict, Any, Optional

class SireneService:
    def __init__(self):
        self.base_url = "https://recherche-entreprises.api.gouv.fr/search"

    def search_companies(
        self, 
        naf_codes: List[str], 
        size_ranges: Optional[List[str]] = None,
        location: Optional[Dict[str, str]] = None,
        page: int = 1,
        per_page: int = 25
    ) -> Dict[str, Any]:
        """
        Search for companies using the French Government's Search API.
        """
        params = {
            "activite_principale": ",".join([code.replace("Z", "") for code in naf_codes]),
            "page": page,
            "per_page": per_page,
            "etat_administratif": "A" # Active companies only
        }

        if size_ranges:
            params["tranche_effectif_salarie"] = ",".join(size_ranges)

        if location:
            if location.get("region"):
                params["region"] = location["region"]
            if location.get("departement"):
                params["departement"] = location["departement"]

        try:
            with httpx.Client() as client:
                response = client.get(self.base_url, params=params, timeout=10.0)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            # In production, log this error
            return {"results": [], "total_results": 0, "total_pages": 0}

    def estimate_count(self, filters: Dict[str, Any]) -> int:
        """ Returns the total number of companies matching the filters. """
        res = self.search_companies(
            naf_codes=filters.get("naf", []),
            size_ranges=filters.get("size"),
            location=filters.get("location"),
            per_page=1
        )
        return res.get("total_results", 0)

sirene_service = SireneService()
