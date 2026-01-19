export interface StatusHistoryEntry {
  status: string;
  date: string;
  notes?: string;
  stage?: string;
}

export interface JobApplication {
  id: number;
  company_name: string;
  job_title: string;
  job_url?: string;
  location?: string;
  work_type?: string;
  domain?: string;
  salary_min?: number;
  salary_max?: number;
  status: string;
  status_history: StatusHistoryEntry[];
  application_date?: string;
  application_deadline?: string;
  applied_on?: string;
  cv_filename?: string;
  cv_filepath?: string;
  coverletter_filename?: string;
  coverletter_filepath?: string;
  contact_person?: string;
  contact_email?: string;
  references?: string;
  job_description?: string;
  notes?: string;
  tags?: string[];
  is_archived?: number;
  interview_notes?: string;
  interview_questions?: string;
  interview_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface JobApplicationCreate {
  company_name: string;
  job_title: string;
  job_url?: string;
  location?: string;
  work_type?: string;
  domain?: string;
  salary_min?: number;
  salary_max?: number;
  status?: string;
  application_date?: string;
  application_deadline?: string;
  applied_on?: string;
  contact_person?: string;
  contact_email?: string;
  references?: string;
  job_description?: string;
  notes?: string;
  tags?: string[];
  is_archived?: number;
  interview_notes?: string;
  interview_questions?: string;
  interview_date?: string;
  status_stage?: string;
}

export interface ApplicationStats {
  total_applications: number;
  by_status: { [key: string]: number };
  by_domain: { [key: string]: number };
  by_work_type: { [key: string]: number };
  recent_applications: number;
  rejections_by_stage: { [key: string]: number };
}

export const STATUS_OPTIONS = [
  "Saved",
  "To Apply",
  "Applied",
  "Screening",
  "Aptitude Test",
  "Interview",
  "Interview Result Awaited",
  "Technical Test",
  "Second Interview",
  "Final Interview",
  "Offer",
  "Accepted",
  "Rejected",
  "Withdrawn"
];

export const WORK_TYPE_OPTIONS = [
  "Remote",
  "Hybrid",
  "On-site"
];

export const APPLIED_ON_OPTIONS = [
  "LinkedIn",
  "Indeed",
  "Company Website",
  "Glassdoor",
  "Monster",
  "ZipRecruiter",
  "Referral",
  "Email",
  "Other"
];

export const REJECTION_STAGE_OPTIONS = [
  "CV Screening",
  "ATS / Keyword Filtering",
  "Recruiter Review",
  "Phone Screen",
  "Technical Interview",
  "Hiring Manager Interview",
  "Final Interview",
  "Offer / Negotiation",
  "Other"
];

export const SORT_OPTIONS = [
  { value: "created_at", label: "Date Added" },
  { value: "application_date", label: "Application Date" },
  { value: "application_deadline", label: "Deadline" },
  { value: "company_name", label: "Company Name" },
  { value: "status", label: "Status" },
  { value: "salary_max", label: "Salary" }
];

export interface FilterState {
  search: string;
  status: string;
  domain: string;
  workType: string;
  tags: string[];
  includeArchived: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  rejectionStage?: string;
}

