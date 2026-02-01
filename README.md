# Job Application Manager

A full-stack web application to track and manage job applications. Built with FastAPI, React, TypeScript, and SQLite.

**Status:** ✅ Production-ready | 🚀 Deployed on AWS EC2

## Features

### Core Features
- **Save Jobs for Later** - Save jobs you find on LinkedIn or elsewhere before applying
- **Job Description Storage** - Copy-paste full job descriptions for later review
- **Application Deadline Tracking** - Set deadlines with visual warnings
- **Application Tracking** with status management
- **Status History** - Track every status change with dates and notes
- **Document Management** - Upload and manage CVs and cover letters
- **Application Date** - Record exact date/time of application
- **References** - Track referrals and references
- **Domain/Industry Tracking** - Organize by job field
- **Dashboard with Statistics** - Visual insights and "Need to Apply" section

### NEW Advanced Features
- **Global Search** - Search across all fields (company, title, location, domain, notes, JD)
- **Advanced Filtering** - Filter by status, domain, work type, tags, and archive status
- **Sorting Options** - Sort by date, deadline, company, status, or salary
- **Tags System** - Add custom tags like "Priority", "Remote Only", "Referral"
- **Bulk Actions** - Select multiple applications and delete, archive, or update status in bulk
- **Archive Functionality** - Archive old applications to declutter your view
- **Interview Preparation** - Dedicated section for interview date, prep notes, and questions
- **Visual Timeline** - See the complete journey of each application with duration tracking
- **Duplicate Detection** - Get warned when adding similar applications
- **Modern UI Design** - Professional Light theme with cleaner aesthetics and sleek Dark mode
- **Keyboard Shortcuts** - Quick actions with keyboard (N=New, /=Search, Esc=Close)
- **Mobile Responsive** - Works perfectly on phones and tablets
- **Excel Export** - Download all data in Excel format
- **In-App Backup & Restore** - One-click database backup/restore directly from the Dashboard
- **Interview Result Awaited Status** - Distinct status to track applications awaiting post-interview feedback

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- That's it!

### Windows
```bash
# 1. Start Docker Desktop
# 2. Double-click START_DOCKER.bat
# 3. Open http://localhost:5173
```

### Linux/Mac
```bash
# 1. Start Docker
chmod +x start_docker.sh
./start_docker.sh
# 2. Open http://localhost:5173
```

### Stop Application
- **Windows:** Double-click `STOP_DOCKER.bat`
- **Linux/Mac:** `./stop_docker.sh`
- **All:** Press `Ctrl+C` in terminal

## Status Options

| Status | Description |
|--------|-------------|
| **Saved** | Jobs you want to apply to later |
| **To Apply** | Jobs marked for application |
| Applied | Initial application submitted |
| Screening | Initial HR/recruiter screening |
| Aptitude Test | Online assessment or aptitude test |
| Interview | Scheduled for an interview |
| **Interview Result Awaited** | Interview completed, awaiting decision |
| Technical Test | Take-home assignment or coding challenge |
| Second Interview | Follow-up interview |
| Final Interview | Final round interview |
| Offer | Received a job offer |
| Accepted | Offer accepted |
| Rejected | Application rejected at any stage |
| Withdrawn | You withdrew your application |

## Key Features Explained

### 1. Status Change Tracking
- Every status change is recorded with date and time
- Add optional notes for each transition
- View complete history by clicking the history icon

**Example:**
- Applied → Oct 25, 9:15 AM - "Application submitted"
- Screening → Oct 28, 4:00 PM - "Phone screening passed"
- Interview → Nov 1, 11:00 AM - "Met with team lead"
- Offer → Nov 15, 10:30 AM - "£45k offer received"

### 2. Application Date
- Set exact date/time when you applied
- Helpful for tracking response times
- Defaults to current date/time

### 3. References Section
- Track who referred you
- Internal referral information
- Displayed in highlighted box

## NEW Advanced Features Guide

### 1. Global Search & Filtering
- **Search Bar**: Type anything - searches across company, title, location, domain, notes, and job descriptions
- **Advanced Filters**: Click "Filters" button to see all filtering options:
  - Filter by Status (Saved, Applied, Interview, etc.)
  - Filter by Domain/Industry
  - Filter by Work Type (Remote, Hybrid, On-site)
  - Filter by Tags
  - Show/Hide Archived applications
- **Sorting**: Choose what to sort by (Date Added, Deadline, Company, Status, Salary) and direction (ascending/descending)
- **All filters work together for precise results**

### 2. Tags System
- **Adding Tags**: When creating or editing an application, add custom tags
- **Tag Suggestions**: System remembers your tags and suggests them
- **Filtering by Tags**: Use advanced filters to show only applications with specific tags
- **Use Cases**: "Priority", "Remote Only", "Referral", "High Salary", "Dream Job", "Backup Option"

### 3. Bulk Operations
- **Select Applications**: Check the boxes next to applications you want to act on
- **Select All**: Click "Select All" button to select every application at once
- **Floating Action Bar**: Appears when you have selected applications
- **Actions Available**:
  - Change Status (bulk update status for all selected)
  - Archive (move to archive)
  - Delete (bulk delete - careful!)
- **Clear Selection**: Click X button or press Esc

### 4. Archive Functionality
- **Archive Button**: Orange archive icon on each application card
- **Purpose**: Remove old/rejected applications from main view without deleting them
- **Unarchive**: Click the green checkmark icon on archived applications
- **View Archived**: Enable "Show Archived" in advanced filters
- **Archived Badge**: Archived applications show an orange "Archived" badge

### 5. Interview Preparation
- **Interview Date**: Set the scheduled interview date and time
- **Preparation Notes**: Document your research about the company, role, talking points
- **Questions**: Prepare questions to ask, or record questions they asked
- **Collapsible Section**: Shows/hides with a toggle button
- **Color-coded**: Purple highlighted section for easy identification

### 6. Application Timeline
- **Visual Timeline**: Shows the complete journey from "Saved" to current status
- **Duration Tracking**: See how many days spent in each stage
- **Status Icons**: Visual indicators for different status types
- **Timeline Stats**: Quick overview showing total stages and days in process
- **Expandable**: Click "Show Application Timeline" to expand the view

### 7. Duplicate Detection
- **Real-time Check**: As you type company name and job title, system checks for similar applications
- **Warning Alert**: Yellow warning box appears if potential duplicates found
- **Details Shown**: Lists all similar applications with their status
- **Can Proceed**: You can dismiss the warning and proceed if it's a different role
- **Prevents Mistakes**: Helps avoid accidentally applying twice

### 8. Dark Mode
- **Toggle**: Sun/Moon icon in the side menu
- **Persistent**: Your choice is saved and remembered
- **Full Support**: Every component supports dark mode
- **Smooth Transition**: Animated color transitions
- **Eye-friendly**: Reduces eye strain for night usage

### 9. Keyboard Shortcuts
- **`N`** - Open "Add New Application" form
- **`/`** - Focus the search bar
- **`Esc`** - Close modals or clear selections
- **Help**: Keyboard shortcut guide visible in bottom-right (hidden on mobile)
- **Fast Workflow**: Navigate without touching your mouse

### 10. Mobile Responsiveness
- **Touch-friendly**: All buttons and inputs sized for touch
- **Responsive Layout**: Adapts to any screen size
- **Fullscreen Modals**: Forms take full screen on mobile for better experience
- **Stacked Grids**: Multi-column layouts stack vertically on mobile
- **Optimized Text**: Font sizes adjust for readability
- **Works Offline**: Progressive web app capabilities

## Data Persistence

**Your data is SAFE!** 

All data is stored on your computer at:
- Database: `backend/job_tracker.db`
- Files: `backend/uploads/`

**Data survives:**
- Container crashes
- Docker stops
- System restarts
- Container deletion/recreation

### Backup Your Data

**Option 1: In-App Backup/Restore (Recommended)**
1. Go to the **Dashboard** page.
2. Click the **Backup** button (cloud icon) in the top-right corner.
3. Your `job_tracker.db` file will be downloaded.
4. To restore, click **Restore**, select your `.db` file, and confirm.

**Option 2: Script-based Backup**

*Windows:*
```bash
backup_data.bat
```

*Linux/Mac:*
```bash
./backup_data.sh
```

Backups are saved in `backups/` folder with timestamps.

## Project Structure

```
Job_Application_Manager/
├── backend/                  # FastAPI backend
│   ├── app/                  # Application code
│   ├── uploads/              # Uploaded files (on your PC)
│   ├── job_tracker.db        # Database (on your PC)
│   └── requirements.txt
├── frontend/                 # React frontend
│   └── src/
├── docker-compose.yml        # Docker configuration
├── START_DOCKER.bat/sh       # Start application
├── STOP_DOCKER.bat/sh        # Stop application
└── backup_data.bat/sh        # Backup script
```

## Technology Stack

**Backend:**
- Python 3.11 with FastAPI
- SQLAlchemy ORM
- SQLite database
- Pandas for Excel export

**Frontend:**
- React 18 with TypeScript
- Vite build tool
- TailwindCSS
- Axios for API calls

**Deployment:**
- Docker & Docker Compose
- Cross-platform (Windows/Linux/Mac)

## Usage Guide

### Saving a Job to Apply Later

When you find a job on LinkedIn or elsewhere but can't apply immediately:

1. Click "**Add Application**"
2. Fill in basic details:
   - Company Name (required)
   - Job Title (required)
   - Job URL (copy from LinkedIn/website)
   - **Application Deadline** (when you need to apply by)
   - **Job Description** (copy-paste entire JD from LinkedIn/website)
3. Status will default to "**Saved**"
4. Leave Application Date empty
5. Click "**Add Application**"

The job appears in your "Need to Apply" section on dashboard with deadline warnings!

**TIP:** When you paste the Job Description, you can view it later by clicking the green document icon on the application card. This lets you review the JD without visiting the link again!

### Adding an Application You Already Applied To

1. Click "**Add Application**"
2. Fill in required fields:
   - Company Name (required)
   - Job Title (required)
   - Application Date (when you applied)
3. Change Status to "**Applied**"
4. Optional fields:
   - Domain (e.g., "Cloud Computing")
   - Location
   - Work Type (Remote/Hybrid/On-site)
   - Salary range
   - Job URL
   - Application Deadline
   - Contact person & email
   - References
   - Job Description (full JD text)
   - Notes
5. Upload CV and/or cover letter
6. Click "**Add Application**"

### Updating Status

1. Click **Edit** button on application card
2. Change status dropdown to new status
3. **Blue box appears** with:
   - Date/time picker for status change
   - Notes field (optional)
4. Fill in the details
5. Click **Save**

### Viewing Status History

1. Click the **History** icon on application card
2. See complete timeline of all status changes
3. Click again to hide

### Viewing Job Description

1. Click the **green document icon** on any application card (if JD was saved)
2. View the full job description you pasted earlier
3. Review requirements without visiting the job link
4. Click again to hide

### Managing Saved Jobs

1. Saved jobs appear with **deadline warnings**:
   - Blue box: Deadline is coming
   - Orange box: Deadline within 3 days
   - Red box: Deadline passed
2. When ready to apply, click **Edit**
3. Change status from "Saved" to "Applied"
4. Set the application date
5. Upload your CV and cover letter
6. Save - job moves from "Need to Apply" to "Applied" count

### Exporting Data

Click "**Export to Excel**" button on dashboard to download all your application data.

## Troubleshooting

### Container won't start
```bash
docker-compose down
docker-compose up --build
```

### Port already in use
```bash
docker-compose down
# Then start again
```

### Database issues
```bash
# Restart backend
docker-compose restart backend
```

### Fresh rebuild
```bash
docker-compose down --rmi all
docker-compose up --build
```

## Deployment to Cloud (Future)

Ready for free cloud deployment to:
- **Frontend:** Vercel/Netlify (free)
- **Backend:** Render.com (750hrs/month free)
- **Database:** Neon.tech PostgreSQL (10GB free)
- **Files:** Cloudinary (25GB free)

## Contributing

This is a personal project, but feel free to fork and customize!

## License

MIT License - Free to use for personal or commercial purposes.

---

## Quick Command Reference

| Action | Windows | Linux/Mac |
|--------|---------|-----------|
| **Start** | `START_DOCKER.bat` | `./start_docker.sh` |
| **Stop** | `STOP_DOCKER.bat` | `./stop_docker.sh` |
| **Backup** | `backup_data.bat` | `./backup_data.sh` |
| **Logs** | `docker-compose logs -f` | `docker-compose logs -f` |
| **Restart** | `docker-compose restart` | `docker-compose restart` |

## Support

Your data is stored at:
- `backend/job_tracker.db` - Database
- `backend/uploads/` - Files
- `backups/` - Backup copies

Access application at: **http://localhost:5173**

API documentation at: **http://localhost:8000/docs**

---

**Happy Job Hunting!**
