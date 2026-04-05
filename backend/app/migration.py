"""
Database migration script to add new fields to existing database
Run this script to update your database schema without losing data
"""
import sqlite3
import json
from datetime import datetime
import os

def migrate_database():
    # Handle different execution contexts (running as script vs imported)
    db_path = 'job_tracker.db'
    if not os.path.exists(db_path) and os.path.exists(os.path.join('..', db_path)):
         # If running from app directory
        db_path = '../job_tracker.db'
    elif not os.path.exists(db_path) and os.path.exists(os.path.join('backend', db_path)):
         # If running from project root
        db_path = 'backend/job_tracker.db'
        
    print(f"Connecting to database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Starting database migration...")
    
    # Check if status_history column exists
    cursor.execute("PRAGMA table_info(job_applications)")
    columns = [column[1] for column in cursor.fetchall()]
    
    # Add status_history column if it doesn't exist
    if 'status_history' not in columns:
        print("Adding status_history column...")
        cursor.execute("ALTER TABLE job_applications ADD COLUMN status_history TEXT")
        
        # Initialize status_history for existing records
        cursor.execute("SELECT id, status, application_date, created_at FROM job_applications WHERE status_history IS NULL")
        for row in cursor.fetchall():
            app_id, status, app_date, created_at = row
            date_to_use = app_date if app_date else created_at
            initial_history = json.dumps([{
                "status": status or "Applied",
                "date": date_to_use if date_to_use else datetime.now().isoformat(),
                "notes": "Initial status (migrated)"
            }])
            cursor.execute("UPDATE job_applications SET status_history = ? WHERE id = ?", (initial_history, app_id))
        
        print("STATUS: status_history column added and initialized")
    else:
        print("STATUS: status_history column already exists")
    
    # Add references column if it doesn't exist
    if 'references' not in columns:
        print("Adding references column...")
        cursor.execute('ALTER TABLE job_applications ADD COLUMN "references" TEXT')
        print("STATUS: references column added")
    else:
        print("STATUS: references column already exists")
    
    # Add application_deadline column if it doesn't exist
    if 'application_deadline' not in columns:
        print("Adding application_deadline column...")
        cursor.execute('ALTER TABLE job_applications ADD COLUMN application_deadline TIMESTAMP')
        print("STATUS: application_deadline column added")
    else:
        print("STATUS: application_deadline column already exists")
    
    # Add job_description column if it doesn't exist
    if 'job_description' not in columns:
        print("Adding job_description column...")
        cursor.execute('ALTER TABLE job_applications ADD COLUMN job_description TEXT')
        print("STATUS: job_description column added")
    else:
        print("STATUS: job_description column already exists")
    
    # Add tags column if it doesn't exist
    if 'tags' not in columns:
        print("Adding tags column...")
        cursor.execute('ALTER TABLE job_applications ADD COLUMN tags JSON')
        print("STATUS: tags column added")
    else:
        print("STATUS: tags column already exists")
    
    # Add is_archived column if it doesn't exist
    if 'is_archived' not in columns:
        print("Adding is_archived column...")
        cursor.execute('ALTER TABLE job_applications ADD COLUMN is_archived INTEGER DEFAULT 0')
        print("STATUS: is_archived column added")
    else:
        print("STATUS: is_archived column already exists")
    
    # Add interview_notes column if it doesn't exist
    if 'interview_notes' not in columns:
        print("Adding interview_notes column...")
        cursor.execute('ALTER TABLE job_applications ADD COLUMN interview_notes TEXT')
        print("STATUS: interview_notes column added")
    else:
        print("STATUS: interview_notes column already exists")
    
    # Add interview_questions column if it doesn't exist
    if 'interview_questions' not in columns:
        print("Adding interview_questions column...")
        cursor.execute('ALTER TABLE job_applications ADD COLUMN interview_questions TEXT')
        print("STATUS: interview_questions column added")
    else:
        print("STATUS: interview_questions column already exists")
    
    # Add interview_date column if it doesn't exist
    if 'interview_date' not in columns:
        print("Adding interview_date column...")
        cursor.execute('ALTER TABLE job_applications ADD COLUMN interview_date TIMESTAMP')
        print("STATUS: interview_date column added")
    else:
        print("STATUS: interview_date column already exists")
    
    # Add applied_on column if it doesn't exist
    if 'applied_on' not in columns:
        print("Adding applied_on column...")
        cursor.execute('ALTER TABLE job_applications ADD COLUMN applied_on TEXT')
        print("STATUS: applied_on column added")
    else:
        print("STATUS: applied_on column already exists")

    # Add networking_contacts column if it doesn't exist
    if 'networking_contacts' not in columns:
        print("Adding networking_contacts column...")
        cursor.execute('ALTER TABLE job_applications ADD COLUMN networking_contacts JSON')
        print("STATUS: networking_contacts column added")
    else:
        print("STATUS: networking_contacts column already exists")

    # Add contact_linkedin column if it doesn't exist
    if 'contact_linkedin' not in columns:
        print("Adding contact_linkedin column...")
        cursor.execute('ALTER TABLE job_applications ADD COLUMN contact_linkedin TEXT')
        print("STATUS: contact_linkedin column added")
    else:
        print("STATUS: contact_linkedin column already exists")

    # Add contact_cold_message_sent column if it doesn't exist
    if 'contact_cold_message_sent' not in columns:
        print("Adding contact_cold_message_sent column...")
        cursor.execute('ALTER TABLE job_applications ADD COLUMN contact_cold_message_sent BOOLEAN DEFAULT 0')
        print("STATUS: contact_cold_message_sent column added")
    else:
        print("STATUS: contact_cold_message_sent column already exists")

    # Add contact_cold_message_via column if it doesn't exist
    if 'contact_cold_message_via' not in columns:
        print("Adding contact_cold_message_via column...")
        cursor.execute('ALTER TABLE job_applications ADD COLUMN contact_cold_message_via TEXT')
        print("STATUS: contact_cold_message_via column added")
    else:
        print("STATUS: contact_cold_message_via column already exists")

    # Add contact_cold_contact_category column if it doesn't exist
    if 'contact_cold_contact_category' not in columns:
        print("Adding contact_cold_contact_category column...")
        cursor.execute('ALTER TABLE job_applications ADD COLUMN contact_cold_contact_category TEXT')
        print("STATUS: contact_cold_contact_category column added")
    else:
        print("STATUS: contact_cold_contact_category column already exists")

    # Add contact_cold_contact_email column if it doesn't exist
    if 'contact_cold_contact_email' not in columns:
        print("Adding contact_cold_contact_email column...")
        cursor.execute('ALTER TABLE job_applications ADD COLUMN contact_cold_contact_email TEXT')
        print("STATUS: contact_cold_contact_email column added")
    else:
        print("STATUS: contact_cold_contact_email column already exists")

    # Add contact_cold_message_body column if it doesn't exist
    if 'contact_cold_message_body' not in columns:
        print("Adding contact_cold_message_body column...")
        cursor.execute('ALTER TABLE job_applications ADD COLUMN contact_cold_message_body TEXT')
        print("STATUS: contact_cold_message_body column added")
    else:
        print("STATUS: contact_cold_message_body column already exists")

    # ─── Create cold_messages table if it doesn't exist ─────────────────
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='cold_messages'")
    if not cursor.fetchone():
        print("Creating cold_messages table...")
        cursor.execute("""
            CREATE TABLE cold_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contact_name TEXT NOT NULL,
                company_name TEXT,
                contact_email TEXT,
                contact_linkedin TEXT,
                via TEXT NOT NULL,
                category TEXT,
                subject TEXT,
                message_body TEXT,
                sent_date TIMESTAMP,
                got_reply BOOLEAN DEFAULT 0,
                notes TEXT,
                connection_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP
            )
        """)
        print("STATUS: cold_messages table created")
    else:
        print("STATUS: cold_messages table already exists")
        # Add connection_id column if it doesn't exist yet
        cursor.execute("PRAGMA table_info(cold_messages)")
        cm_columns = [col[1] for col in cursor.fetchall()]
        if 'connection_id' not in cm_columns:
            print("Adding connection_id column to cold_messages...")
            cursor.execute("ALTER TABLE cold_messages ADD COLUMN connection_id INTEGER")
            print("STATUS: connection_id column added to cold_messages")
        else:
            print("STATUS: cold_messages.connection_id already exists")


    # ─── Create linkedin_connections table if it doesn't exist ────────────
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='linkedin_connections'")
    if not cursor.fetchone():
        print("Creating linkedin_connections table...")
        cursor.execute("""
            CREATE TABLE linkedin_connections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contact_name TEXT NOT NULL,
                linkedin_profile_id TEXT,
                company_name TEXT,
                category TEXT,
                connection_status TEXT DEFAULT 'Pending',
                requested_on TIMESTAMP,
                accepted_on TIMESTAMP,
                cold_message_sent BOOLEAN DEFAULT 0,
                cold_message_id INTEGER,
                follow_up_date TIMESTAMP,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP
            )
        """)
        print("STATUS: linkedin_connections table created")
    else:
        print("STATUS: linkedin_connections table already exists")

    conn.commit()
    conn.close()

    
    print("\nSUCCESS: Migration completed successfully!")
    print("Your data is safe and the new features are ready to use.")

if __name__ == "__main__":
    try:
        migrate_database()
    except Exception as e:
        print(f"\nERROR: Migration failed: {str(e)}")
        print("Please check the error and try again.")
