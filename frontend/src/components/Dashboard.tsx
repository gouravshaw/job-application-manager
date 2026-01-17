import { useEffect, useState } from 'react';
import { FaBriefcase, FaCheckCircle, FaClock, FaChartPie, FaDownload, FaTimesCircle } from 'react-icons/fa';
import { ApplicationStats } from '../types';
import { applicationApi } from '../services/api';

interface DashboardProps {
  onCardClick?: (filterType: string, filterValue: string) => void;
}

export const Dashboard = ({ onCardClick }: DashboardProps) => {
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await applicationApi.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSavedCount = () => {
    if (!stats) return 0;
    return (stats.by_status['Saved'] || 0) + (stats.by_status['To Apply'] || 0);
  };

  const getAppliedCount = () => {
    if (!stats) return 0;
    const saved = (stats.by_status['Saved'] || 0) + (stats.by_status['To Apply'] || 0);
    return stats.total_applications - saved;
  };

  const handleExportExcel = async () => {
    try {
      setDownloading(true);
      await applicationApi.exportToExcel();
      alert('Excel file downloaded successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stats) {
    return <div>No data available</div>;
  }

  const totalRejections = Object.values(stats.rejections_by_stage || {}).reduce((sum, count) => sum + count, 0);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      Applied: 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900/40 dark:to-blue-800/40 dark:text-blue-300',
      Screening: 'bg-gradient-to-br from-yellow-100 to-amber-200 text-yellow-700 dark:from-yellow-900/40 dark:to-amber-800/40 dark:text-yellow-300',
      Interview: 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 dark:from-purple-900/40 dark:to-purple-800/40 dark:text-purple-300',
      'Technical Test': 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 dark:from-orange-900/40 dark:to-orange-800/40 dark:text-orange-300',
      Offer: 'bg-gradient-to-br from-emerald-100 to-green-200 text-emerald-700 dark:from-emerald-900/40 dark:to-green-800/40 dark:text-emerald-300',
      Rejected: 'bg-gradient-to-br from-red-100 to-red-200 text-red-700 dark:from-red-900/40 dark:to-red-800/40 dark:text-red-300',
      Withdrawn: 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700/40 dark:to-gray-600/40 dark:text-gray-300',
    };
    return colors[status] || 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700/40 dark:to-gray-600/40 dark:text-gray-300';
  };

  return (
    <div className="space-y-8">
      {/* Header with Export Button */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">Track your job application progress</p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={downloading || stats.total_applications === 0}
          className="flex items-center gap-2 btn-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaDownload />
          {downloading ? 'Downloading...' : 'Export to Excel'}
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          className="relative overflow-hidden p-6 rounded-2xl transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl border border-blue-100/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/40 dark:to-indigo-900/40 backdrop-blur-md cursor-pointer group"
          onClick={() => onCardClick && onCardClick('all', '')}
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1 tracking-wide uppercase opacity-80">Total Applications</p>
              <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-2">{stats.total_applications}</p>
            </div>
            <div className="p-3.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
              <FaBriefcase className="text-white text-xl" />
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
        </div>

        <div
          className="relative overflow-hidden p-6 rounded-2xl transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl border border-indigo-100/50 dark:border-indigo-800/30 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/40 dark:to-purple-900/40 backdrop-blur-md cursor-pointer group"
          onClick={() => onCardClick && onCardClick('status', 'Saved,To Apply')}
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1 tracking-wide uppercase opacity-80">Need to Apply</p>
              <p className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">{getSavedCount()}</p>
            </div>
            <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
              <FaClock className="text-white text-xl" />
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
        </div>

        <div
          className="relative overflow-hidden p-6 rounded-2xl transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl border border-cyan-100/50 dark:border-cyan-800/30 bg-gradient-to-br from-cyan-50/80 to-blue-50/80 dark:from-cyan-900/40 dark:to-blue-900/40 backdrop-blur-md cursor-pointer group"
          onClick={() => onCardClick && onCardClick('applied', 'true')}
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400 mb-1 tracking-wide uppercase opacity-80">Submitted</p>
              <p className="text-4xl font-extrabold text-cyan-600 dark:text-blue-400 mt-2">{getAppliedCount()}</p>
            </div>
            <div className="p-3.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
              <FaCheckCircle className="text-white text-xl" />
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
        </div>

        <div
          className="relative overflow-hidden p-6 rounded-2xl transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl border border-emerald-100/50 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-900/40 dark:to-green-900/40 backdrop-blur-md group"
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-1 tracking-wide uppercase opacity-80">Success Rate</p>
              <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                {getAppliedCount() > 0
                  ? Math.round(((stats.by_status['Offer'] || 0) / getAppliedCount()) * 100)
                  : 0}
                <span className="text-2xl ml-1">%</span>
              </p>
            </div>
            <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
              <FaCheckCircle className="text-white text-xl" />
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-md">
            <FaChartPie className="text-lg text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Applications by Status</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(stats.by_status).map(([status, count]) => (
            <div
              key={status}
              className={`p-5 rounded-xl ${getStatusColor(status)} cursor-pointer hover:scale-105 transition-transform shadow-sm hover:shadow-md`}
              onClick={() => onCardClick && onCardClick('status', status)}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-80">{status}</p>
              <p className="text-3xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rejections by Stage */}
      {totalRejections > 0 && (
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg shadow-md">
              <FaTimesCircle className="text-lg text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Rejections by Stage</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Understand where applications drop off</p>
            </div>
          </div>
          <div className="space-y-4">
            {Object.entries(stats.rejections_by_stage).map(([stage, count]) => {
              const percentage = totalRejections ? Math.round((count / totalRejections) * 100) : 0;
              return (
                <div
                  key={stage}
                  className="space-y-2 cursor-pointer group hover:bg-red-50 dark:hover:bg-red-900/10 p-2 rounded-lg transition-colors -mx-2"
                  onClick={() => {
                    if (onCardClick) {
                      onCardClick('rejectionStage', stage);
                    }
                  }}
                  title={`View applications rejected at ${stage}`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-800 dark:text-gray-200 font-medium group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{stage}</span>
                    <span className="text-gray-600 dark:text-gray-400">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 rounded-full transition-all duration-500 group-hover:from-red-600 group-hover:via-rose-600 group-hover:to-pink-600"
                      style={{ width: `${Math.max(4, percentage)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Domain Breakdown */}
      {Object.keys(stats.by_domain).length > 0 && (
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Applications by Domain</h3>
          <div className="space-y-4">
            {Object.entries(stats.by_domain).map(([domain, count]) => (
              <div
                key={domain}
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 p-3 rounded-lg transition-colors group"
                onClick={() => onCardClick && onCardClick('domain', domain)}
              >
                <span className="text-gray-700 dark:text-gray-300 font-medium">{domain}</span>
                <div className="flex items-center gap-4">
                  <div className="w-48 bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-500 group-hover:from-blue-700 group-hover:via-indigo-700 group-hover:to-purple-700"
                      style={{ width: `${(count / stats.total_applications) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-900 dark:text-white font-bold min-w-[40px] text-right text-lg">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work Type Breakdown */}
      {Object.keys(stats.by_work_type).length > 0 && (
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Applications by Work Type</h3>
          <div className="flex gap-6 justify-around flex-wrap">
            {Object.entries(stats.by_work_type).map(([workType, count]) => (
              <div
                key={workType}
                className="text-center cursor-pointer hover:scale-110 transition-transform"
                onClick={() => onCardClick && onCardClick('workType', workType)}
              >
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-600 dark:text-blue-400 rounded-2xl w-24 h-24 flex items-center justify-center mx-auto mb-3 shadow-sm hover:shadow-lg transition-all border border-blue-200 dark:border-blue-800/50">
                  <span className="text-3xl font-bold">{count}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium">{workType}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

