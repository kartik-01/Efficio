import { useState, useEffect, useMemo } from 'react';
import { Category } from '../types';
import { formatDuration, getCategoryColor } from '../lib/utils';
import { Clock, Zap, TrendingUp } from 'lucide-react';
import { timeApi, initializeTimeApi, isTimeApiReady } from '../services/timeApi';
import { toast } from 'sonner';

// Map backend category IDs to frontend Category type
const mapCategoryIdToCategory = (categoryId: string): Category => {
  const mapping: Record<string, Category> = {
    work: 'Work',
    learning: 'Learning',
    admin: 'Admin',
    health: 'Health',
    personal: 'Personal',
    rest: 'Rest',
  };
  return mapping[categoryId.toLowerCase()] || 'Work';
};

// Helper function to check if date is today
const isToday = (date: Date): boolean => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return todayStr === dateStr;
};

interface SummaryStripProps {
  selectedDate: Date;
  getAccessToken?: () => Promise<string | undefined>;
  refreshTrigger?: number; // Increment this to trigger a refresh
}

export function SummaryStrip({ selectedDate, getAccessToken, refreshTrigger }: SummaryStripProps) {
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [topCategory, setTopCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize API
  useEffect(() => {
    if (getAccessToken) {
      initializeTimeApi(getAccessToken);
    }
  }, [getAccessToken]);

  // Normalize selected date to YYYY-MM-DD format
  const dateStr = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  // Check if selected date is today
  const isTodaySelected = useMemo(() => isToday(selectedDate), [selectedDate]);

  // Check if date is in the future
  const isFutureDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected > today;
  }, [selectedDate]);

  // Fetch summary data
  useEffect(() => {
    const loadSummary = async () => {
      if (!isTimeApiReady()) {
        console.log('[SummaryStrip] API not ready yet');
        return;
      }

      try {
        setLoading(true);
        
        // Future date - return zeros
        if (isFutureDate) {
          setTotalMinutes(0);
          setFocusMinutes(0);
          setTopCategory(null);
          setLoading(false);
          return;
        }
        
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let summary;
        
        if (isTodaySelected) {
          // For today, use real-time calculation
          console.log('[SummaryStrip] Fetching real-time summary for today, tz:', tz);
          try {
            summary = await timeApi.getSummary({ range: 'today', tz });
            console.log('[SummaryStrip] Real-time summary received:', JSON.stringify(summary, null, 2));
          } catch (err) {
            console.error('[SummaryStrip] Error fetching real-time summary:', err);
            throw err;
          }
        } else {
          // For past dates, use stored daily summary (or calculate on-demand)
          console.log('[SummaryStrip] Fetching daily summary for date:', dateStr, 'tz:', tz);
          try {
            summary = await timeApi.getDailySummary(dateStr, tz);
            console.log('[SummaryStrip] Daily summary received:', JSON.stringify(summary, null, 2));
          } catch (err) {
            console.error('[SummaryStrip] Error fetching daily summary:', err);
            throw err;
          }
        }

        console.log('[SummaryStrip] Summary data received (parsed):', summary);
        console.log('[SummaryStrip] Summary type:', typeof summary);
        console.log('[SummaryStrip] Summary keys:', summary ? Object.keys(summary) : 'null');

        // Ensure we have valid data
        if (summary && typeof summary === 'object') {
          setTotalMinutes(summary.totalMinutes || 0);
          setFocusMinutes(summary.focus?.deepMinutes || 0);

          // Find top category from byCategory array
          if (summary.byCategory && Array.isArray(summary.byCategory) && summary.byCategory.length > 0) {
            const top = summary.byCategory.reduce((prev, current) => 
              (current.minutes || 0) > (prev.minutes || 0) ? current : prev
            );
            setTopCategory(mapCategoryIdToCategory(top.categoryId));
          } else {
            setTopCategory(null);
          }
        } else {
          console.warn('[SummaryStrip] Invalid summary data received:', summary);
          setTotalMinutes(0);
          setFocusMinutes(0);
          setTopCategory(null);
        }
      } catch (error) {
        console.error('[SummaryStrip] Failed to load summary:', error);
        toast.error('Failed to load summary');
        // Reset to zeros on error
        setTotalMinutes(0);
        setFocusMinutes(0);
        setTopCategory(null);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [selectedDate, dateStr, isTodaySelected, isFutureDate, getAccessToken, refreshTrigger]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Clock className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-neutral-600 dark:text-neutral-400 text-sm">Total Time</div>
            <div className="text-neutral-900 dark:text-neutral-100 font-semibold">
              {loading ? '...' : formatDuration(totalMinutes)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Zap className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          </div>
          <div>
            <div className="text-neutral-600 dark:text-neutral-400 text-sm">Focus Time</div>
            <div className="text-neutral-900 dark:text-neutral-100 font-semibold">
              {loading ? '...' : formatDuration(focusMinutes)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-500 dark:text-green-400" />
          </div>
          <div>
            <div className="text-neutral-600 dark:text-neutral-400 text-sm">Top Category</div>
            {loading ? (
              <div className="text-neutral-500 dark:text-neutral-400">...</div>
            ) : topCategory ? (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm border ${getCategoryColor(topCategory)}`}>
                {topCategory}
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
