export interface StatusHistoryEntry {
  status: string;
  date: string;
  notes?: string;
  stage?: string;
}

export interface NetworkingContact {
  name: string;
  linkedin: string;
  email?: string;            // direct email of the contact
  cold_message_sent?: boolean;
  cold_message_via?: string;
  cold_contact_name?: string;
  cold_contact_category?: string;
  cold_contact_emails?: string[];  // one or more recipient emails (when via === 'Email')
  cold_message_body?: string;
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
  contact_linkedin?: string;
  contact_cold_message_sent?: boolean;
  contact_cold_message_via?: string;
  contact_cold_contact_category?: string;
  contact_cold_contact_emails?: string[];  // multiple recipients
  contact_cold_message_body?: string;
  networking_contacts?: NetworkingContact[];
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
  contact_linkedin?: string;
  contact_cold_message_sent?: boolean;
  contact_cold_message_via?: string;
  contact_cold_contact_category?: string;
  contact_cold_contact_emails?: string[];  // multiple recipients
  contact_cold_message_body?: string;
  networking_contacts?: NetworkingContact[];
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
  "Total Jobs",
  "Other"
];

export const COLD_MESSAGE_VIA_OPTIONS = ['Email', 'LinkedIn Message', 'Other'];
export const COLD_CONTACT_CATEGORY_OPTIONS = ['Employee', 'Hiring Manager', 'Recruiter', 'Other'];

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

// Cold Message Types
export interface ColdMessage {
  id: number;
  contact_name: string;
  company_name?: string;
  contact_email?: string;
  contact_linkedin?: string;
  via: string;
  category?: string;
  subject?: string;
  message_body?: string;
  sent_date?: string;
  got_reply?: boolean;
  notes?: string;
  connection_id?: number;  // linked LinkedIn connection
  created_at: string;
  updated_at?: string;
}

export interface ColdMessageCreate {
  contact_name: string;
  company_name?: string;
  contact_email?: string;
  contact_linkedin?: string;
  via: string;
  category?: string;
  subject?: string;
  message_body?: string;
  sent_date?: string;
  got_reply?: boolean;
  notes?: string;
  connection_id?: number;  // linked LinkedIn connection
}

export interface ColdMessageStats {
  total: number;
  by_via: { [key: string]: number };
  by_category: { [key: string]: number };
  reply_count: number;
  reply_rate: number;
}

export const COLD_VIA_OPTIONS = ['Email', 'LinkedIn Message', 'Other'];
export const COLD_CATEGORY_OPTIONS = ['Employee', 'Hiring Manager', 'Recruiter', 'Other'];

// LinkedIn Connection Types
export interface LinkedInConnection {
  id: number;
  contact_name: string;
  linkedin_profile_id?: string;
  company_name?: string;
  category?: string;        // 'Recruiter' | 'Hiring Manager' | 'Employee' | 'Other'
  connection_status: string; // 'Pending' | 'Accepted' | 'Withdrawn'
  stage?: string;           // 'Need to Connect' | 'Requested'
  requested_on?: string;
  accepted_on?: string;
  cold_message_sent?: boolean;
  cold_message_id?: number;
  follow_up_date?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface LinkedInConnectionCreate {
  contact_name: string;
  linkedin_profile_id?: string;
  company_name?: string;
  category?: string;
  connection_status?: string;
  stage?: string;           // 'Need to Connect' | 'Requested'
  requested_on?: string;
  accepted_on?: string;
  cold_message_sent?: boolean;
  cold_message_id?: number;
  follow_up_date?: string;
  notes?: string;
}

export interface LinkedInConnectionStats {
  total: number;
  need_to_connect: number;
  pending: number;
  accepted: number;
  withdrawn: number;
  cold_message_sent: number;
  accepted_no_message: number;
  acceptance_rate: number;
}

export const CONNECTION_STATUS_OPTIONS = ['Pending', 'Accepted', 'Withdrawn'];
export const CONNECTION_CATEGORY_OPTIONS = ['Recruiter', 'Hiring Manager', 'Employee', 'Other'];

