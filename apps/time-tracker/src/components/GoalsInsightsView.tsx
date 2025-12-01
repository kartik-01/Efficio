import { useState, useEffect } from 'react';
import { Goal, TimeSession, DailySummary } from '../types';
import { getGoals, getSessions } from '../lib/storage';
import { calculateDailySummary } from '../lib/utils';
import { GoalsList } from './GoalsList';
import { CreateGoalForm } from './CreateGoalForm';
import { Clock, Zap, TrendingUp } from 'lucide-react';
import { formatDuration, getCategoryColor } from '../lib/utils';

export function GoalsInsightsView() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [summary, setSummary] = useState<DailySummary>({ totalMinutes: 0, focusMinutes: 0, topCategory: null });

  const refreshData = () => {
    const allGoals = getGoals();
    setGoals(allGoals);
    
    const allSessions = getSessions();
    setSessions(allSessions);
    
    const todaySummary = calculateDailySummary(allSessions, new Date());
    setSummary(todaySummary);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Daily Summary */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-neutral-100 mb-4">Today's Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-neutral-950 rounded-lg">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-neutral-400 text-sm">Total Minutes</div>
              <div className="text-neutral-100">{formatDuration(summary.totalMinutes)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-neutral-950 rounded-lg">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-neutral-400 text-sm">Focus Minutes</div>
              <div className="text-neutral-100">{formatDuration(summary.focusMinutes)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-neutral-950 rounded-lg">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-neutral-400 text-sm">Top Category</div>
              {summary.topCategory ? (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm border ${getCategoryColor(summary.topCategory)}`}>
                  {summary.topCategory}
                </span>
              ) : (
                <div className="text-neutral-500">None yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Goals List */}
      <GoalsList goals={goals} sessions={sessions} onUpdate={refreshData} />

      {/* Create Goal Form */}
      <CreateGoalForm onGoalCreated={refreshData} />
    </div>
  );
}
