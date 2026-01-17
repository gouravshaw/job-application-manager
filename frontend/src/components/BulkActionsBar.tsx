import { useState } from 'react';
import { FaTrash, FaArchive, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { STATUS_OPTIONS, REJECTION_STAGE_OPTIONS } from '../types';
import { applicationApi } from '../services/api';

interface BulkActionsBarProps {
  selectedIds: number[];
  onClear: () => void;
  onSuccess: () => void;
}

import { useToast } from '../context/ToastContext';

export const BulkActionsBar = ({ selectedIds, onClear, onSuccess }: BulkActionsBarProps) => {
  const { showToast } = useToast();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (selectedIds.length === 0) return null;

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} application(s)? This cannot be undone.`)) {
      return;
    }

    setProcessing(true);
    try {
      await applicationApi.bulkDelete(selectedIds);
      showToast(`Successfully deleted ${selectedIds.length} application(s)`, 'success');
      onClear();
      onSuccess();
    } catch (error) {
      console.error('Error deleting applications:', error);
      showToast('Failed to delete applications', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkArchive = async () => {
    setProcessing(true);
    try {
      await applicationApi.bulkArchive(selectedIds);
      showToast(`Successfully archived ${selectedIds.length} application(s)`, 'success');
      onClear();
      onSuccess();
    } catch (error) {
      console.error('Error archiving applications:', error);
      showToast('Failed to archive applications', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    let stage: string | undefined;
    if (status === 'Rejected') {
      const optionsText = REJECTION_STAGE_OPTIONS.map((option, index) => `${index + 1}. ${option}`).join('\n');
      const input = window.prompt(
        `Rejected at which stage?\n${optionsText}\nEnter the number or type the stage name. Leave blank to use the previous status automatically.`,
        '1'
      );
      if (input === null) {
        return;
      }
      const trimmed = input.trim();
      if (trimmed !== '') {
        const asNumber = parseInt(trimmed, 10);
        if (!isNaN(asNumber) && asNumber >= 1 && asNumber <= REJECTION_STAGE_OPTIONS.length) {
          stage = REJECTION_STAGE_OPTIONS[asNumber - 1];
        } else {
          stage = trimmed;
        }
      }
    }
    setProcessing(true);
    try {
      await applicationApi.bulkUpdateStatus(selectedIds, status, stage);
      showToast(`Successfully updated ${selectedIds.length} application(s) to "${status}"`, 'success');
      setShowStatusMenu(false);
      onClear();
      onSuccess();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white rounded-full shadow-2xl px-6 py-4 flex items-center gap-4 z-50 animate-slideUp">
      <span className="font-semibold">{selectedIds.length} selected</span>

      <div className="flex gap-2 border-l border-blue-400 pl-4">
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            disabled={processing}
            className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            title="Update Status"
          >
            <FaCheckCircle />
            Change Status
          </button>

          {showStatusMenu && (
            <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg py-2 w-48 max-h-64 overflow-y-auto">
              {STATUS_OPTIONS.map(status => (
                <button
                  key={status}
                  onClick={() => handleBulkStatusUpdate(status)}
                  className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleBulkArchive}
          disabled={processing}
          className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          title="Archive Selected"
        >
          <FaArchive />
          Archive
        </button>

        <button
          onClick={handleBulkDelete}
          disabled={processing}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          title="Delete Selected"
        >
          <FaTrash />
          Delete
        </button>
      </div>

      <button
        onClick={onClear}
        className="ml-2 p-2 hover:bg-blue-700 rounded-full transition-colors"
        title="Clear Selection"
      >
        <FaTimes />
      </button>
    </div>
  );
};

