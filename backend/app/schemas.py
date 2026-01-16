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
    contact_email: Optional[str] = None
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
    contact_email: Optional[str] = None
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

