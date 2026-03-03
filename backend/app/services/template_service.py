import os
from bs4 import BeautifulSoup
from app.models.contact import Contact

class TemplateService:
    def __init__(self):
        self.base_url = os.getenv("ALLOWED_ORIGINS", "http://localhost").split(",")[0]

    def resolve_placeholders(self, html_content: str, contact: Contact) -> str:
        """Replace {{...}} placeholders with contact data."""
        replacements = {
            "prenom": contact.first_name if contact.first_name else "",
            "entreprise": contact.company.name if contact.company else "",
            "produit": "Cool Cordes" # Static for now, could be in settings
        }
        
        # Add any custom extra_data variables here if implemented later
        
        resolved_html = html_content
        for key, value in replacements.items():
            # Basic string replacement for placeholders {{key}}
            placeholder = f"{{{{{key}}}}}"
            resolved_html = resolved_html.replace(placeholder, str(value))
            
        return resolved_html

    def inject_tracking(self, html_content: str, tracking_id: str) -> str:
        """
        Inject a 1x1 tracking pixel and wrap all hrefs with the tracking domain.
        """
        if not tracking_id:
            return html_content
            
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # 1. Inject tracking pixel
        pixel_url = f"{self.base_url}/track/open/{tracking_id}"
        pixel_img = soup.new_tag("img", src=pixel_url, width="1", height="1", style="display:none;")
        
        # Try to append to body, otherwise append to root
        if soup.body:
            soup.body.append(pixel_img)
        else:
            soup.append(pixel_img)
            
        # 2. Wrap all links for click tracking
        import urllib.parse
        for a_tag in soup.find_all("a", href=True):
            original_url = a_tag["href"]
            # Skip mailto: or tel: links
            if original_url.startswith(("mailto:", "tel:")):
                continue
                
            encoded_url = urllib.parse.quote(original_url)
            tracking_url = f"{self.base_url}/track/click/{tracking_id}?url={encoded_url}"
            a_tag["href"] = tracking_url
            
        return str(soup)
        
    def process_template(self, html_template: str, contact: Contact, tracking_id: str = None) -> str:
        """Full processing pipeline for an email template."""
        resolved = self.resolve_placeholders(html_template, contact)
        final_html = self.inject_tracking(resolved, tracking_id)
        return final_html

template_service = TemplateService()
