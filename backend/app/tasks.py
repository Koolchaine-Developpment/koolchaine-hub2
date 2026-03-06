import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.email_log import EmailLog, EmailStatus
from app.models.contact import Contact, ContactStatus
from app.services.email import email_service

logger = logging.getLogger(__name__)

def process_pending_emails():
    """Background task that runs periodically to send pending sequence emails."""
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        # Find pending emails scheduled for now or earlier
        pending_logs = db.query(EmailLog).filter(
            EmailLog.status == EmailStatus.PENDING,
            EmailLog.scheduled_for <= now
        ).all()
        
        logger.info(f"Processing {len(pending_logs)} pending emails.")
        
        for log in pending_logs:
            contact = log.contact
            sequence = log.sequence
            
            # Check unsubscribe or replied status
            if contact.status in (ContactStatus.REPLIED, ContactStatus.UNSUBSCRIBED):
                log.status = EmailStatus.FAILED
                log.error_message = f"Contact status is {contact.status}"
                continue
                
            steps = sequence.steps
            if log.step_index >= len(steps):
                log.status = EmailStatus.FAILED
                log.error_message = "Step index out of range"
                continue
                
            step = steps[log.step_index]
            subject = step.get("subject", "No Subject")
            body_template = step.get("body_template", "")
            
            # Simple template replacement
            html_body = body_template.replace("{{first_name}}", contact.first_name).replace("{{last_name}}", contact.last_name)
            plain_body = html_body # In reality, strip HTML for plain text
            
            success = email_service.send_email(
                to_email=contact.email,
                subject=subject,
                html_body=html_body,
                plain_body=plain_body,
                contact_id=contact.id
            )
            
            if success:
                log.status = EmailStatus.SENT
                log.sent_at = datetime.utcnow()
                
                # Schedule the next step if exists
                if log.step_index + 1 < len(steps):
                    next_step = steps[log.step_index + 1]
                    delay_days = next_step.get("delay_days", 1)
                    next_scheduled_for = now + datetime.timedelta(days=delay_days)
                    
                    next_log = EmailLog(
                        contact_id=contact.id,
                        sequence_id=sequence.id,
                        step_index=log.step_index + 1,
                        status=EmailStatus.PENDING,
                        scheduled_for=next_scheduled_for
                    )
                    db.add(next_log)
            else:
                log.status = EmailStatus.FAILED
                log.error_message = "SMTP sending failed"
                
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error in processing emails: {e}")
    finally:
        db.close()

def sync_shopify_orders():
    """Stub: Shopify sync task."""
    logger.info("Shopify sync task is currently disabled (Stub).")

def check_stock_alerts():
    """Stub: Stock alert task."""
    logger.info("Stock alert task is currently disabled (Stub).")
