import { useState, FormEvent, useEffect } from 'react';
import { JobApplicationCreate, JobApplication, STATUS_OPTIONS, WORK_TYPE_OPTIONS, APPLIED_ON_OPTIONS, REJECTION_STAGE_OPTIONS } from '../types';
import { applicationApi } from '../services/api';
import { FaTimes } from 'react-icons/fa';
import { TagsInput } from './TagsInput';

interface ApplicationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: JobApplication;
  isEdit?: boolean;
}

export const ApplicationForm = ({ onSuccess, onCancel, initialData, isEdit = false }: ApplicationFormProps) => {
  const [formData, setFormData] = useState<JobApplicationCreate>({
    company_name: initialData?.company_name || '',
    job_title: initialData?.job_title || '',
    job_url: initialData?.job_url || '',
    location: initialData?.location || '',
    work_type: initialData?.work_type || '',
    domain: initialData?.domain || '',
    status: initialData?.status || 'Saved',
    application_date: initialData?.application_date ? new Date(initialData.application_date).toISOString().slice(0, 16) : '',
    application_deadline: initialData?.application_deadline ? new Date(initialData.application_deadline).toISOString().slice(0, 16) : '',
    applied_on: initialData?.applied_on || '',
    contact_person: initialData?.contact_person || '',
    contact_email: initialData?.contact_email || '',
    references: initialData?.references || '',
    job_description: initialData?.job_description || '',
    notes: initialData?.notes || '',
    tags: initialData?.tags || [],
    interview_notes: initialData?.interview_notes || '',
    interview_questions: initialData?.interview_questions || '',
    interview_date: initialData?.interview_date ? new Date(initialData.interview_date).toISOString().slice(0, 16) : '',
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [possibleDuplicates, setPossibleDuplicates] = useState<any[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    setFormData(prev => {
      if (prev.status === 'Rejected' && !prev.status_stage) {
        return { ...prev, status_stage: REJECTION_STAGE_OPTIONS[0] };
      }
      if (prev.status !== 'Rejected' && prev.status_stage) {
        const updated = { ...prev };
        delete updated.status_stage;
        return updated;
      }
      return prev;
    });
  }, [formData.status]);

  const loadTags = async () => {
    try {
      const tags = await applicationApi.getTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  // Check for duplicates when company or job title changes
  useEffect(() => {
    const checkDuplicates = async () => {
      if (!formData.company_name || !formData.job_title) {
        setPossibleDuplicates([]);
        setShowDuplicateWarning(false);
        return;
      }

      try {
        // Search for similar applications
        const allApps = await applicationApi.getAll({
          search: formData.company_name,
        });

        const duplicates = allApps.filter(app => {
          // Exclude the current application if editing/continuing
          if (isEdit && initialData && app.id === initialData.id) {
            return false;
          }
          const companyMatch = app.company_name.toLowerCase() === formData.company_name.toLowerCase();
          const titleSimilar = app.job_title.toLowerCase().includes(formData.job_title.toLowerCase()) ||
            formData.job_title.toLowerCase().includes(app.job_title.toLowerCase());
          return companyMatch && titleSimilar;
        });

        setPossibleDuplicates(duplicates);
        setShowDuplicateWarning(duplicates.length > 0);
      } catch (error) {
        console.error('Error checking duplicates:', error);
      }
    };

    const debounceTimer = setTimeout(checkDuplicates, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.company_name, formData.job_title, isEdit, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : parseFloat(value),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Clean up formData - convert empty strings to null for the API
      const cleanedData: any = {
        company_name: formData.company_name,
        job_title: formData.job_title,
        status: formData.status,
      };

      // Add optional fields only if they have values
      if (formData.application_date) cleanedData.application_date = formData.application_date;
      if (formData.application_deadline) cleanedData.application_deadline = formData.application_deadline;
      if (formData.applied_on) cleanedData.applied_on = formData.applied_on;
      if (formData.job_url) cleanedData.job_url = formData.job_url;
      if (formData.location) cleanedData.location = formData.location;
      if (formData.work_type) cleanedData.work_type = formData.work_type;
      if (formData.domain) cleanedData.domain = formData.domain;
      if (formData.salary_min) cleanedData.salary_min = formData.salary_min;
      if (formData.salary_max) cleanedData.salary_max = formData.salary_max;
      if (formData.contact_person) cleanedData.contact_person = formData.contact_person;
      if (formData.contact_email) cleanedData.contact_email = formData.contact_email;
      if (formData.references) cleanedData.references = formData.references;
      if (formData.job_description) cleanedData.job_description = formData.job_description;
      if (formData.notes) cleanedData.notes = formData.notes;
      if (formData.tags && formData.tags.length > 0) cleanedData.tags = formData.tags;
      if (formData.interview_notes) cleanedData.interview_notes = formData.interview_notes;
      if (formData.interview_questions) cleanedData.interview_questions = formData.interview_questions;
      if (formData.interview_date) cleanedData.interview_date = formData.interview_date;
      if (formData.status === 'Rejected' && formData.status_stage) cleanedData.status_stage = formData.status_stage;

      // Create application
      if (isEdit && initialData) {
        // Update existing application
        await applicationApi.update(initialData.id, cleanedData);

        // Upload CV if provided
        if (cvFile) {
          await applicationApi.uploadDocument(initialData.id, 'cv', cvFile);
        }

        // Upload cover letter if provided
        if (coverLetterFile) {
          await applicationApi.uploadDocument(initialData.id, 'coverletter', coverLetterFile);
        }

        alert('Application updated successfully!');
      } else {
        // Create new application
        const newApp = await applicationApi.create(cleanedData);

        // Upload CV if provided
        if (cvFile) {
          await applicationApi.uploadDocument(newApp.id, 'cv', cvFile);
        }

        // Upload cover letter if provided
        if (coverLetterFile) {
          await applicationApi.uploadDocument(newApp.id, 'coverletter', coverLetterFile);
        }

        alert('Application added successfully!');
      }
      onSuccess();
    } catch (error) {
      console.error('Error creating application:', error);
      alert('Failed to create application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{isEdit ? 'Continue Applying' : 'Add New Application'}</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                placeholder="e.g., Google, Microsoft"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="job_title"
                value={formData.job_title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                placeholder="e.g., Cloud Engineer"
              />
            </div>
          </div>

          {/* Duplicate Warning */}
          {showDuplicateWarning && possibleDuplicates.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Possible Duplicate Detected!
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>Found {possibleDuplicates.length} similar application(s):</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {possibleDuplicates.map(dup => (
                        <li key={dup.id}>
                          {dup.company_name} - {dup.job_title} ({dup.status})
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 font-semibold">You can still proceed if this is a different role or application.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDuplicateWarning(false)}
                    className="mt-2 text-sm text-yellow-800 dark:text-yellow-300 underline hover:text-yellow-900 dark:hover:text-yellow-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domain</label>
              <input
                type="text"
                name="domain"
                value={formData.domain || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                placeholder="e.g., Cloud Computing, DevOps"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                placeholder="e.g., London, UK"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Work Type</label>
              <select
                name="work_type"
                value={formData.work_type || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
              >
                <option value="">Select...</option>
                {WORK_TYPE_OPTIONS.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            {formData.status === 'Rejected' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stage Rejected At</label>
                <select
                  name="status_stage"
                  value={formData.status_stage || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                >
                  {REJECTION_STAGE_OPTIONS.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Salary Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salary Min (£)</label>
              <input
                type="number"
                name="salary_min"
                value={formData.salary_min || ''}
                onChange={handleNumberChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                placeholder="e.g., 30000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salary Max (£)</label>
              <input
                type="number"
                name="salary_max"
                value={formData.salary_max || ''}
                onChange={handleNumberChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                placeholder="e.g., 45000"
              />
            </div>
          </div>

          {/* Job URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job URL</label>
            <input
              type="url"
              name="job_url"
              value={formData.job_url || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
              placeholder="https://..."
            />
          </div>

          {/* Application Date, Applied On, and Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Application Date (optional)</label>
              <input
                type="datetime-local"
                name="application_date"
                value={formData.application_date || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty if not applied yet</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Applied On (optional)</label>
              <select
                name="applied_on"
                value={formData.applied_on || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
              >
                <option value="">Select platform...</option>
                {APPLIED_ON_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Where did you apply?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Application Deadline (optional)</label>
              <input
                type="datetime-local"
                name="application_deadline"
                value={formData.application_deadline || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">When you need to apply by</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Person</label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                placeholder="e.g., John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email</label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                placeholder="contact@company.com"
              />
            </div>
          </div>

          {/* References */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">References</label>
            <textarea
              name="references"
              value={formData.references || ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
              placeholder="Add any references or referrals..."
            />
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Description (optional)</label>
            <textarea
              name="job_description"
              value={formData.job_description || ''}
              onChange={handleInputChange}
              rows={8}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 font-mono text-sm"
              placeholder="Paste the full job description here from LinkedIn or job posting..."
            />
            <p className="text-xs text-gray-500 mt-1">Copy-paste the entire JD for review later</p>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload CV</label>
              <input
                type="file"
                onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PDF, DOC, DOCX (Max 5MB)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Cover Letter</label>
              <input
                type="file"
                onChange={(e) => setCoverLetterFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PDF, DOC, DOCX (Max 5MB)</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
            <TagsInput
              tags={formData.tags || []}
              onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
              suggestions={availableTags}
              placeholder="Add tags like 'Priority', 'Remote Only', 'Referral'..."
            />
          </div>

          {/* Interview Preparation Section */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Interview Preparation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Add this section when you get an interview scheduled</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interview Date & Time</label>
                <input
                  type="datetime-local"
                  name="interview_date"
                  value={formData.interview_date || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preparation Notes</label>
                <textarea
                  name="interview_notes"
                  value={formData.interview_notes || ''}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                  placeholder="Research about the company, role requirements, your talking points..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Questions to Ask / Questions Asked</label>
                <textarea
                  name="interview_questions"
                  value={formData.interview_questions || ''}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                  placeholder="Questions you want to ask, or questions they asked during the interview..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {submitting ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Application' : 'Add Application')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

