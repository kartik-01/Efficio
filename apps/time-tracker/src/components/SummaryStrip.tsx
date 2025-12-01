import { useState, useEffect, useMemo } from 'react';
import { DailySummary, Category, TimeSession } from '../types';
import { formatDuration, getCategoryColor, aggregateSessionsForDate } from '../lib/utils';
import { Clock, Zap, TrendingUp } from 'lucide-react';
import { timeApi, initializeTimeApi, isTimeApiReady } from '../services/timeApi';
import { toast } from 'sonner';

interface SummaryStripProps {
  selectedDate: Date;
  getAccessToken?: () => Promise<string | undefined>;
  refreshTrigger?: number;
  sessions?: TimeSession[]; // Optional: sessions to aggregate locally for real-time updates
}

export function SummaryStrip({ selectedDate, getAccessToken, refreshTrigger, sessions }: SummaryStripProps) {
  const [summary, setSummary] = useState<DailySummary>({ totalMinutes: 0, focusMinutes: 0, topCategory: null });
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Calculate aggregated summary from sessions if provided (for real-time updates)
  // Include a dependency on current time for running sessions
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  useEffect(() => {
    // Update current time every second when there are running sessions
    const hasRunningSession = sessions?.some(s => !s.endTime);
    if (hasRunningSession) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessions]);
  
  const aggregatedSummary = useMemo(() => {
    if (sessions && sessions.length > 0) {
      return aggregateSessionsForDate(sessions, selectedDate);
    }
    return null;
  }, [sessions, selectedDate, currentTime]); // Include currentTime to recalculate for running sessions

  // Initialize API
  useEffect(() => {
    if (getAccessToken && !isInitialized) {
      initializeTimeApi(getAccessToken);
      setIsInitialized(true);
    }
  }, [getAccessToken, isInitialized]);

  const dateStr = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  const isToday = useMemo(() => {
    return selectedDate.toDateString() === new Date().toDateString();
  }, [selectedDate]);

  // Use aggregated summary from sessions if available (real-time), otherwise fetch from backend
  useEffect(() => {
    // If we have sessions and it's today, use aggregated data for real-time updates
    if (aggregatedSummary && isToday) {
      setSummary(aggregatedSummary);
      setLoading(false);
      return;
    }

    // Otherwise, fetch from backend
    const loadSummary = async () => {
      if (!isTimeApiReady()) return;

      try {
        setLoading(true);
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

        let fetchedSummary;
        if (isToday) {
          fetchedSummary = await timeApi.getSummary({ range: 'today', tz });
        } else {
          fetchedSummary = await timeApi.getDailySummary(dateStr, tz);
        }

        const summaryData = fetchedSummary?.data || { totalMinutes: 0, byCategory: [], focus: { deepMinutes: 0, otherMinutes: 0 } };
        const topCategory = summaryData.byCategory && summaryData.byCategory.length > 0
          ? (summaryData.byCategory[0].categoryId.charAt(0).toUpperCase() + summaryData.byCategory[0].categoryId.slice(1)) as Category
          : null;

        setSummary({
          totalMinutes: summaryData.totalMinutes || 0,
          focusMinutes: summaryData.focus?.deepMinutes || 0,
          topCategory,
        });
      } catch (error) {
        console.error('Failed to load summary:', error);
        // If backend fails but we have aggregated data, use that as fallback
        if (aggregatedSummary) {
          setSummary(aggregatedSummary);
        } else {
          toast.error('Failed to load summary');
          setSummary({ totalMinutes: 0, focusMinutes: 0, topCategory: null });
        }
      } finally {
        setLoading(false);
      }
    };

    if (isTimeApiReady()) {
      loadSummary();
    }
  }, [selectedDate, dateStr, isToday, refreshTrigger, isInitialized, aggregatedSummary]);
  
  // Update summary when aggregated data changes (for real-time updates)
  useEffect(() => {
    if (aggregatedSummary && isToday) {
      setSummary(aggregatedSummary);
    }
  }, [aggregatedSummary, isToday]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-neutral-600 dark:text-neutral-400 text-sm">Total Time {isToday ? 'Today' : ''}</div>
            <div className="text-neutral-900 dark:text-neutral-100 font-semibold">{loading ? '...' : formatDuration(summary.totalMinutes)}</div>
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
            <div className="text-neutral-900 dark:text-neutral-100 font-semibold">{loading ? '...' : formatDuration(summary.focusMinutes)}</div>
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
            {summary.topCategory ? (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm border ${getCategoryColor(summary.topCategory)}`}>
                {summary.topCategory}
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
