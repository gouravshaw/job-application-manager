import { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTimes, FaFilter, FaSort, FaArchive } from 'react-icons/fa';
import { FilterState, STATUS_OPTIONS, WORK_TYPE_OPTIONS, SORT_OPTIONS, REJECTION_STAGE_OPTIONS } from '../types';

interface SearchFilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  domains: string[];
  tags: string[];
}

export const SearchFilterBar = ({ filters, onFilterChange, domains, tags }: SearchFilterBarProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local search with filters.search when it changes externally
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  const handleSearch = () => {
    onFilterChange({ ...filters, search: localSearch });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (field: keyof FilterState, value: any) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const clearFilters = () => {
    setLocalSearch('');
    onFilterChange({
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
    setShowAdvanced(false);
  };

  const hasActiveFilters = filters.search || filters.status || filters.domain || 
    filters.workType || filters.tags.length > 0 || filters.includeArchived || filters.rejectionStage;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 mb-6 space-y-4 border border-gray-100 dark:border-slate-700">
      {/* Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[250px] relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search jobs, companies, locations..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-10 py-2.5 h-11 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                onFilterChange({ ...filters, search: '' });
              }}
              className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          className="px-5 py-2.5 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <FaSearch className="text-sm" />
          Search
        </button>

        {/* Sort Controls */}
        <div className="flex gap-2 items-center">
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="px-3 py-2.5 h-11 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white font-medium"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button
            onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2.5 h-11 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 flex items-center gap-1 font-medium"
            title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            <FaSort />
            <span className="text-xs">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
          </button>
        </div>

        {/* Advanced Filter Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-4 py-2.5 h-11 rounded-lg flex items-center gap-2 transition-all font-medium shadow-sm ${
            showAdvanced || hasActiveFilters
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          <FaFilter />
          Filters
          {hasActiveFilters && <span className="bg-white dark:bg-slate-900 text-purple-600 dark:text-pink-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold animate-pulse">!</span>}
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 h-11 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 text-red-700 dark:text-red-300 rounded-lg hover:from-red-200 hover:to-pink-200 dark:hover:from-red-900/40 dark:hover:to-pink-900/40 transition-all flex items-center gap-2 font-medium"
          >
            <FaTimes />
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 border-t border-gray-200 dark:border-slate-700">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Rejection Stage</label>
            <select
              value={filters.rejectionStage || ''}
              onChange={(e) => handleFilterChange('rejectionStage', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="">All Stages</option>
              {REJECTION_STAGE_OPTIONS.concat(["Not specified"]).map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Applies when status is Rejected.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Domain</label>
            <select
              value={filters.domain}
              onChange={(e) => handleFilterChange('domain', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="">All Domains</option>
              {domains.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Work Type</label>
            <select
              value={filters.workType}
              onChange={(e) => handleFilterChange('workType', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="">All Types</option>
              {WORK_TYPE_OPTIONS.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FaArchive className="inline mr-1" />
              Show Archived
            </label>
            <label className="flex items-center mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.includeArchived}
                onChange={(e) => handleFilterChange('includeArchived', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500 bg-white dark:bg-slate-700 cursor-pointer"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include archived jobs</span>
            </label>
          </div>

          {tags.length > 0 && (
            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Filter by Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      const newTags = filters.tags.includes(tag)
                        ? filters.tags.filter(t => t !== tag)
                        : [...filters.tags, tag];
                      handleFilterChange('tags', newTags);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filters.tags.includes(tag)
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

