from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
from datetime import datetime
import pandas as pd
from io import BytesIO

from . import models, schemas, crud
from .database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Job Application Manager")

# Add validation exception handler to log errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"Validation Error: {exc.errors()}")
    print(f"Request body: {await request.body()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directories
os.makedirs("uploads/cvs", exist_ok=True)
os.makedirs("uploads/coverletters", exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Job Application Manager API", "status": "running"}

@app.post("/applications/", response_model=schemas.JobApplication)
def create_application(
    application: schemas.JobApplicationCreate,
    db: Session = Depends(get_db)
):
    try:
        print(f"Received application data: {application.model_dump()}")
        return crud.create_application(db=db, application=application)
    except Exception as e:
        print(f"Error creating application: {str(e)}")
        raise

@app.get("/applications/", response_model=List[schemas.JobApplication])
def read_applications(
    skip: int = 0,
    limit: int = 1000,
    status: Optional[str] = None,
    domain: Optional[str] = None,
    search: Optional[str] = None,
    work_type: Optional[str] = None,
    tags: Optional[str] = None,
    include_archived: bool = False,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    status_stage: Optional[str] = None,
    db: Session = Depends(get_db)
):
    applications = crud.get_applications(
        db, skip=skip, limit=limit, status=status, domain=domain,
        search=search, work_type=work_type, tags=tags,
        include_archived=include_archived, sort_by=sort_by, sort_order=sort_order,
        status_stage=status_stage
    )
    return applications

@app.get("/applications/{application_id}", response_model=schemas.JobApplication)
def read_application(application_id: int, db: Session = Depends(get_db)):
    db_application = crud.get_application(db, application_id=application_id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return db_application

@app.put("/applications/{application_id}", response_model=schemas.JobApplication)
def update_application(
    application_id: int,
    application: schemas.JobApplicationUpdate,
    db: Session = Depends(get_db)
):
    db_application = crud.update_application(db, application_id=application_id, application=application)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return db_application

@app.delete("/applications/{application_id}")
def delete_application(application_id: int, db: Session = Depends(get_db)):
    success = crud.delete_application(db, application_id=application_id)
    if not success:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application deleted successfully"}

# Archive/Unarchive endpoints
@app.put("/applications/{application_id}/archive")
def archive_application(application_id: int, db: Session = Depends(get_db)):
    db_application = crud.archive_application(db, application_id=application_id, archive=True)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application archived successfully"}

@app.put("/applications/{application_id}/unarchive")
def unarchive_application(application_id: int, db: Session = Depends(get_db)):
    db_application = crud.archive_application(db, application_id=application_id, archive=False)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application unarchived successfully"}

# Bulk operations
@app.post("/applications/bulk/delete")
def bulk_delete_applications(application_ids: List[int], db: Session = Depends(get_db)):
    count = crud.bulk_delete_applications(db, application_ids=application_ids)
    return {"message": f"Deleted {count} applications successfully"}

@app.post("/applications/bulk/archive")
def bulk_archive_applications(application_ids: List[int], db: Session = Depends(get_db)):
    count = crud.bulk_archive_applications(db, application_ids=application_ids, archive=True)
    return {"message": f"Archived {count} applications successfully"}

@app.post("/applications/bulk/unarchive")
def bulk_unarchive_applications(application_ids: List[int], db: Session = Depends(get_db)):
    count = crud.bulk_archive_applications(db, application_ids=application_ids, archive=False)
    return {"message": f"Unarchived {count} applications successfully"}

@app.post("/applications/bulk/update-status")
def bulk_update_status(application_ids: List[int], status: str, stage: Optional[str] = None, db: Session = Depends(get_db)):
    count = crud.bulk_update_status(db, application_ids=application_ids, status=status, stage=stage)
    return {"message": f"Updated status for {count} applications successfully"}

# Get all unique tags
@app.get("/tags/")
def get_all_tags(db: Session = Depends(get_db)):
    tags = crud.get_all_tags(db)
    return tags

@app.post("/applications/{application_id}/upload/{doc_type}")
async def upload_document(
    application_id: int,
    doc_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if doc_type not in ["cv", "coverletter"]:
        raise HTTPException(status_code=400, detail="Invalid document type")
    
    # Check if application exists
    db_application = crud.get_application(db, application_id=application_id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Save file
    file_extension = os.path.splitext(file.filename)[1]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{application_id}_{timestamp}{file_extension}"
    
    if doc_type == "cv":
        filepath = f"uploads/cvs/{filename}"
    else:
        filepath = f"uploads/coverletters/{filename}"
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update database
    updated_app = crud.update_document(db, application_id, doc_type, file.filename, filepath)
    
    return {"message": f"{doc_type} uploaded successfully", "filename": file.filename}

@app.get("/applications/{application_id}/download/{doc_type}")
def download_document(
    application_id: int,
    doc_type: str,
    db: Session = Depends(get_db)
):
    db_application = crud.get_application(db, application_id=application_id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if doc_type == "cv":
        filepath = db_application.cv_filepath
        filename = db_application.cv_filename
    elif doc_type == "coverletter":
        filepath = db_application.coverletter_filepath
        filename = db_application.coverletter_filename
    else:
        raise HTTPException(status_code=400, detail="Invalid document type")
    
    if not filepath or not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(filepath, filename=filename)

@app.get("/statistics/", response_model=schemas.ApplicationStats)
def get_statistics(db: Session = Depends(get_db)):
    return crud.get_statistics(db)

@app.get("/export/excel")
def export_to_excel(db: Session = Depends(get_db)):
    """Export all job applications to Excel file"""
    applications = crud.get_all_applications_for_export(db)
    
    if not applications:
        raise HTTPException(status_code=404, detail="No applications to export")
    
    # Prepare data for Excel
    data = []
    for app in applications:
        data.append({
            "ID": app.id,
            "Company Name": app.company_name,
            "Job Title": app.job_title,
            "Domain": app.domain or "",
            "Location": app.location or "",
            "Work Type": app.work_type or "",
            "Status": app.status,
            "Application Date": app.application_date.strftime("%Y-%m-%d %H:%M") if app.application_date else "",
            "Salary Min": app.salary_min or "",
            "Salary Max": app.salary_max or "",
            "Job URL": app.job_url or "",
            "Contact Person": app.contact_person or "",
            "Contact Email": app.contact_email or "",
            "CV Uploaded": "Yes" if app.cv_filename else "No",
            "Cover Letter Uploaded": "Yes" if app.coverletter_filename else "No",
            "Notes": app.notes or "",
            "Created At": app.created_at.strftime("%Y-%m-%d %H:%M") if app.created_at else "",
        })
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Create Excel file in memory
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Job Applications', index=False)
        
        # Auto-adjust column widths
        worksheet = writer.sheets['Job Applications']
        for idx, col in enumerate(df.columns):
            max_length = max(
                df[col].astype(str).apply(len).max(),
                len(col)
            )
            worksheet.column_dimensions[chr(65 + idx)].width = min(max_length + 2, 50)
    
    output.seek(0)
    
    # Generate filename with current date
    filename = f"job_applications_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/domains/")
def get_unique_domains(db: Session = Depends(get_db)):
    """Get list of unique domains from applications"""
    domains = db.query(models.JobApplication.domain).filter(
        models.JobApplication.domain.isnot(None)
    ).distinct().all()
    return [domain[0] for domain in domains if domain[0]]


# Backup and Restore endpoints
@app.get("/api/backup")
def backup_database():
    """Download the current database file backup"""
    db_path = "job_tracker.db"
    
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Database file not found")
        
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"job_tracker_backup_{timestamp}.db"
    
    return FileResponse(
        path=db_path,
        filename=filename,
        media_type="application/octet-stream"
    )

@app.post("/api/restore")
async def restore_database(file: UploadFile = File(...)):
    """Restore database from uploaded file"""
    if not file.filename.endswith('.db'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .db file")
    
    db_path = "job_tracker.db"
    backup_path = f"job_tracker.db.bak_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    try:
        # Create a backup of the current DB just in case
        if os.path.exists(db_path):
            shutil.copy2(db_path, backup_path)
            
        # Save uploaded file
        with open(db_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"message": "Database restored successfully. Please refresh the page."}
        
    except Exception as e:
        # Try to restore from backup if something went wrong
        if os.path.exists(backup_path):
            shutil.copy2(backup_path, db_path)
        raise HTTPException(status_code=500, detail=f"Error restoring database: {str(e)}")
