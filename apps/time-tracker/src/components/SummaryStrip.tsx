import { DailySummary } from '../types';
import { formatDuration, getCategoryColor } from '../lib/utils';
import { Clock, Zap, TrendingUp } from 'lucide-react';

interface SummaryStripProps {
  summary: DailySummary;
}

export function SummaryStrip({ summary }: SummaryStripProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-neutral-600 dark:text-neutral-400 text-sm">Total Time Today</div>
            <div className="text-neutral-900 dark:text-neutral-100 font-semibold">{formatDuration(summary.totalMinutes)}</div>
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
            <div className="text-neutral-900 dark:text-neutral-100 font-semibold">{formatDuration(summary.focusMinutes)}</div>
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
