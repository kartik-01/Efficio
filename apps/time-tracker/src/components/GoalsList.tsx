import { useState, useEffect } from 'react';
import { Category } from '../types';
import { getCategoryColor, formatDuration } from '../lib/utils';
import { Switch } from '@efficio/ui';
import { Progress } from '@efficio/ui';
import { Target } from 'lucide-react';
import { toast } from 'sonner';
import { goalsApi, initializeTimeApi, isTimeApiReady, Goal } from '../services/timeApi';

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

interface GoalsListProps {
  onUpdate: () => void;
  getAccessToken?: () => Promise<string | undefined>;
  refreshTrigger?: number; // Increment this to trigger a refresh
}

export function GoalsList({ onUpdate, getAccessToken, refreshTrigger }: GoalsListProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize API
  useEffect(() => {
    if (getAccessToken) {
      initializeTimeApi(getAccessToken);
    }
  }, [getAccessToken]);

  // Fetch goals with progress
  useEffect(() => {
    const loadGoals = async () => {
      if (!isTimeApiReady()) return;

      try {
        setLoading(true);
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const fetchedGoals = await goalsApi.listGoals(true, tz);
        setGoals(fetchedGoals);
      } catch (error) {
        console.error('Failed to load goals:', error);
        toast.error('Failed to load goals');
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, [getAccessToken, refreshTrigger]);

  const handleToggle = async (goalId: string, isActive: boolean) => {
    if (!isTimeApiReady()) {
      toast.error('API not initialized');
      return;
    }

    try {
      await goalsApi.updateGoal(goalId, { active: isActive });
      
      // Update local state
      setGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? { ...goal, active: isActive } : goal
        )
      );
      
      toast.success(isActive ? 'Goal activated' : 'Goal paused');
      onUpdate();
    } catch (error) {
      console.error('Failed to update goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update goal');
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
        <h2 className="text-neutral-900 dark:text-neutral-100 font-semibold">Your Goals</h2>
      </div>

      {loading ? (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          Loading goals...
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          No goals set yet. Create your first goal below!
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
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
  onToggle: (isActive: boolean) => void;
}

function GoalCard({ goal, onToggle }: GoalCardProps) {
  // Use progress from backend if available
  const loggedMinutes = goal.progress?.minutes || 0;
  const percentage = goal.targetMinutes > 0 
    ? Math.min(100, Math.round((loggedMinutes / goal.targetMinutes) * 100))
    : 0;
  const isMet = goal.progress?.met || false;
  const category = mapCategoryIdToCategory(goal.categoryId);
  const isActive = goal.active;

  return (
    <div className={`bg-neutral-50 dark:bg-neutral-950 border rounded-lg p-4 transition-opacity ${
      isActive ? 'border-neutral-200 dark:border-neutral-800' : 'border-neutral-200/50 dark:border-neutral-800/50 opacity-60'
    }`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm border ${getCategoryColor(category)}`}>
              {category}
            </span>
            <span className="text-neutral-600 dark:text-neutral-400 text-sm capitalize">{goal.period}</span>
          </div>
          <div className="text-neutral-600 dark:text-neutral-400 text-sm">
            Target: {formatDuration(goal.targetMinutes)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-neutral-600 dark:text-neutral-400 text-sm">{isActive ? 'Active' : 'Paused'}</span>
          <Switch
            checked={isActive}
            onCheckedChange={onToggle}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Progress value={percentage} className="h-2" />
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600 dark:text-neutral-400">
            {formatDuration(loggedMinutes)} logged
          </span>
          <span className={isMet ? 'text-green-600 dark:text-green-400' : 'text-neutral-600 dark:text-neutral-400'}>
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );
}
