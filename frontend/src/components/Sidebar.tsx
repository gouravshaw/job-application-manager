import { useState } from 'react';
import { FaChartBar, FaBriefcase, FaSun, FaMoon, FaBars, FaTimes, FaRocket } from 'react-icons/fa';

interface SidebarProps {
      activeTab: 'dashboard' | 'applications';
      setActiveTab: (tab: 'dashboard' | 'applications') => void;
      isDark: boolean;
      toggleTheme: () => void;
}

export const Sidebar = ({ activeTab, setActiveTab, isDark, toggleTheme }: SidebarProps) => {
      const [isOpen, setIsOpen] = useState(false);

      const toggleSidebar = () => setIsOpen(!isOpen);

      const navItems = [
            { id: 'dashboard', label: 'Dashboard', icon: FaChartBar },
            { id: 'applications', label: 'Applications', icon: FaBriefcase },
      ] as const;

      return (
            <>
                  {/* Mobile Menu Button */}
                  <button
                        onClick={toggleSidebar}
                        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-lg border border-gray-100 dark:border-slate-700 text-gray-700 dark:text-gray-200"
                  >
                        {isOpen ? <FaTimes /> : <FaBars />}
                  </button>

                  {/* Overlay for mobile */}
                  {isOpen && (
                        <div
                              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
                              onClick={() => setIsOpen(false)}
                        />
                  )}

                  {/* Sidebar Container */}
                  <aside
                        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen w-[280px]
          bg-white dark:bg-slate-950/90 backdrop-blur-xl
          border-r border-gray-200 dark:border-slate-800
          shadow-xl shadow-blue-500/5 dark:shadow-none
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
                  >
                        <div className="flex flex-col h-full p-6">
                              {/* Logo Section */}
                              <div className="flex items-center gap-3 px-2 mb-10">
                                    <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                                          <FaRocket className="text-white text-lg" />
                                    </div>
                                    <div>
                                          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-tight">
                                                Job Manager
                                          </h1>

                                    </div>
                              </div>

                              {/* Navigation */}
                              <nav className="flex-1 space-y-2">
                                    {navItems.map((item) => (
                                          <button
                                                key={item.id}
                                                onClick={() => {
                                                      setActiveTab(item.id);
                                                      setIsOpen(false);
                                                }}
                                                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden
                  ${activeTab === item.id
                                                            ? 'text-white shadow-lg shadow-blue-500/25'
                                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white'
                                                      }
                `}
                                          >
                                                {/* Active Background Gradient */}
                                                {activeTab === item.id && (
                                                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600" />
                                                )}

                                                <item.icon
                                                      className={`relative z-10 text-lg transition-transform duration-300 group-hover:scale-110 ${activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'
                                                            }`}
                                                />
                                                <span className="relative z-10 font-medium tracking-wide">{item.label}</span>
                                          </button>
                                    ))}
                              </nav>

                              {/* Bottom Actions */}
                              <div className="mt-auto px-2 space-y-4">
                                    {/* Theme Section */}
                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50">
                                          <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Theme</span>
                                                <button
                                                      onClick={toggleTheme}
                                                      className={`
                    p-2 rounded-lg transition-all duration-300
                    ${isDark ? 'bg-slate-700 text-yellow-400' : 'bg-white text-gray-400 shadow-sm'}
                  `}
                                                >
                                                      {isDark ? <FaSun /> : <FaMoon />}
                                                </button>
                                          </div>
                                    </div>

                                    <div className="text-center">
                                          <p className="text-xs text-gray-400 dark:text-gray-600 font-medium">v2.0.0 • 2026</p>
                                    </div>
                              </div>
                        </div>
                  </aside>
            </>
      );
};
