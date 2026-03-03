from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.contact import ContactStatus

class CompanyBase(BaseModel):
    siren: str
    name: str
    naf_code: Optional[str] = None
    size_range: Optional[str] = None
    city: Optional[str] = None
    domain: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyOut(CompanyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ContactBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    job_title: Optional[str] = None
    status: ContactStatus = ContactStatus.NEW

class ContactCreate(ContactBase):
    company_id: int

class ContactOut(ContactBase):
    id: int
    company_id: int
    created_at: datetime
    company: Optional[CompanyOut] = None

    class Config:
        from_attributes = True

class SequenceStep(BaseModel):
    delay_days: int
    delay_hours: int = 0
    template_id: int
    condition: str = "always"  # ["always", "if_not_opened", "if_opened_no_reply", "if_clicked_no_reply"]
    stop_on_reply: bool = True

class EmailSequenceCreate(BaseModel):
    name: str
    steps: List[SequenceStep]

class EmailSequenceOut(BaseModel):
    id: int
    name: str
    steps: List[SequenceStep]
    created_at: datetime
    
class EmailTemplateCreate(BaseModel):
    name: str
    category: str
    subject: str
    html_content: str
    placeholders: List[str] = []
    has_signature: bool = False
    signature_html: Optional[str] = None

class EmailTemplateOut(EmailTemplateCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
