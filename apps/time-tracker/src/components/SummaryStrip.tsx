import { useMemo } from 'react';
import { formatDuration, getCategoryColor, aggregateSessionsForDate } from '../lib/utils';
import { Clock, Zap, TrendingUp } from 'lucide-react';
import { useSummaryStore } from '../store/slices/summarySlice';
import { useSessionsStore } from '../store/slices/sessionsSlice';
import { useUIStore } from '../store/slices/uiSlice';

interface SummaryStripProps {
  selectedDate: Date;
}

export function SummaryStrip({ selectedDate }: SummaryStripProps) {
  const { summary, loading } = useSummaryStore();
  const { sessions } = useSessionsStore();
  const { timerTick } = useUIStore();
  
  // Calculate aggregated summary from sessions for real-time updates
  const aggregatedSummary = useMemo(() => {
    if (sessions && sessions.length > 0) {
      return aggregateSessionsForDate(sessions, selectedDate);
    }
    return null;
  }, [sessions, selectedDate, timerTick]); // Include timerTick to recalculate for running sessions

  // Use aggregated summary if available (for real-time updates), otherwise use store summary
  const displaySummary = aggregatedSummary || summary;
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-neutral-600 dark:text-neutral-400 text-sm">Total Time {isToday ? 'Today' : ''}</div>
            <div className="text-neutral-900 dark:text-neutral-100 font-semibold">{loading ? '...' : formatDuration(displaySummary.totalMinutes)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="text-neutral-600 dark:text-neutral-400 text-sm">Focus Time</div>
            <div className="text-neutral-900 dark:text-neutral-100 font-semibold">{loading ? '...' : formatDuration(displaySummary.focusMinutes)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="text-neutral-600 dark:text-neutral-400 text-sm">Top Category</div>
            {displaySummary.topCategory ? (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm border ${getCategoryColor(displaySummary.topCategory)}`}>
                {displaySummary.topCategory}
              </span>
            ) : (
              <div className="text-neutral-500 dark:text-neutral-400">None yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

