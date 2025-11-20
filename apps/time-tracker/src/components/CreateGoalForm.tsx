import { useState, useEffect } from 'react';
import { Category } from '../types';
import { Button } from '@efficio/ui';
import { Input } from '@efficio/ui';
import { Label } from '@efficio/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@efficio/ui';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { goalsApi } from '../services/timeApi';
import { initializeTimeApi, isTimeApiReady } from '../services/timeApi';

const CATEGORIES: Category[] = ['Work', 'Learning', 'Admin', 'Health', 'Personal', 'Rest'];

// Map frontend Category to backend categoryId
const mapCategoryToCategoryId = (category: Category): string => {
  const mapping: Record<Category, string> = {
    Work: 'work',
    Learning: 'learning',
    Admin: 'admin',
    Health: 'health',
    Personal: 'personal',
    Rest: 'rest',
  };
  return mapping[category] || 'work';
};

interface CreateGoalFormProps {
  onGoalCreated: () => void;
  getAccessToken?: () => Promise<string | undefined>;
}

export function CreateGoalForm({ onGoalCreated, getAccessToken }: CreateGoalFormProps) {
  const [category, setCategory] = useState<Category>('Work');
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
  const [targetMinutes, setTargetMinutes] = useState<string>('60');
  const [loading, setLoading] = useState(false);

  // Initialize API
  useEffect(() => {
    if (getAccessToken) {
      initializeTimeApi(getAccessToken);
    }
  }, [getAccessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isTimeApiReady()) {
      toast.error('API not initialized');
      return;
    }
    
    const minutes = parseInt(targetMinutes);
    if (isNaN(minutes) || minutes <= 0) {
      toast.error('Please enter a valid target in minutes');
      return;
    }

    try {
      setLoading(true);

      const categoryId = mapCategoryToCategoryId(category);

      await goalsApi.createGoal({
        categoryId,
        period,
        targetMinutes: minutes,
        active: true,
      });
      
      // Reset form
      setCategory('Work');
      setPeriod('daily');
      setTargetMinutes('60');
      
      toast.success('Goal created successfully');
      onGoalCreated();
    } catch (error) {
      console.error('Failed to create goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
      <h2 className="text-neutral-900 dark:text-neutral-100 mb-4 font-semibold">Create New Goal</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Period</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as 'daily' | 'weekly')}>
              <SelectTrigger className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Minutes</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={targetMinutes}
              onChange={(e) => setTargetMinutes(e.target.value)}
              placeholder="60"
              className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-blue-600 dark:bg-indigo-700 hover:bg-blue-700 dark:hover:bg-indigo-800">
          <Plus className="w-4 h-4 mr-2" />
          {loading ? 'Creating...' : 'Add Goal'}
        </Button>
      </form>
    </div>
  );
}
