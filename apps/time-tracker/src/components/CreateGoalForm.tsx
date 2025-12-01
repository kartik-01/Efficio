import { useState } from 'react';
import { Category, Goal } from '../types';
import { addGoal } from '../lib/storage';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@efficio/ui';
import { Plus } from 'lucide-react';

const CATEGORIES: Category[] = ['Work', 'Learning', 'Admin', 'Health', 'Personal', 'Rest'];

interface CreateGoalFormProps {
  onGoalCreated: () => void;
}

export function CreateGoalForm({ onGoalCreated }: CreateGoalFormProps) {
  const [category, setCategory] = useState<Category>('Work');
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
  const [targetMinutes, setTargetMinutes] = useState<string>('60');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const minutes = parseInt(targetMinutes);
    if (isNaN(minutes) || minutes <= 0) {
      alert('Please enter a valid target in minutes');
      return;
    }

    const newGoal: Goal = {
      id: Date.now().toString(),
      category,
      period,
      targetMinutes: minutes,
      isActive: true,
    };

    addGoal(newGoal);
    
    // Reset form
    setCategory('Work');
    setPeriod('daily');
    setTargetMinutes('60');
    
    onGoalCreated();
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
      <h2 className="text-neutral-100 mb-4">Create New Goal</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="bg-neutral-950 border-neutral-800">
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
              <SelectTrigger className="bg-neutral-950 border-neutral-800">
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
              className="bg-neutral-950 border-neutral-800"
            />
          </div>
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </Button>
      </form>
    </div>
  );
}
