import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_host = getattr(settings, "SMTP_HOST", None)
        self.smtp_port = getattr(settings, "SMTP_PORT", 587)
        self.smtp_user = getattr(settings, "SMTP_USER", None)
        self.smtp_pass = getattr(settings, "SMTP_PASS", None)
        self.from_email = getattr(settings, "PROSPECTION_FROM_EMAIL", "hello@koolchaine.com")
        self.from_name = getattr(settings, "PROSPECTION_FROM_NAME", "Cool Cordes")

    def _get_unsubscribe_link(self, contact_id: int) -> str:
        # In a real app, you might want a signed token here for security
        return f"{settings.API_V1_STR}/prospection/contacts/{contact_id}/unsubscribe"

    def send_email(self, to_email: str, subject: str, html_body: str, plain_body: str, contact_id: int) -> bool:
        if not self.smtp_host or not self.smtp_user:
            logger.error("SMTP not configured.")
            return False

        unsubscribe_link = self._get_unsubscribe_link(contact_id)
        
        # Append unsubscribe link to bodies
        html_with_unsub = f"""
        {html_body}
        <br><br>
        <hr style="border: none; border-top: 1px solid #eaeaea;" />
        <p style="font-size: 12px; color: #888;">
            Vous recevez cet email car nous avons identifié votre profil comme pertinent.<br>
            Vous pouvez vous désinscrire à tout moment : <a href="{unsubscribe_link}">Me désinscrire</a>.
        </p>
        """
        plain_with_unsub = f"{plain_body}\n\n---\nPour vous désinscrire : {unsubscribe_link}"

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.from_name} <{self.from_email}>"
        msg["To"] = to_email

        msg.attach(MIMEText(plain_with_unsub, "plain"))
        msg.attach(MIMEText(html_with_unsub, "html"))

        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_pass)
                server.send_message(msg)
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

email_service = EmailService()
