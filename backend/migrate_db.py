"""
Database migration script to add new fields to existing database
Run this script to update your database schema without losing data
"""
import sys
import os

# Add the parent directory to sys.path to allow importing from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.migration import migrate_database
except ImportError:
    # Fallback if running from a different context where 'app' is not a package
    # This copies the logic just in case, or we can just try to add CWD to path
    try:
        sys.path.append(os.getcwd())
        from app.migration import migrate_database
    except ImportError:
        print("Could not import migration logic. Please ensure you are running from the backend directory.")
        sys.exit(1)

if __name__ == "__main__":
    try:
        migrate_database()
    except Exception as e:
        print(f"\nERROR: Migration failed: {str(e)}")
        print("Please check the error and try again.")
