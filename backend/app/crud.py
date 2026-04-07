from sqlalchemy.orm import Session
from sqlalchemy import func, extract, or_, and_
from datetime import datetime, timedelta
from typing import List, Optional
from collections import defaultdict
from . import models, schemas
import os
import json

def get_application(db: Session, application_id: int):
    return db.query(models.JobApplication).filter(models.JobApplication.id == application_id).first()

def _normalize_history(history):
    """Return history as a list regardless of storage format."""
    h = history
    # Attempt up to 2 parses for double-encoded JSON strings
    for _ in range(2):
        if isinstance(h, str):
            try:
                h = json.loads(h)
            except json.JSONDecodeError:
                break
        else:
            break
    if isinstance(h, list):
        return h
    if isinstance(h, dict) and h.get("status"):
        return [h]
    return []


def _latest_rejection_stage(history):
    entries = _normalize_history(history)
    if not entries:
        return None
        
    # Find the LATEST rejection event (search backwards)
    for i in range(len(entries) - 1, -1, -1):
        entry = entries[i]
        if isinstance(entry, dict) and entry.get("status") == "Rejected":
            stage_label = entry.get("stage")
            
            # Backtracking logic
            if not stage_label or stage_label == "Rejected" or stage_label in ["Saved", "To Apply", "Unknown stage"]:
                found_prev = False
                # Look backwards from the rejection event
                for prev_entry in reversed(entries[:i]):
                    if isinstance(prev_entry, dict) and prev_entry.get("status") and prev_entry.get("status") not in ["Rejected", "Saved", "To Apply"]:
                        stage_label = prev_entry.get("status")
                        found_prev = True
                        break
                
                if not found_prev:
                    stage_label = "Not specified"

            # Standardize labels
            if stage_label == "Rejected":
                stage_label = "Applied"
                
            if stage_label in ["Applied", "CV / Resume Screening"]:
                stage_label = "CV Screening"
                
            return stage_label or "Not specified"
            
    return None


def get_applications(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None, 
                     domain: Optional[str] = None, search: Optional[str] = None, 
                     work_type: Optional[str] = None, tags: Optional[str] = None,
                     include_archived: bool = False, sort_by: str = "created_at", 
                     sort_order: str = "desc", status_stage: Optional[str] = None):
    query = db.query(models.JobApplication)
    
    # Filter by archived status
    if not include_archived:
        query = query.filter(models.JobApplication.is_archived == 0)
    
    # Filter by status
    if status:
        query = query.filter(models.JobApplication.status == status)
    
    # Filter by domain
    if domain:
        query = query.filter(models.JobApplication.domain == domain)
    
    # Filter by work type
    if work_type:
        query = query.filter(models.JobApplication.work_type == work_type)
    
    # Filter by tags
    if tags:
        tag_list = tags.split(',')
        for tag in tag_list:
            query = query.filter(models.JobApplication.tags.contains(tag.strip()))
    
    # Global search across multiple fields
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.JobApplication.company_name.ilike(search_term),
                models.JobApplication.job_title.ilike(search_term),
                models.JobApplication.location.ilike(search_term),
                models.JobApplication.domain.ilike(search_term),
                models.JobApplication.notes.ilike(search_term),
                models.JobApplication.job_description.ilike(search_term)
            )
        )
    
    # Sorting
    sort_column = getattr(models.JobApplication, sort_by, models.JobApplication.created_at)
    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())
    
    results = query.offset(skip).limit(limit).all()

    # Filter by rejection stage in Python (status_history is JSON)
    if status_stage:
        filtered = []
        for app in results:
            if app.status != "Rejected":
                continue
            stage = _latest_rejection_stage(app.status_history)
            stage_label = stage or "Not specified"
            if stage_label == status_stage:
                filtered.append(app)
        return filtered

    return results

def create_application(db: Session, application: schemas.JobApplicationCreate):
    app_data = application.model_dump()
    status_stage = app_data.pop("status_stage", None)
    
    # Initialize status history with the initial status
    status = app_data.get("status", "Saved")
    
    # Set appropriate notes based on status
    if status in ["Saved", "To Apply"]:
        notes = "Job saved for later"
    else:
        notes = "Application submitted"
    
    initial_status = {
        "status": status,
        "date": app_data.get("application_date", datetime.now()).isoformat() if app_data.get("application_date") else datetime.now().isoformat(),
        "notes": notes,
        "stage": status_stage or status
    }
    app_data["status_history"] = [initial_status]
    
    db_application = models.JobApplication(**app_data)
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application

def update_application(db: Session, application_id: int, application: schemas.JobApplicationUpdate):
    db_application = get_application(db, application_id)
    if db_application:
        update_data = application.model_dump(exclude_unset=True)
        
        # Check if status is being updated
        if "status" in update_data and update_data["status"] != db_application.status:
            # Get status_date and status_notes from update_data
            status_date = update_data.pop("status_date", None) or datetime.now()
            status_notes = update_data.pop("status_notes", None)
            status_stage = update_data.pop("status_stage", None)
            
            if update_data["status"] == "Rejected":
                # Default to previous status (stage reached before rejection) if not provided
                status_stage = status_stage or db_application.status or "Unknown stage"
            else:
                status_stage = status_stage or update_data["status"]
            
            # Create new status history entry
            new_status_entry = {
                "status": update_data["status"],
                "date": status_date.isoformat() if isinstance(status_date, datetime) else status_date,
                "notes": status_notes,
                "stage": status_stage
            }
            
            # Update status history
            if db_application.status_history is None:
                db_application.status_history = []
            
            # Convert to list if it's not already
            status_history = list(db_application.status_history) if db_application.status_history else []
            status_history.append(new_status_entry)
            db_application.status_history = status_history
        else:
            # If status didn't change but a rejection stage update is provided, log it
            stage_update = update_data.pop("status_stage", None)
            status_notes = update_data.pop("status_notes", None)
            status_date = update_data.pop("status_date", None)
            if stage_update and db_application.status == "Rejected":
                new_status_entry = {
                    "status": db_application.status,
                    "date": (status_date or datetime.now()).isoformat() if isinstance(status_date, datetime) else (status_date or datetime.now()).isoformat(),
                    "notes": status_notes,
                    "stage": stage_update
                }
                status_history = list(db_application.status_history) if db_application.status_history else []
                status_history.append(new_status_entry)
                db_application.status_history = status_history
            else:
                # Remove status_date and status_notes if status didn't change and no stage update
                update_data.pop("status_date", None)
                update_data.pop("status_notes", None)
        
        # Apply other updates
        for field, value in update_data.items():
            setattr(db_application, field, value)
        
        db.commit()
        db.refresh(db_application)
    return db_application

def delete_application(db: Session, application_id: int):
    db_application = get_application(db, application_id)
    if db_application:
        # Delete associated files
        if db_application.cv_filepath and os.path.exists(db_application.cv_filepath):
            os.remove(db_application.cv_filepath)
        if db_application.coverletter_filepath and os.path.exists(db_application.coverletter_filepath):
            os.remove(db_application.coverletter_filepath)
        
        db.delete(db_application)
        db.commit()
        return True
    return False

def update_document(db: Session, application_id: int, doc_type: str, filename: str, filepath: str):
    db_application = get_application(db, application_id)
    if db_application:
        if doc_type == "cv":
            # Delete old CV if exists
            if db_application.cv_filepath and os.path.exists(db_application.cv_filepath):
                os.remove(db_application.cv_filepath)
            db_application.cv_filename = filename
            db_application.cv_filepath = filepath
        elif doc_type == "coverletter":
            # Delete old cover letter if exists
            if db_application.coverletter_filepath and os.path.exists(db_application.coverletter_filepath):
                os.remove(db_application.coverletter_filepath)
            db_application.coverletter_filename = filename
            db_application.coverletter_filepath = filepath
        
        db.commit()
        db.refresh(db_application)
    return db_application

def get_statistics(db: Session):
    total = db.query(models.JobApplication).count()
    
    # By status
    status_counts = db.query(
        models.JobApplication.status,
        func.count(models.JobApplication.id)
    ).group_by(models.JobApplication.status).all()
    by_status = {status: count for status, count in status_counts}
    
    # By domain
    domain_counts = db.query(
        models.JobApplication.domain,
        func.count(models.JobApplication.id)
    ).filter(models.JobApplication.domain.isnot(None)).group_by(models.JobApplication.domain).all()
    by_domain = {domain: count for domain, count in domain_counts}
    
    # By work type
    work_type_counts = db.query(
        models.JobApplication.work_type,
        func.count(models.JobApplication.id)
    ).filter(models.JobApplication.work_type.isnot(None)).group_by(models.JobApplication.work_type).all()
    by_work_type = {work_type: count for work_type, count in work_type_counts}
    
    # Recent applications (last 7 days)
    seven_days_ago = datetime.now() - timedelta(days=7)
    recent = db.query(models.JobApplication).filter(
        models.JobApplication.application_date >= seven_days_ago
    ).count()

    # Rejections by stage
    rejection_stage_counts = defaultdict(int)
    applications_with_history = db.query(models.JobApplication.id, models.JobApplication.status_history).all()
    for _, history in applications_with_history:
        if not history:
            continue
        entries = history
        if isinstance(history, str):
            try:
                entries = json.loads(history)
            except json.JSONDecodeError:
                continue
        
        # Normalize to list
        if isinstance(entries, dict):
            entries = [entries]
        if not isinstance(entries, list):
            continue
            
        # Use shared helper to determine stage
        stage_label = _latest_rejection_stage(entries)
        if stage_label:
            rejection_stage_counts[stage_label] += 1
    
    return schemas.ApplicationStats(
        total_applications=total,
        by_status=by_status,
        by_domain=by_domain,
        by_work_type=by_work_type,
        recent_applications=recent,
        rejections_by_stage=dict(rejection_stage_counts)
    )

def get_all_applications_for_export(db: Session) -> List[models.JobApplication]:
    return db.query(models.JobApplication).order_by(models.JobApplication.application_date.desc()).all()

# Archive/Unarchive
def archive_application(db: Session, application_id: int, archive: bool = True):
    db_application = get_application(db, application_id)
    if db_application:
        db_application.is_archived = 1 if archive else 0
        db.commit()
        db.refresh(db_application)
    return db_application

# Bulk operations
def bulk_delete_applications(db: Session, application_ids: List[int]):
    count = 0
    for app_id in application_ids:
        if delete_application(db, app_id):
            count += 1
    return count

def bulk_archive_applications(db: Session, application_ids: List[int], archive: bool = True):
    count = 0
    for app_id in application_ids:
        if archive_application(db, app_id, archive):
            count += 1
    return count

def bulk_update_status(db: Session, application_ids: List[int], status: str, stage: Optional[str] = None):
    count = 0
    for app_id in application_ids:
        db_application = get_application(db, app_id)
        if db_application:
            previous_status = db_application.status
            db_application.status = status
            # Add to status history
            stage_label = stage or (previous_status if status == "Rejected" else status)
            new_status_entry = {
                "status": status,
                "date": datetime.now().isoformat(),
                "notes": "Bulk status update",
                "stage": stage_label
            }
            status_history = list(db_application.status_history) if db_application.status_history else []
            status_history.append(new_status_entry)
            db_application.status_history = status_history
            db.commit()
            count += 1
    return count

# Get all unique tags
def get_all_tags(db: Session) -> List[str]:
    applications = db.query(models.JobApplication).all()
    all_tags = set()
    for app in applications:
        if app.tags:
            # Handle both list and JSON string formats
            if isinstance(app.tags, list):
                all_tags.update(app.tags)
            elif isinstance(app.tags, str):
                try:
                    tags_list = json.loads(app.tags)
                    all_tags.update(tags_list)
                except:
                    pass
    return sorted(list(all_tags))


# ─── Cold Message CRUD ───────────────────────────────────────────────

def create_cold_message(db: Session, cold_message: schemas.ColdMessageCreate):
    data = cold_message.model_dump()
    connection_id = data.get("connection_id")
    if not data.get("sent_date"):
        data["sent_date"] = datetime.now()
    db_msg = models.ColdMessage(**data)
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    # Auto-sync: mark the linked connection as cold_message_sent
    if connection_id:
        db_conn = get_connection(db, connection_id)
        if db_conn:
            db_conn.cold_message_sent = True
            db_conn.cold_message_id = db_msg.id
            db.commit()
    return db_msg

def get_cold_messages(db: Session, search: Optional[str] = None,
                      via: Optional[str] = None, category: Optional[str] = None,
                      sort_by: str = "created_at", sort_order: str = "desc"):
    query = db.query(models.ColdMessage)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                models.ColdMessage.contact_name.ilike(term),
                models.ColdMessage.company_name.ilike(term),
                models.ColdMessage.subject.ilike(term),
                models.ColdMessage.notes.ilike(term),
            )
        )
    if via:
        query = query.filter(models.ColdMessage.via == via)
    if category:
        query = query.filter(models.ColdMessage.category == category)

    sort_col = getattr(models.ColdMessage, sort_by, models.ColdMessage.created_at)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())
    return query.all()

def get_cold_message(db: Session, msg_id: int):
    return db.query(models.ColdMessage).filter(models.ColdMessage.id == msg_id).first()

def update_cold_message(db: Session, msg_id: int, data: schemas.ColdMessageUpdate):
    db_msg = get_cold_message(db, msg_id)
    if not db_msg:
        return None
    updates = data.model_dump(exclude_unset=True)
    old_connection_id = db_msg.connection_id
    for field, value in updates.items():
        setattr(db_msg, field, value)
    db.commit()
    db.refresh(db_msg)
    # Sync connection if connection_id changed
    if "connection_id" in updates:
        new_connection_id = updates["connection_id"]
        # Reset old connection if it was pointing back at this message
        if old_connection_id and old_connection_id != new_connection_id:
            old_conn = get_connection(db, old_connection_id)
            if old_conn and old_conn.cold_message_id == msg_id:
                old_conn.cold_message_sent = False
                old_conn.cold_message_id = None
                db.commit()
        # Set new connection
        if new_connection_id:
            new_conn = get_connection(db, new_connection_id)
            if new_conn:
                new_conn.cold_message_sent = True
                new_conn.cold_message_id = db_msg.id
                db.commit()
    return db_msg

def delete_cold_message(db: Session, msg_id: int):
    db_msg = get_cold_message(db, msg_id)
    if not db_msg:
        return False
    # Reset the linked connection if this was its primary message
    if db_msg.connection_id:
        db_conn = get_connection(db, db_msg.connection_id)
        if db_conn and db_conn.cold_message_id == msg_id:
            db_conn.cold_message_sent = False
            db_conn.cold_message_id = None
            db.commit()
    db.delete(db_msg)
    db.commit()
    return True

def get_cold_message_stats(db: Session):
    total = db.query(models.ColdMessage).count()

    via_counts = db.query(
        models.ColdMessage.via, func.count(models.ColdMessage.id)
    ).group_by(models.ColdMessage.via).all()
    by_via = {v: c for v, c in via_counts}

    cat_counts = db.query(
        models.ColdMessage.category, func.count(models.ColdMessage.id)
    ).filter(models.ColdMessage.category.isnot(None)).group_by(models.ColdMessage.category).all()
    by_category = {c: n for c, n in cat_counts}

    reply_count = db.query(models.ColdMessage).filter(models.ColdMessage.got_reply == True).count()
    reply_rate = round((reply_count / total) * 100, 1) if total > 0 else 0.0

    return schemas.ColdMessageStats(
        total=total,
        by_via=by_via,
        by_category=by_category,
        reply_count=reply_count,
        reply_rate=reply_rate,
    )


# ─── LinkedIn Connection CRUD ─────────────────────────────────────────

def create_connection(db: Session, connection: schemas.LinkedInConnectionCreate):
    data = connection.model_dump()
    if not data.get("requested_on"):
        data["requested_on"] = datetime.now()
    db_conn = models.LinkedInConnection(**data)
    db.add(db_conn)
    db.commit()
    db.refresh(db_conn)
    return db_conn

def get_connections(
    db: Session,
    search: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    cold_message_sent: Optional[bool] = None,
    stage: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
):
    query = db.query(models.LinkedInConnection)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                models.LinkedInConnection.contact_name.ilike(term),
                models.LinkedInConnection.company_name.ilike(term),
                models.LinkedInConnection.linkedin_profile_id.ilike(term),
                models.LinkedInConnection.notes.ilike(term),
            )
        )
    if status:
        query = query.filter(models.LinkedInConnection.connection_status == status)
    if category:
        query = query.filter(models.LinkedInConnection.category == category)
    if cold_message_sent is not None:
        query = query.filter(models.LinkedInConnection.cold_message_sent == cold_message_sent)
    if stage:
        query = query.filter(models.LinkedInConnection.stage == stage)

    sort_col = getattr(models.LinkedInConnection, sort_by, models.LinkedInConnection.created_at)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())
    return query.all()

def get_connection(db: Session, conn_id: int):
    return db.query(models.LinkedInConnection).filter(models.LinkedInConnection.id == conn_id).first()


def check_connection_duplicate(
    db: Session,
    contact_name: str,
    company_name: Optional[str] = None,
    linkedin_profile_id: Optional[str] = None,
) -> Optional[models.LinkedInConnection]:
    """Check if a matching connection already exists.
    Matches on name (required) + company (if provided) + LinkedIn URL (if provided).
    Returns the existing record or None.
    """
    query = db.query(models.LinkedInConnection).filter(
        func.lower(models.LinkedInConnection.contact_name) == contact_name.lower()
    )
    if company_name:
        query = query.filter(
            func.lower(models.LinkedInConnection.company_name) == company_name.lower()
        )
    if linkedin_profile_id:
        # Normalize by stripping trailing slashes for comparison
        normalized = linkedin_profile_id.rstrip('/')
        query = query.filter(
            or_(
                func.lower(models.LinkedInConnection.linkedin_profile_id) == normalized.lower(),
                func.lower(models.LinkedInConnection.linkedin_profile_id) == (normalized.lower() + '/'),
            )
        )
    return query.first()

def update_connection(db: Session, conn_id: int, data: schemas.LinkedInConnectionUpdate):
    db_conn = get_connection(db, conn_id)
    if not db_conn:
        return None
    updates = data.model_dump(exclude_unset=True)
    # Auto-set accepted_on when status flips to Accepted and date not provided
    if updates.get("connection_status") == "Accepted" and not updates.get("accepted_on") and not db_conn.accepted_on:
        updates["accepted_on"] = datetime.now()
    for field, value in updates.items():
        setattr(db_conn, field, value)
    db.commit()
    db.refresh(db_conn)
    return db_conn

def delete_connection(db: Session, conn_id: int):
    db_conn = get_connection(db, conn_id)
    if not db_conn:
        return False
    db.delete(db_conn)
    db.commit()
    return True

def get_connection_stats(db: Session):
    total = db.query(models.LinkedInConnection).count()
    need_to_connect = db.query(models.LinkedInConnection).filter(
        models.LinkedInConnection.stage == "Need to Connect"
    ).count()
    pending = db.query(models.LinkedInConnection).filter(
        models.LinkedInConnection.connection_status == "Pending",
        models.LinkedInConnection.stage == "Requested"
    ).count()
    accepted = db.query(models.LinkedInConnection).filter(
        models.LinkedInConnection.connection_status == "Accepted"
    ).count()
    withdrawn = db.query(models.LinkedInConnection).filter(
        models.LinkedInConnection.connection_status == "Withdrawn"
    ).count()
    cold_sent = db.query(models.LinkedInConnection).filter(
        models.LinkedInConnection.cold_message_sent == True
    ).count()
    accepted_no_msg = db.query(models.LinkedInConnection).filter(
        models.LinkedInConnection.connection_status == "Accepted",
        models.LinkedInConnection.cold_message_sent == False
    ).count()
    # Acceptance rate based on Requested-stage entries only
    requested_total = db.query(models.LinkedInConnection).filter(
        models.LinkedInConnection.stage == "Requested"
    ).count()
    acceptance_rate = round((accepted / requested_total) * 100, 1) if requested_total > 0 else 0.0
    return schemas.LinkedInConnectionStats(
        total=total,
        need_to_connect=need_to_connect,
        pending=pending,
        accepted=accepted,
        withdrawn=withdrawn,
        cold_message_sent=cold_sent,
        accepted_no_message=accepted_no_msg,
        acceptance_rate=acceptance_rate,
    )

def get_all_connections_for_export(db: Session):
    return db.query(models.LinkedInConnection).order_by(models.LinkedInConnection.created_at.desc()).all()

