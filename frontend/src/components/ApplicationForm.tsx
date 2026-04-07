import { useState, FormEvent, useEffect } from 'react';
import { JobApplicationCreate, JobApplication, STATUS_OPTIONS, WORK_TYPE_OPTIONS, APPLIED_ON_OPTIONS, REJECTION_STAGE_OPTIONS, NetworkingContact, COLD_MESSAGE_VIA_OPTIONS, COLD_CONTACT_CATEGORY_OPTIONS } from '../types';
import { applicationApi, connectionApi } from '../services/api';
import { FaTimes, FaLinkedin, FaPlus, FaTrash, FaEnvelope, FaChevronDown, FaChevronUp } from 'react-icons/fa';
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
    domain: initialData?.domain || (isEdit ? '' : 'Cloud'),
    status: initialData?.status || 'Applied',
    application_date: initialData?.application_date ? new Date(initialData.application_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
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
    contact_linkedin: initialData?.contact_linkedin || '',
    contact_cold_message_sent: initialData?.contact_cold_message_sent || false,
    contact_cold_message_via: initialData?.contact_cold_message_via || '',
    contact_cold_contact_category: initialData?.contact_cold_contact_category || '',
    contact_cold_contact_emails: initialData?.contact_cold_contact_emails || [],
    contact_cold_message_body: initialData?.contact_cold_message_body || '',
    networking_contacts: Array.isArray(initialData?.networking_contacts)
      ? initialData.networking_contacts
      : (typeof initialData?.networking_contacts === 'string'
        ? JSON.parse(initialData.networking_contacts as unknown as string)
        : []),
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [possibleDuplicates, setPossibleDuplicates] = useState<any[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [customAppliedOn, setCustomAppliedOn] = useState('');
  const [isCustomAppliedOn, setIsCustomAppliedOn] = useState(false);
  const [autoAddToast, setAutoAddToast] = useState<string | null>(null);

  // Cold email — main contact — multi-email state
  const [contactEmailInput, setContactEmailInput] = useState('');
  const [showContactColdDetails, setShowContactColdDetails] = useState(false);

  // Networking contact state
  const [newContactName, setNewContactName] = useState('');
  const [newContactLinkedin, setNewContactLinkedin] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newColdMessageSent, setNewColdMessageSent] = useState(false);
  const [showNetColdDetails, setShowNetColdDetails] = useState(false);
  const [newColdMessageVia, setNewColdMessageVia] = useState('');
  const [newColdContactName, setNewColdContactName] = useState('');
  const [newColdContactCategory, setNewColdContactCategory] = useState('');
  const [newColdContactEmails, setNewColdContactEmails] = useState<string[]>([]);
  const [newColdEmailInput, setNewColdEmailInput] = useState('');
  const [newColdMessageBody, setNewColdMessageBody] = useState('');

  useEffect(() => {
    loadTags();

    // Initialize custom Applied On state
    if (initialData?.applied_on) {
      if (!APPLIED_ON_OPTIONS.includes(initialData.applied_on)) {
        setIsCustomAppliedOn(true);
        setCustomAppliedOn(initialData.applied_on);
        setFormData(prev => ({ ...prev, applied_on: 'Other' }));
      }
    }
  }, [initialData]);

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

    if (name === 'applied_on') {
      if (value === 'Other') {
        setIsCustomAppliedOn(true);
        setFormData(prev => ({ ...prev, applied_on: 'Other' }));
      } else {
        setIsCustomAppliedOn(false);
        setFormData(prev => ({ ...prev, applied_on: value }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? undefined : value,
      }));
    }
  };



  const addNetworkingContact = () => {
    if (newContactName && newContactLinkedin) {
      const newContact: NetworkingContact = {
        name: newContactName,
        linkedin: newContactLinkedin,
        email: newContactEmail || undefined,
        cold_message_sent: newColdMessageSent,
        ...(newColdMessageSent && {
          cold_message_via: newColdMessageVia,
          cold_contact_name: newColdContactName,
          cold_contact_category: newColdContactCategory,
          cold_contact_emails: newColdMessageVia === 'Email' ? newColdContactEmails : undefined,
          cold_message_body: newColdMessageBody,
        }),
      };
      setFormData(prev => ({
        ...prev,
        networking_contacts: [...(Array.isArray(prev.networking_contacts) ? prev.networking_contacts : []), newContact]
      }));
      setNewContactName('');
      setNewContactLinkedin('');
      setNewContactEmail('');
      setNewColdMessageSent(false);
      setShowNetColdDetails(false);
      setNewColdMessageVia('');
      setNewColdContactName('');
      setNewColdContactCategory('');
      setNewColdContactEmails([]);
      setNewColdEmailInput('');
      setNewColdMessageBody('');

    }
  };

  const removeNetworkingContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      networking_contacts: (prev.networking_contacts || []).filter((_, i) => i !== index)
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : parseFloat(value),
    }));
  };

  // Auto-add contacts from the saved application as "Need to Connect" entries
  const autoAddContacts = async (savedFormData: JobApplicationCreate) => {
    const contacts: { name: string; company: string; linkedin?: string; category?: string }[] = [];

    // 1. Contact Person (main contact field)
    if (savedFormData.contact_person?.trim()) {
      contacts.push({
        name: savedFormData.contact_person.trim(),
        company: savedFormData.company_name,
        linkedin: savedFormData.contact_linkedin?.trim() || undefined,
        category: savedFormData.contact_cold_contact_category || undefined,
      });
    }

    // 2. Networking contacts
    if (Array.isArray(savedFormData.networking_contacts)) {
      for (const nc of savedFormData.networking_contacts) {
        if (nc.name?.trim()) {
          contacts.push({
            name: nc.name.trim(),
            company: savedFormData.company_name,
            linkedin: nc.linkedin?.trim() || undefined,
            category: nc.cold_contact_category || undefined,
          });
        }
      }
    }

    if (contacts.length === 0) return;

    let addedCount = 0;
    for (const c of contacts) {
      try {
        const check = await connectionApi.checkDuplicate(c.name, c.company, c.linkedin);
        if (check.exists) continue; // skip duplicate
        await connectionApi.create({
          contact_name: c.name,
          company_name: c.company || undefined,
          linkedin_profile_id: c.linkedin || undefined,
          category: c.category || undefined,
          stage: 'Need to Connect',
          connection_status: 'Pending',
        });
        addedCount++;
      } catch (err) {
        console.error('Failed to auto-add contact to connections:', err);
      }
    }

    if (addedCount > 0) {
      setAutoAddToast(`${addedCount} contact${addedCount > 1 ? 's' : ''} added to "Need to Connect"`);
      setTimeout(() => setAutoAddToast(null), 4000);
    }
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

      // Handle custom applied on
      if (formData.applied_on === 'Other' && customAppliedOn) {
        cleanedData.applied_on = customAppliedOn;
      } else if (formData.applied_on) {
        cleanedData.applied_on = formData.applied_on;
      }

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
      if (formData.interview_date) cleanedData.interview_date = formData.interview_date;
      if (formData.status === 'Rejected' && formData.status_stage) cleanedData.status_stage = formData.status_stage;
      if (formData.contact_linkedin) cleanedData.contact_linkedin = formData.contact_linkedin;
      if (formData.networking_contacts && formData.networking_contacts.length > 0) cleanedData.networking_contacts = formData.networking_contacts;

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
      // Auto-add contacts to "Need to Connect"
      await autoAddContacts(cleanedData);
      onSuccess();
    } catch (error) {
      console.error('Error creating application:', error);
      alert('Failed to create application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {autoAddToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>✓</span> {autoAddToast}
        </div>
      )}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Application Date</label>
              <input
                type="datetime-local"
                name="application_date"
                value={formData.application_date || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Auto-filled with current date & time</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Applied On (optional)</label>
              <select
                name="applied_on"
                value={formData.applied_on === 'Other' || isCustomAppliedOn ? 'Other' : (formData.applied_on || '')}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
              >
                <option value="">Select platform...</option>
                {APPLIED_ON_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>

              {isCustomAppliedOn && (
                <input
                  type="text"
                  value={customAppliedOn}
                  onChange={(e) => setCustomAppliedOn(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                  placeholder="Enter platform name..."
                  required={isCustomAppliedOn}
                />
              )}
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <div className="flex items-center gap-2">
                  <FaLinkedin className="text-blue-600" />
                  Contact Person LinkedIn Profile
                </div>
              </label>
              <input
                type="url"
                name="contact_linkedin"
                value={formData.contact_linkedin || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            {/* Cold Email/Message — Main Contact Person */}
            <div className="md:col-span-2">
              {/* Toggle button */}
              <button
                type="button"
                onClick={() => {
                  const next = !formData.contact_cold_message_sent;
                  setFormData(prev => ({
                    ...prev,
                    contact_cold_message_sent: next,
                    ...(next ? {} : { contact_cold_message_via: '', contact_cold_contact_category: '', contact_cold_contact_emails: [], contact_cold_message_body: '' })
                  }));
                  setContactEmailInput('');
                  if (!formData.contact_cold_message_sent) setShowContactColdDetails(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${formData.contact_cold_message_sent
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                  : 'bg-gray-50 dark:bg-slate-700/40 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <FaEnvelope className={formData.contact_cold_message_sent ? 'text-indigo-500' : 'text-gray-400'} />
                  Cold email / message sent to this contact?
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${formData.contact_cold_message_sent
                  ? 'bg-indigo-100 dark:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300'
                  : 'bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-400'
                  }`}>
                  {formData.contact_cold_message_sent ? 'Yes' : 'No'}
                </span>
              </button>

              {formData.contact_cold_message_sent && (
                <div className="mt-2 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/50 rounded-lg overflow-hidden">
                  {/* Summary row + expand toggle */}
                  <button
                    type="button"
                    onClick={() => setShowContactColdDetails(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    <span>Fill in details (via, category, email addresses, message body)</span>
                    {showContactColdDetails ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                  </button>

                  {showContactColdDetails && (
                    <div className="px-4 pb-4 space-y-3 border-t border-indigo-200 dark:border-indigo-800/50 pt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Via</label>
                          <select
                            name="contact_cold_message_via"
                            value={formData.contact_cold_message_via || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          >
                            <option value="">Select...</option>
                            {COLD_MESSAGE_VIA_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Contact Category</label>
                          <select
                            name="contact_cold_contact_category"
                            value={formData.contact_cold_contact_category || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          >
                            <option value="">Select...</option>
                            {COLD_CONTACT_CATEGORY_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {formData.contact_cold_message_via === 'Email' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Recipient Email Address(es)</label>
                          {/* Pill list */}
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {(formData.contact_cold_contact_emails || []).map((em, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">
                                {em}
                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, contact_cold_contact_emails: (prev.contact_cold_contact_emails || []).filter((_, j) => j !== i) }))} className="hover:text-red-500">
                                  <FaTimes className="text-[10px]" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={contactEmailInput}
                              onChange={e => setContactEmailInput(e.target.value)}
                              onKeyDown={e => {
                                if ((e.key === 'Enter' || e.key === ',') && contactEmailInput.trim()) {
                                  e.preventDefault();
                                  setFormData(prev => ({ ...prev, contact_cold_contact_emails: [...(prev.contact_cold_contact_emails || []), contactEmailInput.trim()] }));
                                  setContactEmailInput('');
                                }
                              }}
                              placeholder="Type email and press Enter"
                              className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (contactEmailInput.trim()) {
                                  setFormData(prev => ({ ...prev, contact_cold_contact_emails: [...(prev.contact_cold_contact_emails || []), contactEmailInput.trim()] }));
                                  setContactEmailInput('');
                                }
                              }}
                              className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                            >
                              <FaPlus />
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add each address</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Message / Email Body</label>
                        <textarea
                          name="contact_cold_message_body"
                          value={formData.contact_cold_message_body || ''}
                          onChange={handleInputChange}
                          rows={4}
                          placeholder="Paste the cold email or message you sent..."
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Networking Contacts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Networking Contacts
              <span className="text-xs font-normal text-gray-500 ml-2">(People working at this company)</span>
            </label>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-3">
              {/* Name + LinkedIn + Email row */}
              <div className="grid grid-cols-1 gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="Name"
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm"
                  />
                  <input
                    type="url"
                    value={newContactLinkedin}
                    onChange={(e) => setNewContactLinkedin(e.target.value)}
                    placeholder="LinkedIn URL"
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <FaEnvelope className="text-gray-400 text-sm flex-shrink-0" />
                  <input
                    type="email"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    placeholder="Contact's email address (optional)"
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm"
                  />
                </div>
              </div>

              {/* Cold message toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !newColdMessageSent;
                  setNewColdMessageSent(next);
                  if (!next) { setNewColdMessageVia(''); setNewColdContactName(''); setNewColdContactCategory(''); setNewColdContactEmails([]); setNewColdEmailInput(''); setNewColdMessageBody(''); setShowNetColdDetails(false); }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${newColdMessageSent
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-indigo-300'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <FaEnvelope className={newColdMessageSent ? 'text-indigo-500' : 'text-gray-400'} />
                  Cold email / message sent to this contact?
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${newColdMessageSent ? 'bg-indigo-100 dark:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-slate-600 text-gray-500'
                  }`}>{newColdMessageSent ? 'Yes' : 'No'}</span>
              </button>

              {newColdMessageSent && (
                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/50 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowNetColdDetails(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    <span>Fill in details (via, category, email addresses, message body)</span>
                    {showNetColdDetails ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                  </button>

                  {showNetColdDetails && (
                    <div className="px-4 pb-4 space-y-3 border-t border-indigo-200 dark:border-indigo-800/50 pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Via</label>
                          <select
                            value={newColdMessageVia}
                            onChange={(e) => setNewColdMessageVia(e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                          >
                            <option value="">Select...</option>
                            {COLD_MESSAGE_VIA_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Contact Name</label>
                          <input
                            type="text"
                            value={newColdContactName}
                            onChange={(e) => setNewColdContactName(e.target.value)}
                            placeholder="Who you messaged"
                            className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
                        <select
                          value={newColdContactCategory}
                          onChange={(e) => setNewColdContactCategory(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        >
                          <option value="">Select...</option>
                          {COLD_CONTACT_CATEGORY_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      {newColdMessageVia === 'Email' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Recipient Email Address(es)</label>
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            {newColdContactEmails.map((em, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">
                                {em}
                                <button type="button" onClick={() => setNewColdContactEmails(prev => prev.filter((_, j) => j !== i))} className="hover:text-red-500">
                                  <FaTimes className="text-[10px]" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              type="email"
                              value={newColdEmailInput}
                              onChange={e => setNewColdEmailInput(e.target.value)}
                              onKeyDown={e => {
                                if ((e.key === 'Enter' || e.key === ',') && newColdEmailInput.trim()) {
                                  e.preventDefault();
                                  setNewColdContactEmails(prev => [...prev, newColdEmailInput.trim()]);
                                  setNewColdEmailInput('');
                                }
                              }}
                              placeholder="Type email and press Enter"
                              className="flex-1 px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => { if (newColdEmailInput.trim()) { setNewColdContactEmails(prev => [...prev, newColdEmailInput.trim()]); setNewColdEmailInput(''); } }}
                              className="px-2 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                              <FaPlus className="text-xs" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add each address</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Message / Email Body</label>
                        <textarea
                          value={newColdMessageBody}
                          onChange={(e) => setNewColdMessageBody(e.target.value)}
                          rows={3}
                          placeholder="Paste the cold email or message you sent..."
                          className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Add button */}
              <button
                type="button"
                onClick={addNetworkingContact}
                disabled={!newContactName || !newContactLinkedin}
                className="w-full py-1.5 flex items-center justify-center gap-2 border border-dashed border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors"
              >
                <FaPlus className="text-xs" /> Add Contact
              </button>
            </div>

            {formData.networking_contacts && formData.networking_contacts.length > 0 && (
              <div className="space-y-2 mt-3">
                {formData.networking_contacts.map((contact, index) => (
                  <div key={index} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-600">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FaLinkedin className="text-blue-600 flex-shrink-0" />
                      <span className="font-medium text-sm text-gray-900 dark:text-white">{contact.name}</span>
                      <a
                        href={contact.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline truncate max-w-[150px]"
                      >
                        {contact.linkedin}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNetworkingContact(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
    </>
  );
};

