import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ApplicationList } from './components/ApplicationList';
import { ColdMessages } from './components/ColdMessages';
import { ConnectionRequests } from './components/ConnectionRequests';
import { Sidebar } from './components/Sidebar';
import { useTheme } from './contexts/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import './index.css';


function AppContent() {
  // Initialize state from URL
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'cold-messages' | 'connection-requests'>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return (tab === 'applications' || tab === 'dashboard' || tab === 'cold-messages' || tab === 'connection-requests') ? tab : 'dashboard';
  });


  const [initialFilter, setInitialFilter] = useState<{ type: string; value: string; timestamp?: number } | null>(null);
  const { isDark, toggleTheme } = useTheme();

  // Sync state to URL and handle back button
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') !== activeTab) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('tab', activeTab);
      window.history.pushState({}, '', newUrl);
    }

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'applications' || tab === 'dashboard' || tab === 'cold-messages' || tab === 'connection-requests') {
        setActiveTab(tab);
      } else {
        setActiveTab('dashboard');
      }
    };


    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  const handleDashboardClick = (filterType: string, filterValue: string) => {
    setInitialFilter({ type: filterType, value: filterValue, timestamp: Date.now() });
    setActiveTab('applications');
  };

  return (
    <div className={`min-h-screen flex ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full p-4 lg:p-8 overflow-y-auto h-screen">
        <div className="space-y-6">
          {activeTab === 'dashboard' ? (
            <div className="animate-slideUp">
              <Dashboard onCardClick={handleDashboardClick} />
            </div>
          ) : activeTab === 'applications' ? (
            <div className="animate-slideUp">
              <ApplicationList initialFilter={initialFilter} />
            </div>
          ) : activeTab === 'connection-requests' ? (
            <div className="animate-slideUp">
              <ConnectionRequests onNavigate={setActiveTab} />
            </div>
          ) : (
            <div className="animate-slideUp">
              <ColdMessages />
            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="mt-12 py-6 text-center border-t border-gray-100 dark:border-slate-800">
          <p className="text-sm text-gray-400 dark:text-gray-600">
            Job Manager Pro © 2026
          </p>
        </footer>
      </main>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;

