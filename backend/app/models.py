from sqlalchemy import Column, Integer, String, DateTime, Text, Float, JSON
from sqlalchemy.sql import func
from .database import Base

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True, nullable=False)
    job_title = Column(String, nullable=False)
    job_url = Column(String)
    location = Column(String)
    work_type = Column(String)  # Remote, Hybrid, On-site
    domain = Column(String)  # Domain/Industry (e.g., Cloud Computing, DevOps, Software Engineering)
    salary_min = Column(Float)
    salary_max = Column(Float)
    
    status = Column(String, default="Saved")  # Saved, To Apply, Applied, Screening, Interview, Offer, Rejected, Withdrawn
    status_history = Column(JSON, default=list)  # Track all status changes with dates
    
    application_date = Column(DateTime(timezone=True))
    application_deadline = Column(DateTime(timezone=True))  # Deadline to apply
    applied_on = Column(String)  # Where the application was submitted (LinkedIn, Indeed, Company Website, etc.)
    
    cv_filename = Column(String)
    cv_filepath = Column(String)
    coverletter_filename = Column(String)
    coverletter_filepath = Column(String)
    
    contact_person = Column(String)
    contact_email = Column(String)
    contact_linkedin = Column(String)  # LinkedIn profile URL for contact person
    
    networking_contacts = Column(JSON, default=list)  # List of {name, linkedin_url}
    
    references = Column(Text)  # References information
    job_description = Column(Text)  # Full job description
    
    notes = Column(Text)
    
    # Enhanced features
    tags = Column(JSON, default=list)  # Custom tags/labels
    is_archived = Column(Integer, default=0)  # Archive status (0=active, 1=archived)
    interview_notes = Column(Text)  # Interview preparation notes
    interview_questions = Column(Text)  # Questions prepared/asked
    interview_date = Column(DateTime(timezone=True))  # Scheduled interview date
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

