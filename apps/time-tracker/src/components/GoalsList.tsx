import { Goal, TimeSession, Category } from '../types';
import { calculateGoalProgress, getCategoryColor, formatDuration } from '../lib/utils';
import { Progress } from '@efficio/ui';
import { Target } from 'lucide-react';

interface GoalsListProps {
  goals: Goal[];
  sessions: TimeSession[];
  onUpdate: () => void;
}

export function GoalsList({ goals, sessions, onUpdate }: GoalsListProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        <h2 className="text-neutral-900 dark:text-neutral-100 font-semibold">Your Goals</h2>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          No goals set yet. Create your first goal below!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              sessions={sessions}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
  sessions: TimeSession[];
}

function GoalCard({ goal, sessions }: GoalCardProps) {
  const { loggedMinutes, percentage } = calculateGoalProgress(
    sessions,
    goal.category,
    goal.period,
    goal.targetMinutes,
    new Date()
  );

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm border ${getCategoryColor(goal.category)}`}>
            {goal.category}
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-neutral-600 dark:text-neutral-400 text-sm capitalize">{goal.period} Goal</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="text-neutral-600 dark:text-neutral-400 text-sm">Progress</div>
          <div className="text-neutral-900 dark:text-neutral-100 text-lg font-semibold">
            {percentage}%
          </div>
        </div>
        
        <Progress value={percentage} className="h-2.5" />
        
        <div className="flex items-center justify-between pt-1">
          <div className="text-neutral-600 dark:text-neutral-400 text-sm">
            {formatDuration(loggedMinutes)}
          </div>
          <div className="text-neutral-600 dark:text-neutral-400 text-sm">
            / {formatDuration(goal.targetMinutes)}
          </div>
        </div>
      </div>
    </div>
  );
}