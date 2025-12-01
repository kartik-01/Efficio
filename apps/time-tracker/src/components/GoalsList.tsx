import { Goal, TimeSession, Category } from '../types';
import { updateGoal } from '../lib/storage';
import { calculateGoalProgress, getCategoryColor, formatDuration } from '../lib/utils';
import { Switch, Progress } from '@efficio/ui';
import { Target } from 'lucide-react';

interface GoalsListProps {
  goals: Goal[];
  sessions: TimeSession[];
  onUpdate: () => void;
}

export function GoalsList({ goals, sessions, onUpdate }: GoalsListProps) {
  const handleToggle = (goalId: string, isActive: boolean) => {
    updateGoal(goalId, { isActive });
    onUpdate();
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-neutral-400" />
        <h2 className="text-neutral-100">Your Goals</h2>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          No goals set yet. Create your first goal below!
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              sessions={sessions}
              onToggle={(isActive) => handleToggle(goal.id, isActive)}
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
  onToggle: (isActive: boolean) => void;
}

function GoalCard({ goal, sessions, onToggle }: GoalCardProps) {
  const { loggedMinutes, percentage } = calculateGoalProgress(
    sessions,
    goal.category,
    goal.period,
    goal.targetMinutes,
    new Date()
  );

  return (
    <div className={`bg-neutral-950 border rounded-lg p-4 transition-opacity ${
      goal.isActive ? 'border-neutral-800' : 'border-neutral-800/50 opacity-60'
    }`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm border ${getCategoryColor(goal.category)}`}>
              {goal.category}
            </span>
            <span className="text-neutral-500 text-sm capitalize">{goal.period}</span>
          </div>
          <div className="text-neutral-400 text-sm">
            Target: {formatDuration(goal.targetMinutes)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 text-sm">{goal.isActive ? 'Active' : 'Paused'}</span>
          <Switch
            checked={goal.isActive}
            onCheckedChange={onToggle}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Progress value={percentage} className="h-2" />
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-400">
            {formatDuration(loggedMinutes)} logged
          </span>
          <span className={percentage >= 100 ? 'text-green-400' : 'text-neutral-400'}>
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );
}
