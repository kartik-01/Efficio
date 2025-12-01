import { useState } from 'react';
import { TodayView } from './components/TodayView';
import { GoalsInsightsView } from './components/GoalsInsightsView';
import { Clock, Target } from 'lucide-react';

export function TimeTrackerApp() {
  const [activeView, setActiveView] = useState<'today' | 'goals'>('today');

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="max-w-[1280px] mx-auto w-full">
        {/* Header */}
        <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10 w-full">
          <div className="w-full px-2 py-2">
            <div className="flex items-center justify-between">
              <h1 className="text-neutral-900 dark:text-neutral-100 font-semibold">Efficio Time Tracker</h1>
              
              {/* Sub-navigation */}
              <nav className="flex gap-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('today')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    activeView === 'today'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Today
                </button>
                <button
                  onClick={() => setActiveView('goals')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    activeView === 'goals'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  Goals & Insights
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full px-4 py-6 text-neutral-900 dark:text-neutral-100">
          {activeView === 'today' ? <TodayView /> : <GoalsInsightsView />}
        </main>
      </div>
    </div>
  );
}

export default TimeTrackerApp;
