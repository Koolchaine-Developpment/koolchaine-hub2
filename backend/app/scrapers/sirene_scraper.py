import httpx
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class SireneScraper:
    def __init__(self):
        self.base_url = "https://recherche-entreprises.api.gouv.fr/search"

    def search_companies(
        self, 
        naf_codes: List[str], 
        size_ranges: Optional[List[str]] = None,
        page: int = 1,
        per_page: int = 25
    ) -> List[Dict[str, Any]]:
        """
        Recherche des sociétés via l'API Recherche Entreprises (Gouv).
        """
        params = {
            "activite_principale": ",".join([code.replace(".", "") for code in naf_codes]),
            "page": page,
            "per_page": per_page,
            "etat_administratif": "A"
        }

        if size_ranges:
            params["tranche_effectif_salarie"] = ",".join(size_ranges)

        try:
            with httpx.Client() as client:
                response = client.get(self.base_url, params=params, timeout=15.0)
                response.raise_for_status()
                data = response.json()
                results = data.get("results", [])
                
                # Transformation pour correspondre au modèle Company
                transformed = []
                for res in results:
                    transformed.append({
                        "siren": res.get("siren"),
                        "nom": res.get("nom_raison_sociale"),
                        "code_naf": res.get("activite_principale"),
                        "effectifs": self._parse_effectifs(res.get("tranche_effectif_salarie")),
                        "ville": res.get("siege", {}).get("libelle_commune"),
                        "code_postal": res.get("siege", {}).get("code_postal"),
                        "site_web": res.get("finances", {}).get("ca") # Note: SIRENE doesn't provide URL, will be enriched later
                    })
                return transformed
        except Exception as e:
            logger.error(f"Erreur SIRENE: {e}")
            return []

    def _parse_effectifs(self, tranche: Optional[str]) -> int:
        """Convertit les codes de tranche Insee en nombre approximatif."""
        mapping = {
            "00": 0, "01": 1, "02": 3, "03": 7, "11": 15, "12": 35, 
            "21": 75, "22": 150, "31": 250, "32": 750, "41": 1500, 
            "42": 3500, "51": 7500, "52": 15000, "53": 50000
        }
        return mapping.get(tranche, 0)

sirene_scraper = SireneScraper()
