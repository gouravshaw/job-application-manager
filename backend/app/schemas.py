from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict

class StatusChange(BaseModel):
    status: str
    date: datetime
    notes: Optional[str] = None
    stage: Optional[str] = None

class JobApplicationBase(BaseModel):
    company_name: str
    job_title: str
    job_url: Optional[str] = None
    location: Optional[str] = None
    work_type: Optional[str] = None
    domain: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    status: str = "Saved"
    application_date: Optional[datetime] = None
    application_deadline: Optional[datetime] = None
    applied_on: Optional[str] = None
    contact_person: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_linkedin: Optional[str] = None
    contact_cold_message_sent: Optional[bool] = False
    contact_cold_message_via: Optional[str] = None
    contact_cold_contact_category: Optional[str] = None
    contact_cold_contact_email: Optional[str] = None
    contact_cold_message_body: Optional[str] = None
    networking_contacts: Optional[List[Dict]] = []
    references: Optional[str] = None
    job_description: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = []
    is_archived: Optional[int] = 0
    interview_notes: Optional[str] = None
    interview_questions: Optional[str] = None
    interview_date: Optional[datetime] = None

class JobApplicationCreate(JobApplicationBase):
    status_stage: Optional[str] = None

class JobApplicationUpdate(BaseModel):
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    job_url: Optional[str] = None
    location: Optional[str] = None
    work_type: Optional[str] = None
    domain: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    status: Optional[str] = None
    status_date: Optional[datetime] = None  # Date for the status change
    status_notes: Optional[str] = None  # Notes for the status change
    status_stage: Optional[str] = None  # Stage at which this status was recorded (especially for rejections)
    application_date: Optional[datetime] = None
    application_deadline: Optional[datetime] = None
    applied_on: Optional[str] = None
    contact_person: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_linkedin: Optional[str] = None
    contact_cold_message_sent: Optional[bool] = None
    contact_cold_message_via: Optional[str] = None
    contact_cold_contact_category: Optional[str] = None
    contact_cold_contact_email: Optional[str] = None
    contact_cold_message_body: Optional[str] = None
    networking_contacts: Optional[List[Dict]] = None
    references: Optional[str] = None
    job_description: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    is_archived: Optional[int] = None
    interview_notes: Optional[str] = None
    interview_questions: Optional[str] = None
    interview_date: Optional[datetime] = None

class JobApplication(JobApplicationBase):
    id: int
    status_history: List[Dict] = []
    application_deadline: Optional[datetime] = None
    cv_filename: Optional[str] = None
    cv_filepath: Optional[str] = None
    coverletter_filename: Optional[str] = None
    coverletter_filepath: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ApplicationStats(BaseModel):
    total_applications: int
    by_status: dict
    by_domain: dict
    by_work_type: dict
    recent_applications: int
    rejections_by_stage: Dict[str, int]


# Cold Message Schemas
class ColdMessageBase(BaseModel):
    contact_name: str
    company_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_linkedin: Optional[str] = None
    via: str  # 'Email', 'LinkedIn Message', 'Other'
    category: Optional[str] = None  # 'Employee', 'Hiring Manager', 'Recruiter', 'Other'
    subject: Optional[str] = None
    message_body: Optional[str] = None
    sent_date: Optional[datetime] = None
    got_reply: Optional[bool] = False
    notes: Optional[str] = None
    connection_id: Optional[int] = None  # link to a linkedin_connection

class ColdMessageCreate(ColdMessageBase):
    pass

class ColdMessageUpdate(BaseModel):
    contact_name: Optional[str] = None
    company_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_linkedin: Optional[str] = None
    via: Optional[str] = None
    category: Optional[str] = None
    subject: Optional[str] = None
    message_body: Optional[str] = None
    sent_date: Optional[datetime] = None
    got_reply: Optional[bool] = None
    notes: Optional[str] = None
    connection_id: Optional[int] = None

class ColdMessage(ColdMessageBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ColdMessageStats(BaseModel):
    total: int
    by_via: Dict[str, int]
    by_category: Dict[str, int]
    reply_count: int
    reply_rate: float


# LinkedIn Connection Request Schemas
class LinkedInConnectionBase(BaseModel):
    contact_name: str
    linkedin_profile_id: Optional[str] = None
    company_name: Optional[str] = None
    category: Optional[str] = None          # 'Recruiter', 'Hiring Manager', 'Employee', 'Other'
    connection_status: str = "Pending"      # 'Pending', 'Accepted', 'Withdrawn'
    stage: Optional[str] = "Requested"     # 'Need to Connect' | 'Requested'
    requested_on: Optional[datetime] = None
    accepted_on: Optional[datetime] = None
    cold_message_sent: Optional[bool] = False
    cold_message_id: Optional[int] = None
    follow_up_date: Optional[datetime] = None
    notes: Optional[str] = None

class LinkedInConnectionCreate(LinkedInConnectionBase):
    pass

class LinkedInConnectionUpdate(BaseModel):
    contact_name: Optional[str] = None
    linkedin_profile_id: Optional[str] = None
    company_name: Optional[str] = None
    category: Optional[str] = None
    connection_status: Optional[str] = None
    stage: Optional[str] = None
    requested_on: Optional[datetime] = None
    accepted_on: Optional[datetime] = None
    cold_message_sent: Optional[bool] = None
    cold_message_id: Optional[int] = None
    follow_up_date: Optional[datetime] = None
    notes: Optional[str] = None

class LinkedInConnection(LinkedInConnectionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LinkedInConnectionStats(BaseModel):
    total: int
    need_to_connect: int
    pending: int
    accepted: int
    withdrawn: int
    cold_message_sent: int
    accepted_no_message: int
    acceptance_rate: float


