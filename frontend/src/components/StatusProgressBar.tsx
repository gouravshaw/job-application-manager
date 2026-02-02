import { FaBookmark, FaPaperPlane, FaSearch, FaVideo, FaTrophy, FaCheckCircle } from 'react-icons/fa';

interface StatusProgressBarProps {
      currentStatus: string;
      compact?: boolean;
}

const STATUS_PIPELINE = [
      { key: 'Saved', label: 'Saved', icon: FaBookmark },
      { key: 'To Apply', label: 'To Apply', icon: FaBookmark },
      { key: 'Applied', label: 'Applied', icon: FaPaperPlane },
      { key: 'Screening', label: 'Screening', icon: FaSearch },
      { key: 'Aptitude Test', label: 'Test', icon: FaSearch },
      { key: 'Technical Test', label: 'Tech Test', icon: FaSearch },
      { key: 'Interview', label: 'Interview', icon: FaVideo },
      { key: 'Second Interview', label: '2nd Interview', icon: FaVideo },
      { key: 'Final Interview', label: 'Final', icon: FaVideo },
      { key: 'Interview Result Awaited', label: 'Awaiting', icon: FaVideo },
      { key: 'Offer', label: 'Offer', icon: FaTrophy },
      { key: 'Accepted', label: 'Accepted', icon: FaCheckCircle },
];

export const StatusProgressBar = ({ currentStatus, compact = false }: StatusProgressBarProps) => {
      // Find current status index
      const currentIndex = STATUS_PIPELINE.findIndex(s => s.key === currentStatus);

      // Determine which stages to show based on current status
      const getVisibleStages = () => {
            if (currentIndex === -1) return STATUS_PIPELINE.slice(0, 5);

            // Show stages around current position
            const start = Math.max(0, currentIndex - 1);
            const end = Math.min(STATUS_PIPELINE.length, currentIndex + 4);
            return STATUS_PIPELINE.slice(start, end);
      };

      const visibleStages = compact ? getVisibleStages() : STATUS_PIPELINE;

      const getStageState = (stageKey: string) => {
            const stageIndex = STATUS_PIPELINE.findIndex(s => s.key === stageKey);
            if (stageIndex === -1) return 'future';
            if (stageIndex < currentIndex) return 'completed';
            if (stageIndex === currentIndex) return 'current';
            return 'future';
      };

      return (
            <div className="w-full">
                  <div className="flex items-center justify-between gap-1 md:gap-2">
                        {visibleStages.map((stage, index) => {
                              const state = getStageState(stage.key);
                              const Icon = stage.icon;
                              const isLast = index === visibleStages.length - 1;

                              return (
                                    <div key={stage.key} className="flex items-center flex-1">
                                          {/* Stage Circle */}
                                          <div className="flex flex-col items-center gap-1 relative z-10">
                                                <div
                                                      className={`
                    ${compact ? 'w-8 h-8' : 'w-10 h-10 md:w-12 md:h-12'}
                    rounded-full flex items-center justify-center transition-all duration-300
                    ${state === 'completed'
                                                                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30'
                                                                  : state === 'current'
                                                                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 ring-4 ring-blue-200 dark:ring-blue-800'
                                                                        : 'bg-gray-200 dark:bg-slate-700'
                                                            }
                  `}
                                                >
                                                      <Icon
                                                            className={`
                      ${compact ? 'text-xs' : 'text-sm md:text-base'}
                      ${state === 'future' ? 'text-gray-400 dark:text-gray-500' : 'text-white'}
                    `}
                                                      />
                                                </div>
                                                {!compact && (
                                                      <span
                                                            className={`
                      text-[10px] md:text-xs font-medium text-center max-w-[60px] leading-tight
                      ${state === 'current'
                                                                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                                                                        : state === 'completed'
                                                                              ? 'text-emerald-600 dark:text-emerald-400'
                                                                              : 'text-gray-400 dark:text-gray-500'
                                                                  }
                    `}
                                                      >
                                                            {stage.label}
                                                      </span>
                                                )}
                                          </div>

                                          {/* Connecting Line */}
                                          {!isLast && (
                                                <div className="flex-1 h-1 mx-1 relative -mt-6">
                                                      <div className="absolute inset-0 bg-gray-200 dark:bg-slate-700 rounded-full" />
                                                      <div
                                                            className={`
                      absolute inset-0 rounded-full transition-all duration-500
                      ${state === 'completed'
                                                                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 w-full'
                                                                        : state === 'current'
                                                                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 w-1/2'
                                                                              : 'w-0'
                                                                  }
                    `}
                                                      />
                                                </div>
                                          )}
                                    </div>
                              );
                        })}
                  </div>
            </div>
      );
};
