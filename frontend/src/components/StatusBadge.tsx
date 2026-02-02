import {
      FaBookmark,
      FaPaperPlane,
      FaEye,
      FaVideo,
      FaClipboardCheck,
      FaTrophy,
      FaTimes,
      FaArchive,
      FaClock
} from 'react-icons/fa';

interface StatusBadgeProps {
      status: string;
      size?: 'sm' | 'md' | 'lg';
      showIcon?: boolean;
}

const STATUS_CONFIG: Record<string, { color: string; icon: JSX.Element; label?: string }> = {
      'Saved': {
            color: 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300',
            icon: <FaBookmark className="inline" />,
      },
      'To Apply': {
            color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            icon: <FaClock className="inline" />,
      },
      'Applied': {
            color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            icon: <FaPaperPlane className="inline" />,
      },
      'CV Screening': {
            color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            icon: <FaEye className="inline" />,
      },
      'Online Assessment': {
            color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
            icon: <FaClipboardCheck className="inline" />,
      },
      'Interviewing': {
            color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
            icon: <FaVideo className="inline" />,
      },
      'Offer': {
            color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            icon: <FaTrophy className="inline" />,
      },
      'Rejected': {
            color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            icon: <FaTimes className="inline" />,
      },
      'Archived': {
            color: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400',
            icon: <FaArchive className="inline" />,
      },
};

const SIZE_CLASSES = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-xs',
      lg: 'px-4 py-1.5 text-sm',
};

export const StatusBadge = ({ status, size = 'md', showIcon = true }: StatusBadgeProps) => {
      const config = STATUS_CONFIG[status] || {
            color: 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300',
            icon: <FaBookmark className="inline" />,
      };

      return (
            <span
                  className={`inline-flex items-center gap-1.5 rounded-full font-semibold shadow-sm ${config.color} ${SIZE_CLASSES[size]} transition-all hover:scale-105`}
            >
                  {showIcon && <span className="text-[0.85em]">{config.icon}</span>}
                  <span>{config.label || status}</span>
            </span>
      );
};
