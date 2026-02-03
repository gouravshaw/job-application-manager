import { useState } from 'react';
import { JobApplication } from '../types';
import { FaCircle, FaCheckCircle, FaTimesCircle, FaHourglass } from 'react-icons/fa';

interface TimelineViewProps {
  application: JobApplication;
}

export const TimelineView = ({ application }: TimelineViewProps) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = (status: string) => {
    if (status.includes('Offer') || status === 'Accepted') {
      return <FaCheckCircle className="text-green-600" />;
    }
    if (status === 'Rejected' || status === 'Withdrawn') {
      return <FaTimesCircle className="text-red-600" />;
    }
    if (status.includes('Interview') || status.includes('Test')) {
      return <FaHourglass className="text-yellow-600" />;
    }
    return <FaCircle className="text-blue-600" />;
  };

  const getStatusColor = (status: string) => {
    if (status.includes('Offer') || status === 'Accepted') return 'border-green-500 bg-green-50';
    if (status === 'Rejected' || status === 'Withdrawn') return 'border-red-500 bg-red-50';
    if (status.includes('Interview') || status.includes('Test')) return 'border-yellow-500 bg-yellow-50';
    return 'border-blue-500 bg-blue-50';
  };

  const calculateDuration = (fromDate: string, toDate: string) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (!application.status_history || application.status_history.length === 0) {
    return null;
  }

  const sortedHistory = [...application.status_history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
      >
        {expanded ? 'Hide Timeline' : 'Show Application Timeline'}
      </button>

      {expanded && (
        <div className="mt-4 pl-4 border-l-4 border-gray-200">
          {sortedHistory.map((entry, index) => {
            const nextEntry = sortedHistory[index + 1];
            const duration = nextEntry ? calculateDuration(entry.date, nextEntry.date) : null;
            const isActive = index === sortedHistory.length - 1;

            return (
              <div key={index} className="relative pb-8 last:pb-0">
                <div className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${getStatusColor(entry.status)} ${isActive ? 'ring-2 ring-blue-300' : ''}`}>
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(entry.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-gray-900">{entry.status}</h4>
                      {isActive && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(entry.date).toLocaleString()}
                    </p>
                    {entry.notes && (
                      <p className="text-sm text-gray-700 mt-2 italic">"{entry.notes}"</p>
                    )}
                    {entry.stage && (
                      <p className="text-xs text-gray-500 mt-2">Stage: {entry.stage}</p>
                    )}
                    {duration !== null && (
                      <p className="text-xs text-gray-500 mt-2">
                        Duration: {duration} {duration === 1 ? 'day' : 'days'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Component to show overall timeline statistics
interface TimelineStatsProps {
  application: JobApplication;
}

export const TimelineStats = ({ application }: TimelineStatsProps) => {
  if (!application.status_history || application.status_history.length < 2) {
    return null;
  }

  const sortedHistory = [...application.status_history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstDate = new Date(sortedHistory[0].date);
  const lastDate = new Date(sortedHistory[sortedHistory.length - 1].date);
  const totalDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex items-center gap-4 text-xs text-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-md">
      <span className="flex items-center gap-1">
        <FaCircle className="text-[6px]" />
        {sortedHistory.length} stages
      </span>
      <span className="flex items-center gap-1">
        <FaHourglass className="text-[10px]" />
        {totalDays} days in process
      </span>
    </div>
  );
};

