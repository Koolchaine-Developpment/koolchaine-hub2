import threading
import time
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.campaign import Campaign, CampaignStatus
from app.models.company import Company
from app.models.contact import Contact, ContactStatus
from app.services.sirene import sirene_service
from app.services.dropcontact import dropcontact_service
from app.api.prospection import launch_sequence

class CampaignProcessor:
    def start_campaign(self, campaign_id: int):
        thread = threading.Thread(target=self._process_campaign, args=(campaign_id,))
        thread.start()

    def _process_campaign(self, campaign_id: int):
        db: Session = SessionLocal()
        try:
            campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            if not campaign:
                return

            campaign.status = CampaignStatus.PROCESSING
            db.commit()

            filters = campaign.filters
            target_volume = filters.get("volume", 50)
            
            # 1. Fetch from SIRENE
            res = sirene_service.search_companies(
                naf_codes=filters.get("naf", []),
                size_ranges=filters.get("size"),
                location=filters.get("location"),
                per_page=min(target_volume, 100) # Basic implementation: fetch one page
            )
            
            companies_data = res.get("results", [])
            campaign.stats["total_found"] = len(companies_data)
            db.commit()

            # 2. Extract SIRENs and names
            new_contacts = []
            for co in companies_data:
                # Check if company exists or create it
                siren = co.get("siren")
                db_company = db.query(Company).filter(Company.siren == siren).first()
                if not db_company:
                    db_company = Company(
                        siren=siren,
                        name=co.get("nom_raison_sociale") or "Inconnu",
                        naf_code=co.get("activite_principale"),
                        size_range=co.get("tranche_effectif_salarie"),
                        city=co.get("siege", {}).get("libelle_commune"),
                        domain=co.get("finances", {}).get("ca") # Just a placeholder since domain isn't in SIRENE
                    )
                    db.add(db_company)
                    db.flush()

                # Prep for Dropcontact
                # Since SIRENE doesn't give domains, we'd normally need a search step 
                # but for this requirement, we'll try to guess domain from name or use Dropcontact's search if available
                # For now, we'll use a mocked domain discovery if not provided
                domain = f"{db_company.name.lower().replace(' ', '')}.fr"
                new_contacts.append({"domain": domain, "company_id": db_company.id})

            # 3. Batch Enrich via Dropcontact (batches of 10)
            enriched_contacts = []
            for i in range(0, len(new_contacts), 10):
                batch = new_contacts[i:i+10]
                results = dropcontact_service.enrich_contacts(batch)
                
                for r in results:
                    # Filter by role priority
                    # Simple check: if job_title matches any in role_priority
                    job_title = r.get("job_title", "").lower()
                    matches_priority = any(p.lower() in job_title for p in campaign.role_priority)
                    
                    if matches_priority and r.get("email"):
                        # Create Contact
                        contact = Contact(
                            company_id=next(c["company_id"] for c in batch if c["domain"] == r.get("domain")),
                            campaign_id=campaign.id,
                            first_name=r.get("first_name", ""),
                            last_name=r.get("last_name", ""),
                            email=r.get("email"),
                            job_title=r.get("job_title", ""),
                            status=ContactStatus.NEW
                        )
                        db.add(contact)
                        enriched_contacts.append(contact)
                
                campaign.stats["enriched"] = len(enriched_contacts)
                db.commit()
                time.sleep(2) # Prevent hammering Dropcontact too hard

            # 4. Auto-launch Sequence
            if campaign.sequence_id and enriched_contacts:
                contact_ids = [c.id for c in enriched_contacts]
                launch_sequence(campaign.sequence_id, contact_ids, db)

            campaign.status = CampaignStatus.COMPLETED
            db.commit()

        except Exception as e:
            if campaign:
                campaign.status = CampaignStatus.FAILED
                campaign.stats["error"] = str(e)
                db.commit()
        finally:
            db.close()

campaign_processor = CampaignProcessor()
