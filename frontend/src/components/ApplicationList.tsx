import { useEffect, useState, useRef } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { JobApplication, FilterState } from '../types';
import { applicationApi } from '../services/api';
import { ApplicationCard } from './ApplicationCard';
import { ApplicationForm } from './ApplicationForm';
import { SearchFilterBar } from './SearchFilterBar';
import { BulkActionsBar } from './BulkActionsBar';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface ApplicationListProps {
  initialFilter?: { type: string; value: string; timestamp?: number } | null;
}

export const ApplicationList = ({ initialFilter }: ApplicationListProps) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [domains, setDomains] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<FilterState>(() => {
    const defaultFilters = {
      search: '',
      status: '',
      domain: '',
      workType: '',
      tags: [],
      includeArchived: false,
      sortBy: 'created_at',
      sortOrder: 'desc',
      rejectionStage: '',
    };

    if (initialFilter) {
      if (initialFilter.type === 'status') {
        return { ...defaultFilters, status: initialFilter.value };
      } else if (initialFilter.type === 'domain') {
        return { ...defaultFilters, domain: initialFilter.value };
      } else if (initialFilter.type === 'workType') {
        return { ...defaultFilters, workType: initialFilter.value };
      } else if (initialFilter.type === 'applied') {
        // Filter to show only applied (not Saved/To Apply) - handled in loadApplications
        return { ...defaultFilters, status: '' };
      } else if (initialFilter.type === 'rejectionStage') {
        return { ...defaultFilters, status: 'Rejected', rejectionStage: initialFilter.value };
      }
    }

    return defaultFilters;
  });

  // Load initial data
  useEffect(() => {
    loadDomains();
    loadTags();
  }, []);

  // Apply initial filter from dashboard (only when prop changes after mount)
  // The initial state is handled by useState, this handles subsequent updates
  const prevInitialFilterRef = useRef(initialFilter);
  useEffect(() => {
    // Only update if the object reference or timestamp changed and it's not the first render
    // (first render handled by useState)
    if (initialFilter && initialFilter !== prevInitialFilterRef.current) {
      prevInitialFilterRef.current = initialFilter;

      if (initialFilter.type === 'status') {
        setFilters(prev => ({ ...prev, status: initialFilter.value }));
      } else if (initialFilter.type === 'domain') {
        setFilters(prev => ({ ...prev, domain: initialFilter.value }));
      } else if (initialFilter.type === 'workType') {
        setFilters(prev => ({ ...prev, workType: initialFilter.value }));
      } else if (initialFilter.type === 'applied') {
        setFilters(prev => ({ ...prev, status: '' }));
      } else if (initialFilter.type === 'all') {
        setFilters(prev => ({ ...prev, status: '', domain: '', workType: '', rejectionStage: '' }));
      } else if (initialFilter.type === 'rejectionStage') {
        setFilters(prev => ({ ...prev, status: 'Rejected', rejectionStage: initialFilter.value }));
      }
    }
  }, [initialFilter]);

  const getLatestRejectionStage = (app: JobApplication): string | undefined => {
    if (!app.status_history) return undefined;

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

    const historyArray = normalizeHistory(app.status_history);

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
  };

  // Load applications whenever filters change or on mount
  useEffect(() => {
    loadApplications();
  }, [filters]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewApplication: () => setShowForm(true),
    onSearch: () => {
      // Focus search input in SearchFilterBar (handled by ref)
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    },
    onEscape: () => {
      if (showForm) setShowForm(false);
      if (selectedIds.length > 0) setSelectedIds([]);
    },
  });

  const loadApplications = async () => {
    try {
      setLoading(true);

      // Check if status filter has multiple statuses (comma-separated)
      const hasMultipleStatuses = filters.status && filters.status.includes(',');

      // Handle "Applied" filter (exclude Saved/To Apply)
      if (initialFilter?.type === 'applied') {
        const allData = await applicationApi.getAll({
          search: filters.search || undefined,
          domain: filters.domain || undefined,
          work_type: filters.workType || undefined,
          tags: filters.tags.length > 0 ? filters.tags.join(',') : undefined,
          include_archived: filters.includeArchived,
          sort_by: filters.sortBy,
          sort_order: filters.sortOrder,
        });
        const filtered = allData
          .filter(app => app.status !== 'Saved' && app.status !== 'To Apply')
          .filter(app => {
            if (filters.rejectionStage) {
              const stage = getLatestRejectionStage(app);
              return stage === filters.rejectionStage;
            }
            return true;
          });
        setApplications(filtered);
        return;
      }

      // Handle multiple statuses by fetching all and filtering client-side
      if (hasMultipleStatuses) {
        const allData = await applicationApi.getAll({
          search: filters.search || undefined,
          domain: filters.domain || undefined,
          work_type: filters.workType || undefined,
          tags: filters.tags.length > 0 ? filters.tags.join(',') : undefined,
          include_archived: filters.includeArchived,
          sort_by: filters.sortBy,
          sort_order: filters.sortOrder,
        });
        const statuses = filters.status.split(',').map(s => s.trim());
        const filtered = allData
          .filter(app => statuses.includes(app.status))
          .filter(app => {
            if (filters.rejectionStage) {
              const stage = getLatestRejectionStage(app);
              return stage === filters.rejectionStage;
            }
            return true;
          });
        setApplications(filtered);
        return;
      }

      // Normal case - single status or no status filter
      const data = await applicationApi.getAll({
        search: filters.search || undefined,
        status: filters.status || undefined,
        status_stage: filters.rejectionStage || undefined,
        domain: filters.domain || undefined,
        work_type: filters.workType || undefined,
        tags: filters.tags.length > 0 ? filters.tags.join(',') : undefined,
        include_archived: filters.includeArchived,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder,
      });
      const filtered = data.filter(app => {
        if (filters.rejectionStage) {
          const stage = getLatestRejectionStage(app);
          return stage === filters.rejectionStage;
        }
        return true;
      });
      setApplications(filtered);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDomains = async () => {
    try {
      const data = await applicationApi.getDomains();
      setDomains(data);
    } catch (error) {
      console.error('Error loading domains:', error);
    }
  };

  const loadTags = async () => {
    try {
      const data = await applicationApi.getTags();
      setTags(data);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    loadApplications();
    loadDomains();
    loadTags();
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === applications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applications.map(app => app.id));
    }
  };

  const handleBulkSuccess = () => {
    setSelectedIds([]);
    loadApplications();
    loadDomains();
    loadTags();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">My Applications</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {applications.length} {applications.length === 1 ? 'application' : 'applications'}
            {selectedIds.length > 0 && ` (${selectedIds.length} selected)`}
          </p>
          {/* Dashboard Filter Indicator */}
          {initialFilter && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
              <span>
                Filtered by: {initialFilter.type === 'status' && initialFilter.value}
                {initialFilter.type === 'domain' && `Domain - ${initialFilter.value}`}
                {initialFilter.type === 'workType' && `Work Type - ${initialFilter.value}`}
                {initialFilter.type === 'applied' && 'Applied Jobs'}
                {initialFilter.type === 'all' && 'All Applications'}
              </span>
              <button
                onClick={() => {
                  setFilters({
                    search: '',
                    status: '',
                    domain: '',
                    workType: '',
                    tags: [],
                    includeArchived: false,
                    sortBy: 'created_at',
                    sortOrder: 'desc',
                    rejectionStage: '',
                  });
                }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                title="Clear filter"
              >
                <FaTimes />
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {applications.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
            >
              {selectedIds.length === applications.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            title="Keyboard shortcut: N"
          >
            <FaPlus />
            Add Application
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <SearchFilterBar
        filters={filters}
        onFilterChange={setFilters}
        domains={domains}
        tags={tags}
      />

      {/* Applications Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow-md text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No applications yet. Click 'Add Application' to get started!
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">N</kbd> to quickly add a new application
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {applications.map(app => (
            <div key={app.id} className="relative">
              <input
                type="checkbox"
                checked={selectedIds.includes(app.id)}
                onChange={() => toggleSelection(app.id)}
                className="absolute top-4 left-4 w-5 h-5 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 z-20 cursor-pointer shadow-md hover:scale-110 transition-transform"
              />
              <div className={`transition-all h-full ${selectedIds.includes(app.id) ? 'ring-2 ring-blue-500 rounded-xl' : ''}`}>
                <ApplicationCard
                  application={app}
                  onUpdate={handleFormSuccess}
                  isSelected={selectedIds.includes(app.id)}
                  onContinueApplying={(application) => {
                    setEditingApplication(application);
                    setShowForm(true);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
        onSuccess={handleBulkSuccess}
      />

      {/* Application Form Modal */}
      {showForm && (
        <ApplicationForm
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingApplication(null);
          }}
          initialData={editingApplication || undefined}
          isEdit={!!editingApplication}
        />
      )}
    </div>
  );
};

