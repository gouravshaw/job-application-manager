import { ReactNode } from 'react';
import { FaBriefcase, FaSearch, FaFilter, FaInbox } from 'react-icons/fa';

interface EmptyStateProps {
      variant?: 'no-applications' | 'no-results' | 'no-filtered-results' | 'default';
      title?: string;
      description?: string;
      icon?: ReactNode;
      action?: {
            label: string;
            onClick: () => void;
      };
}

const VARIANTS = {
      'no-applications': {
            icon: <FaBriefcase className="text-6xl text-blue-400 dark:text-blue-500" />,
            title: 'No Applications Yet',
            description: 'Start tracking your job search journey by adding your first application!',
      },
      'no-results': {
            icon: <FaSearch className="text-6xl text-gray-400 dark:text-gray-500" />,
            title: 'No Results Found',
            description: 'Try adjusting your search terms or filters to find what you\'re looking for.',
      },
      'no-filtered-results': {
            icon: <FaFilter className="text-6xl text-purple-400 dark:text-purple-500" />,
            title: 'No Matching Applications',
            description: 'No applications match your current filters. Try changing your filter criteria.',
      },
      'default': {
            icon: <FaInbox className="text-6xl text-gray-400 dark:text-gray-500" />,
            title: 'Nothing Here',
            description: 'There\'s nothing to display at the moment.',
      },
};

export const EmptyState = ({
      variant = 'default',
      title,
      description,
      icon,
      action,
}: EmptyStateProps) => {
      const config = VARIANTS[variant];
      const displayTitle = title || config.title;
      const displayDescription = description || config.description;
      const displayIcon = icon || config.icon;

      return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fadeIn">
                  {/* Icon */}
                  <div className="mb-6 opacity-80">
                        {displayIcon}
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        {displayTitle}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
                        {displayDescription}
                  </p>

                  {/* Action Button */}
                  {action && (
                        <button
                              onClick={action.onClick}
                              className="btn-primary px-6 py-3"
                        >
                              {action.label}
                        </button>
                  )}

                  {/* Decorative Elements */}
                  <div className="mt-8 flex gap-2 opacity-30">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                  </div>
            </div>
      );
};
