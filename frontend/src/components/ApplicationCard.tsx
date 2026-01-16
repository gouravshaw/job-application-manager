import { useState, useEffect, useMemo } from 'react';
import { FaBuilding, FaMapMarkerAlt, FaMoneyBillWave, FaTrash, FaEdit, FaFilePdf, FaExternalLinkAlt, FaClock, FaHistory, FaFileAlt, FaArchive, FaCheckCircle, FaTimes, FaTag, FaArrowRight } from 'react-icons/fa';
import { JobApplication, STATUS_OPTIONS, WORK_TYPE_OPTIONS, APPLIED_ON_OPTIONS, REJECTION_STAGE_OPTIONS } from '../types';
import { applicationApi } from '../services/api';
import { TagsInput } from './TagsInput';
import { TimelineView, TimelineStats } from './TimelineView';

interface ApplicationCardProps {
  application: JobApplication;
  onUpdate: () => void;
  isSelected?: boolean;
  onContinueApplying?: (application: JobApplication) => void;
}

export const ApplicationCard = ({ application, onUpdate, isSelected = false, onContinueApplying }: ApplicationCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editData, setEditData] = useState(application);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showStatusHistory, setShowStatusHistory] = useState(false);
  const [showJobDescription, setShowJobDescription] = useState(false);
  const [showInterviewPrep, setShowInterviewPrep] = useState(false);
  const [statusChangeDate, setStatusChangeDate] = useState(new Date().toISOString().slice(0, 16));
  const [statusChangeNotes, setStatusChangeNotes] = useState('');
  const [statusChangeStage, setStatusChangeStage] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const tags = await applicationApi.getTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      Saved: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700/40 dark:to-gray-600/40 dark:text-gray-300',
      'To Apply': 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700 dark:from-indigo-900/40 dark:to-indigo-800/40 dark:text-indigo-300',
      Applied: 'bg-gradient-to-r from-blue-100 to-cyan-200 text-blue-700 dark:from-blue-900/40 dark:to-cyan-800/40 dark:text-blue-300',
      Screening: 'bg-gradient-to-r from-yellow-100 to-amber-200 text-yellow-700 dark:from-yellow-900/40 dark:to-amber-800/40 dark:text-yellow-300',
      'Aptitude Test': 'bg-gradient-to-r from-amber-100 to-orange-200 text-amber-700 dark:from-amber-900/40 dark:to-orange-800/40 dark:text-amber-300',
      Interview: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 dark:from-purple-900/40 dark:to-purple-800/40 dark:text-purple-300',
      'Technical Test': 'bg-gradient-to-r from-orange-100 to-red-200 text-orange-700 dark:from-orange-900/40 dark:to-red-800/40 dark:text-orange-300',
      'Second Interview': 'bg-gradient-to-r from-violet-100 to-purple-200 text-violet-700 dark:from-violet-900/40 dark:to-purple-800/40 dark:text-violet-300',
      'Final Interview': 'bg-gradient-to-r from-fuchsia-100 to-pink-200 text-fuchsia-700 dark:from-fuchsia-900/40 dark:to-pink-800/40 dark:text-fuchsia-300',
      Offer: 'bg-gradient-to-r from-emerald-100 to-green-200 text-emerald-700 dark:from-emerald-900/40 dark:to-green-800/40 dark:text-emerald-300',
      Accepted: 'bg-gradient-to-r from-green-100 to-teal-200 text-green-700 dark:from-green-900/40 dark:to-teal-800/40 dark:text-green-300',
      Rejected: 'bg-gradient-to-r from-red-100 to-rose-200 text-red-700 dark:from-red-900/40 dark:to-rose-800/40 dark:text-red-300',
      Withdrawn: 'bg-gradient-to-r from-gray-100 to-slate-200 text-gray-700 dark:from-gray-700/40 dark:to-slate-600/40 dark:text-gray-300',
    };
    return colors[status] || 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700/40 dark:to-gray-600/40 dark:text-gray-300';
  };

  const latestRejectedStage = useMemo(() => {
    const normalizeHistory = (history: any): any[] => {
      let h = history;
      for (let i = 0; i < 2; i++) {
        if (typeof h === 'string') {
          try {
            h = JSON.parse(h);
          } catch {
            break;
          }
        }
      }
      if (Array.isArray(h)) return h;
      if (h && typeof h === 'object' && (h as any).status) return [h];
      return [];
    };

    const historyArray = normalizeHistory(application.status_history);

    for (const entry of [...historyArray].reverse()) {
      if (entry.status === 'Rejected' && entry.stage) {
        return entry.stage as string;
      }
    }
    return undefined;
  }, [application.status_history]);

  const getStatusBorderColor = (status: string) => {
    const colors: { [key: string]: string } = {
      Saved: '#9ca3af',
      'To Apply': '#6366f1',
      Applied: '#3b82f6',
      Screening: '#eab308',
      'Aptitude Test': '#f59e0b',
      Interview: '#a855f7',
      'Technical Test': '#f97316',
      'Second Interview': '#8b5cf6',
      'Final Interview': '#d946ef',
      Offer: '#10b981',
      Accepted: '#22c55e',
      Rejected: '#ef4444',
      Withdrawn: '#6b7280',
    };
    return colors[status] || '#9ca3af';
  };

  const isDeadlineApproaching = (deadline?: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilDeadline > 0 && daysUntilDeadline <= 3; // Within 3 days
  };

  const isDeadlinePassed = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await applicationApi.delete(application.id);
        alert('Application deleted successfully!');
        onUpdate();
      } catch (error) {
        console.error('Error deleting application:', error);
        alert('Failed to delete application.');
      }
    }
  };

  const handleArchiveToggle = async () => {
    const isArchived = application.is_archived === 1;
    const action = isArchived ? 'unarchive' : 'archive';
    
    if (window.confirm(`Are you sure you want to ${action} this application?`)) {
      setArchiving(true);
      try {
        if (isArchived) {
          await applicationApi.unarchive(application.id);
          alert('Application unarchived successfully!');
        } else {
          await applicationApi.archive(application.id);
          alert('Application archived successfully!');
        }
        onUpdate();
      } catch (error) {
        console.error(`Error ${action}ing application:`, error);
        alert(`Failed to ${action} application.`);
      } finally {
        setArchiving(false);
      }
    }
  };

  useEffect(() => {
    if (isEditing && editData.status === 'Rejected' && statusChangeStage === '') {
      // Try to default to last recorded stage if available
      const lastRejectedEntry = application.status_history
        ?.slice()
        .reverse()
        .find(entry => entry.status === 'Rejected' && entry.stage);
      const fallbackStage = lastRejectedEntry?.stage || application.status || REJECTION_STAGE_OPTIONS[0];
      setStatusChangeStage(fallbackStage);
    }
    if (editData.status !== 'Rejected' && statusChangeStage) {
      setStatusChangeStage('');
    }
  }, [editData.status, statusChangeStage, application.status, isEditing]);

  const handleUpdate = async () => {
    try {
      // Build update payload with only non-empty values
      const cleanedData: any = {
        company_name: editData.company_name,
        job_title: editData.job_title,
        status: editData.status,
      };

      // Add optional fields only if they have values
      if (editData.application_date) cleanedData.application_date = editData.application_date;
      if (editData.application_deadline) cleanedData.application_deadline = editData.application_deadline;
      if (editData.applied_on) cleanedData.applied_on = editData.applied_on;
      if (editData.job_url) cleanedData.job_url = editData.job_url;
      if (editData.location) cleanedData.location = editData.location;
      if (editData.work_type) cleanedData.work_type = editData.work_type;
      if (editData.domain) cleanedData.domain = editData.domain;
      if (editData.salary_min !== undefined) cleanedData.salary_min = editData.salary_min;
      if (editData.salary_max !== undefined) cleanedData.salary_max = editData.salary_max;
      if (editData.contact_person) cleanedData.contact_person = editData.contact_person;
      if (editData.contact_email) cleanedData.contact_email = editData.contact_email;
      if (editData.references) cleanedData.references = editData.references;
      if (editData.job_description) cleanedData.job_description = editData.job_description;
      if (editData.notes) cleanedData.notes = editData.notes;
      if (editData.tags && editData.tags.length > 0) cleanedData.tags = editData.tags;
      if (editData.interview_notes) cleanedData.interview_notes = editData.interview_notes;
      if (editData.interview_questions) cleanedData.interview_questions = editData.interview_questions;
      if (editData.interview_date) cleanedData.interview_date = editData.interview_date;
      
      const statusChanged = editData.status !== application.status;

      // If status changed, add status change info
      if (statusChanged) {
        cleanedData.status_date = statusChangeDate;
        cleanedData.status_notes = statusChangeNotes || `Status changed to ${editData.status}`;
        if (editData.status === 'Rejected') {
          cleanedData.status_stage = statusChangeStage || application.status || 'Unknown stage';
        } else if (statusChangeStage) {
          cleanedData.status_stage = statusChangeStage;
        }
      } else if (editData.status === 'Rejected' && statusChangeStage) {
        // Allow updating rejection stage without changing status
        cleanedData.status_stage = statusChangeStage;
        if (statusChangeNotes) {
          cleanedData.status_notes = statusChangeNotes;
        }
        cleanedData.status_date = statusChangeDate;
      }
      
      await applicationApi.update(application.id, cleanedData);
      
      // Upload new CV if provided
      if (cvFile) {
        await applicationApi.uploadDocument(application.id, 'cv', cvFile);
        setCvFile(null);
      }
      
      // Upload new cover letter if provided
      if (coverLetterFile) {
        await applicationApi.uploadDocument(application.id, 'coverletter', coverLetterFile);
        setCoverLetterFile(null);
      }
      
      alert('Application updated successfully!');
      setIsEditing(false);
      setStatusChangeNotes('');
      setStatusChangeStage('');
      onUpdate();
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application.');
    }
  };

  const handleDownloadCV = async () => {
    if (application.cv_filename) {
      try {
        setUploading(true);
        await applicationApi.downloadDocument(application.id, 'cv', application.cv_filename);
      } catch (error) {
        console.error('Error downloading CV:', error);
        alert('Failed to download CV.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDownloadCoverLetter = async () => {
    if (application.coverletter_filename) {
      try {
        setUploading(true);
        await applicationApi.downloadDocument(application.id, 'coverletter', application.coverletter_filename);
      } catch (error) {
        console.error('Error downloading cover letter:', error);
        alert('Failed to download cover letter.');
      } finally {
        setUploading(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isEditing) {
    const statusChanged = editData.status !== application.status;
    
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={editData.company_name}
              onChange={(e) => setEditData({ ...editData, company_name: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              placeholder="Company Name"
            />
            <input
              type="text"
              value={editData.job_title}
              onChange={(e) => setEditData({ ...editData, job_title: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              placeholder="Job Title"
            />
            <input
              type="text"
              value={editData.domain || ''}
              onChange={(e) => setEditData({ ...editData, domain: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              placeholder="Domain"
            />
            <input
              type="text"
              value={editData.location || ''}
              onChange={(e) => setEditData({ ...editData, location: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              placeholder="Location"
            />
            <select
              value={editData.work_type || ''}
              onChange={(e) => setEditData({ ...editData, work_type: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
            >
              <option value="">Work Type</option>
              {WORK_TYPE_OPTIONS.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={editData.status}
              onChange={(e) => {
                setEditData({ ...editData, status: e.target.value });
                setStatusChangeDate(new Date().toISOString().slice(0, 16));
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              value={editData.applied_on || ''}
              onChange={(e) => setEditData({ ...editData, applied_on: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
            >
              <option value="">Applied On (optional)</option>
              {APPLIED_ON_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Status Change Date, Notes, and Rejection Stage */}
          {(statusChanged || editData.status === 'Rejected') && (
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md border border-blue-200 dark:border-blue-700">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Status Details</h4>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm text-blue-800 dark:text-blue-300 mb-1">Change Date & Time</label>
                  <input
                    type="datetime-local"
                    value={statusChangeDate}
                    onChange={(e) => setStatusChangeDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-blue-800 dark:text-blue-300 mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    value={statusChangeNotes}
                    onChange={(e) => setStatusChangeNotes(e.target.value)}
                    placeholder={`Status: ${editData.status}`}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                  />
                </div>
                {editData.status === 'Rejected' && (
                  <div>
                    <label className="block text-sm text-blue-800 dark:text-blue-300 mb-1">Rejection Stage</label>
                    <select
                      value={statusChangeStage}
                      onChange={(e) => setStatusChangeStage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {REJECTION_STAGE_OPTIONS.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                    <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                      Helps capture how far the process went before rejection.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-300">Upload New CV</label>
              <input
                type="file"
                onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-300">Upload New Cover Letter</label>
              <input
                type="file"
                onChange={(e) => setCoverLetterFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <textarea
            value={editData.references || ''}
            onChange={(e) => setEditData({ ...editData, references: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            rows={2}
            placeholder="References"
          />

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">Job Description</label>
            <textarea
              value={editData.job_description || ''}
              onChange={(e) => setEditData({ ...editData, job_description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
              rows={6}
              placeholder="Paste job description..."
            />
          </div>

          <textarea
            value={editData.notes || ''}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
            placeholder="Notes"
          />

          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditData(application);
                setCvFile(null);
                setCoverLetterFile(null);
                setStatusChangeNotes('');
                setStatusChangeStage('');
              }}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm hover:shadow-lg transition-all card-hover border border-gray-100 dark:border-slate-700 pl-10 relative h-full flex flex-col cursor-pointer" style={{ borderLeftWidth: '4px', borderLeftColor: getStatusBorderColor(application.status) }}>
      {/* Selection Checkbox */}
      {isSelected !== undefined && (
        <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            readOnly
            className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
          />
        </div>
      )}
      
      {/* Clickable Area for Details */}
      <div onClick={() => setShowDetailModal(true)} className="flex-1 flex flex-col">
        {/* Header: Job Title and Status */}
        <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{application.job_title}</h3>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-3">
          <FaBuilding className="text-gray-400 dark:text-gray-500 text-sm" />
          <span className="font-medium">{application.company_name}</span>
        </div>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(application.status)}`}>
          {application.status}
          {application.status === 'Rejected' && (
            <span className="ml-1 text-[11px] font-semibold opacity-90">
              — {latestRejectedStage || 'Not specified'}
            </span>
          )}
        </span>
      </div>

      {/* Archived Badge */}
      {application.is_archived === 1 && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-xs font-semibold">
            <FaArchive className="text-xs" />
            Archived
          </span>
        </div>
      )}

      {/* Domain Badge */}
      {application.domain && (
        <div className="mb-3">
          <span className="inline-block bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full text-xs font-medium">
            {application.domain}
          </span>
        </div>
      )}

      {/* Key Info */}
      <div className="space-y-2 mb-4 flex-1">
        {/* Date Info - Prominent Display */}
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/30 px-2.5 py-1.5 rounded-lg">
          <FaClock className="text-xs flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium">
            {application.application_date
              ? `Applied: ${new Date(application.application_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}${application.applied_on ? ` via ${application.applied_on}` : ''}`
              : `Saved: ${new Date(application.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
            }
          </span>
        </div>

        {application.location && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <FaMapMarkerAlt className="text-xs flex-shrink-0" />
            <span className="text-sm truncate">{application.location}</span>
            {application.work_type && (
              <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded flex-shrink-0">
                {application.work_type}
              </span>
            )}
          </div>
        )}
        {(application.salary_min || application.salary_max) && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <FaMoneyBillWave className="text-xs flex-shrink-0" />
            <span className="text-sm">
              {application.salary_min && `£${application.salary_min.toLocaleString()}`}
              {application.salary_min && application.salary_max && ' - '}
              {application.salary_max && `£${application.salary_max.toLocaleString()}`}
            </span>
          </div>
        )}

        {/* Deadline Warning */}
        {application.application_deadline && (application.status === 'Saved' || application.status === 'To Apply') && (
          <div className={`p-2 rounded-md text-xs ${
            isDeadlinePassed(application.application_deadline)
              ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : isDeadlineApproaching(application.application_deadline)
              ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
              : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          }`}>
            <div className="flex items-center gap-1.5">
              <FaClock className="text-xs flex-shrink-0" />
              <span className="font-medium">
                {isDeadlinePassed(application.application_deadline)
                  ? 'Deadline Passed'
                  : formatDate(application.application_deadline)}
              </span>
            </div>
          </div>
        )}

        {/* Tags - Show first 2 only */}
        {application.tags && application.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {application.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"
              >
                <FaTag className="text-[10px]" />
                {tag}
              </span>
            ))}
            {application.tags.length > 2 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5">
                +{application.tags.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Continue Applying Button */}
      {(application.status === 'Saved' || application.status === 'To Apply') && onContinueApplying && (
        <div className="mb-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContinueApplying(application);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg text-sm"
          >
            <FaArrowRight className="text-xs" />
            Continue Applying
          </button>
        </div>
      )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setIsEditing(true)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm font-medium"
          title="Edit"
        >
          <FaEdit className="text-xs" />
          Edit
        </button>
        {application.job_url && (
          <a
            href={application.job_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors text-sm font-medium"
            title="View Job"
          >
            <FaExternalLinkAlt className="text-xs" />
            View
          </a>
        )}
        <button
          onClick={() => setShowDetailModal(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors text-sm"
          title="View Details"
        >
          <FaHistory className="text-xs" />
        </button>
        <button
          onClick={handleArchiveToggle}
          disabled={archiving}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-sm ${
            application.is_archived === 1
              ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
              : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
          } disabled:opacity-50`}
          title={application.is_archived === 1 ? 'Unarchive' : 'Archive'}
        >
          {application.is_archived === 1 ? <FaCheckCircle className="text-xs" /> : <FaArchive className="text-xs" />}
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
          title="Delete"
        >
          <FaTrash className="text-xs" />
        </button>
      </div>

    </div>

    {/* Detail Modal */}
    {showDetailModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-6 flex justify-between items-start z-10">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{application.job_title}</h2>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <FaBuilding />
                  <span className="font-medium">{application.company_name}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(application.status)}`}>
                  {application.status}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {application.domain && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Domain</h3>
                  <span className="inline-block bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm font-medium">
                    {application.domain}
                  </span>
                </div>
              )}
              {application.location && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Location</h3>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <FaMapMarkerAlt className="text-sm" />
                    <span>{application.location}</span>
                    {application.work_type && (
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                        {application.work_type}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {(application.salary_min || application.salary_max) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Salary Range</h3>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <FaMoneyBillWave />
                    <span>
                      {application.salary_min && `£${application.salary_min.toLocaleString()}`}
                      {application.salary_min && application.salary_max && ' - '}
                      {application.salary_max && `£${application.salary_max.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Date</h3>
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <FaClock />
                  <span>
                    {application.application_date
                      ? `Applied: ${formatDate(application.application_date)}${application.applied_on ? ` via ${application.applied_on}` : ''}`
                      : `Saved: ${formatDate(application.created_at)}`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {application.tags && application.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {application.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium"
                    >
                      <FaTag className="text-xs" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Job Description */}
            {application.job_description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Job Description</h3>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-gray-700 dark:text-green-100 whitespace-pre-wrap">
                    {application.job_description}
                  </div>
                </div>
              </div>
            )}

            {/* Status History */}
            {application.status_history && application.status_history.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Status History</h3>
                <div className="space-y-2">
                  {[...application.status_history].reverse().map((entry, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900 dark:text-white">{formatDate(entry.date)}</div>
                        {entry.notes && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{entry.notes}</div>
                        )}
                    {entry.stage && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Stage: {entry.stage}
                      </div>
                    )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interview Preparation */}
            {(application.interview_date || application.interview_notes || application.interview_questions) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Interview Preparation</h3>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg space-y-3">
                  {application.interview_date && (
                    <div>
                      <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1">Scheduled:</p>
                      <p className="text-sm text-purple-900 dark:text-purple-200">
                        {new Date(application.interview_date).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {application.interview_notes && (
                    <div>
                      <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1">Preparation Notes:</p>
                      <p className="text-sm text-purple-900 dark:text-purple-200 whitespace-pre-wrap">{application.interview_notes}</p>
                    </div>
                  )}
                  {application.interview_questions && (
                    <div>
                      <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1">Questions:</p>
                      <p className="text-sm text-purple-900 dark:text-purple-200 whitespace-pre-wrap">{application.interview_questions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {application.notes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Notes</h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{application.notes}</p>
                </div>
              </div>
            )}

            {/* References */}
            {application.references && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">References</h3>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-900 dark:text-yellow-200">{application.references}</p>
                </div>
              </div>
            )}

            {/* Documents & Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Documents & Links</h3>
              <div className="flex flex-wrap gap-3">
                {application.cv_filename && (
                  <button
                    onClick={handleDownloadCV}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors font-medium"
                  >
                    <FaFilePdf />
                    Download CV
                  </button>
                )}
                {application.coverletter_filename && (
                  <button
                    onClick={handleDownloadCoverLetter}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors font-medium"
                  >
                    <FaFilePdf />
                    Download Cover Letter
                  </button>
                )}
                {application.job_url && (
                  <a
                    href={application.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors font-medium"
                  >
                    <FaExternalLinkAlt />
                    View Job Posting
                  </a>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Timeline</h3>
              <TimelineStats application={application} />
              <TimelineView application={application} />
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
