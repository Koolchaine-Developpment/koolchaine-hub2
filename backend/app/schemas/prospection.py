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
    subject: str
    body_template: str

class EmailSequenceCreate(BaseModel):
    name: str
    steps: List[SequenceStep]

class EmailSequenceOut(BaseModel):
    id: int
    name: str
    steps: List[SequenceStep]
    created_at: datetime

    class Config:
        from_attributes = True
