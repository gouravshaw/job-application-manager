import { useState, useMemo } from 'react';
import { FaBuilding, FaMapMarkerAlt, FaMoneyBillWave, FaTrash, FaEdit, FaFilePdf, FaExternalLinkAlt, FaClock, FaHistory, FaArchive, FaCheckCircle, FaTimes, FaTag, FaArrowRight } from 'react-icons/fa';
import { JobApplication } from '../types';
import { applicationApi } from '../services/api';

import { TimelineView, TimelineStats } from './TimelineView';
import { ApplicationForm } from './ApplicationForm';
import { useToast } from '../context/ToastContext';

interface ApplicationCardProps {
  application: JobApplication;
  onUpdate: () => void;
  isSelected?: boolean;
  onContinueApplying?: (application: JobApplication) => void;
}

export const ApplicationCard = ({ application, onUpdate, isSelected = false, onContinueApplying }: ApplicationCardProps) => {
  const { showToast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [archiving, setArchiving] = useState(false);



  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      Saved: 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700/40 dark:to-gray-600/40 dark:text-gray-300',
      'To Apply': 'bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 dark:from-indigo-900/40 dark:to-indigo-800/40 dark:text-indigo-300',
      Applied: 'bg-gradient-to-br from-blue-100 to-cyan-200 text-blue-700 dark:from-blue-900/40 dark:to-cyan-800/40 dark:text-blue-300',
      Screening: 'bg-gradient-to-br from-yellow-100 to-amber-200 text-yellow-700 dark:from-yellow-900/40 dark:to-amber-800/40 dark:text-yellow-300',
      'Aptitude Test': 'bg-gradient-to-br from-amber-100 to-orange-200 text-amber-700 dark:from-amber-900/40 dark:to-orange-800/40 dark:text-amber-300',
      Interview: 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 dark:from-purple-900/40 dark:to-purple-800/40 dark:text-purple-300',
      'Interview Result Awaited': 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 dark:from-amber-500/30 dark:to-amber-400/20 dark:text-amber-300',
      'Technical Test': 'bg-gradient-to-br from-orange-100 to-red-200 text-orange-700 dark:from-orange-900/40 dark:to-red-800/40 dark:text-orange-300',
      'Second Interview': 'bg-gradient-to-br from-violet-100 to-purple-200 text-violet-700 dark:from-violet-900/40 dark:to-purple-800/40 dark:text-violet-300',
      'Final Interview': 'bg-gradient-to-br from-fuchsia-100 to-pink-200 text-fuchsia-700 dark:from-fuchsia-900/40 dark:to-pink-800/40 dark:text-fuchsia-300',
      Offer: 'bg-gradient-to-br from-emerald-100 to-green-200 text-emerald-700 dark:from-emerald-900/40 dark:to-green-800/40 dark:text-emerald-300',
      Accepted: 'bg-gradient-to-br from-green-100 to-teal-200 text-green-700 dark:from-green-900/40 dark:to-teal-800/40 dark:text-green-300',
      Rejected: 'bg-gradient-to-br from-red-100 to-rose-200 text-red-700 dark:from-red-900/40 dark:to-rose-800/40 dark:text-red-300',
      Withdrawn: 'bg-gradient-to-br from-gray-100 to-slate-200 text-gray-700 dark:from-gray-700/40 dark:to-slate-600/40 dark:text-gray-300',
    };
    return colors[status] || 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700/40 dark:to-gray-600/40 dark:text-gray-300';
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

    for (let i = historyArray.length - 1; i >= 0; i--) {
      const entry = historyArray[i];
      if (entry.status === 'Rejected') {
        let stageLabel = entry.stage;

        // Backtracking logic
        if (!stageLabel || stageLabel === 'Rejected' || ['Saved', 'To Apply', 'Unknown stage'].includes(stageLabel)) {
          let foundPrev = false;
          for (let j = i - 1; j >= 0; j--) {
            const prevEntry = historyArray[j];
            if (prevEntry.status && !['Rejected', 'Saved', 'To Apply'].includes(prevEntry.status)) {
              stageLabel = prevEntry.status;
              foundPrev = true;
              break;
            }
          }
          if (!foundPrev) {
            stageLabel = 'Not specified';
          }
        }

        if (stageLabel === 'Rejected') stageLabel = 'Applied';
        if (stageLabel === 'Applied') stageLabel = 'CV Screening';

        return stageLabel;
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
      'Interview Result Awaited': '#f59e0b',
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
        showToast('Application deleted successfully!', 'success');
        onUpdate();
      } catch (error) {
        console.error('Error deleting application:', error);
        showToast('Failed to delete application.', 'error');
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
          showToast('Application unarchived successfully!', 'success');
        } else {
          await applicationApi.archive(application.id);
          showToast('Application archived successfully!', 'success');
        }
        onUpdate();
      } catch (error) {
        console.error(`Error ${action}ing application:`, error);
        showToast(`Failed to ${action} application.`, 'error');
      } finally {
        setArchiving(false);
      }
    }
  };





  const handleDownloadCV = async () => {
    if (application.cv_filename) {
      try {
        setUploading(true);
        await applicationApi.downloadDocument(application.id, 'cv', application.cv_filename);
      } catch (error) {
        console.error('Error downloading CV:', error);
        showToast('Failed to download CV.', 'error');
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
        showToast('Failed to download cover letter.', 'error');
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



  return (
    <>
      <div className="glass-card hover:translate-y-[-4px] hover:shadow-xl transition-all duration-300 p-5 rounded-2xl pl-10 relative h-full flex flex-col cursor-pointer border-l-4" style={{ borderLeftColor: getStatusBorderColor(application.status) }}>
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
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getStatusColor(application.status)}`}>
              {application.status}
              {application.status === 'Rejected' && (
                <span className="ml-1 font-bold opacity-90">
                  — {latestRejectedStage || 'Not specified'}
                </span>
              )}
            </span>
          </div>

          {/* Archived Badge */}
          {application.is_archived === 1 && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-xs font-semibold">
                <FaArchive className="text-xs" />
                Archived
              </span>
            </div>
          )}

          {/* Domain Badge */}
          {application.domain && (
            <div className="mb-3">
              <span className="inline-block bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full text-xs font-medium">
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
              <div className={`p-2 rounded-md text-xs ${isDeadlinePassed(application.application_deadline)
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
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"
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
                className="w-full flex items-center justify-center gap-2 btn-primary py-2.5 text-sm"
              >
                <FaArrowRight className="text-xs" />
                Continue Applying
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100/50 dark:border-gray-700/50 mt-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 btn-secondary text-sm"
            title="Edit"
          >
            <FaEdit className="text-blue-500" />
            Edit
          </button>
          {application.job_url && (
            <a
              href={application.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 btn-secondary text-sm"
              title="View Job"
            >
              <FaExternalLinkAlt className="text-purple-500" />
              View
            </a>
          )}
          <button
            onClick={() => setShowDetailModal(true)}
            className="flex items-center justify-center gap-1.5 btn-secondary text-sm px-3"
            title="View Details"
          >
            <FaHistory className="text-gray-500" />
          </button>
          <button
            onClick={handleArchiveToggle}
            disabled={archiving}
            className="flex items-center justify-center gap-1.5 btn-secondary text-sm px-3 disabled:opacity-50"
            title={application.is_archived === 1 ? 'Unarchive' : 'Archive'}
          >
            {application.is_archived === 1 ? <FaCheckCircle className="text-green-500" /> : <FaArchive className="text-orange-500" />}
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center gap-1.5 btn-secondary text-sm px-3 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800"
            title="Delete"
          >
            <FaTrash className="text-red-500" />
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
                    <span className="inline-block bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm font-medium">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium"
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

      {/* Edit Application Modal */}
      {showEditModal && (
        <ApplicationForm
          isEdit={true}
          initialData={application}
          onSuccess={() => {
            setShowEditModal(false);
            onUpdate();
          }}
          onCancel={() => setShowEditModal(false)}
        />
      )}

    </>
  );
};
