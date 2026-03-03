import base64
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response, RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.models.email_log import EmailLog, EmailStatus

router = APIRouter()

# 1x1 transparent GIF pixel base64 encoded
TRANSPARENT_PIXEL = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")

@router.get("/open/{tracking_id}")
def track_email_open(tracking_id: str, db: Session = Depends(get_db)):
    """
    Called when an email is opened. Returns a transparent 1x1 pixel.
    No authentication required as it's triggered by external mail clients.
    """
    log = db.query(EmailLog).filter(EmailLog.tracking_id == tracking_id).first()
    
    if log and not log.opened_at:
        log.opened_at = datetime.utcnow()
        if log.status != EmailStatus.REPLIED: # Don't override if already replied
            log.status = EmailStatus.OPENED
        db.commit()

    return Response(content=TRANSPARENT_PIXEL, media_type="image/gif")

@router.get("/click/{tracking_id}")
def track_email_click(tracking_id: str, url: str = Query(...), db: Session = Depends(get_db)):
    """
    Called when a link in an email is clicked. 
    Logs the click and redirects to the original URL.
    """
    log = db.query(EmailLog).filter(EmailLog.tracking_id == tracking_id).first()
    
    if log:
        if not log.clicked_at:
            log.clicked_at = datetime.utcnow()
        # Also mark as opened if it wasn't already (click implies open)
        if not log.opened_at:
            log.opened_at = datetime.utcnow()
        
        if log.status not in (EmailStatus.REPLIED, EmailStatus.OPENED):
            log.status = EmailStatus.OPENED
            
        db.commit()
    
    return RedirectResponse(url=url)
