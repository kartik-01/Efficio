import { useState } from 'react';
import { Play, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Task, Category } from '../types';
import { Button, Input } from '@efficio/ui';
import { getCategoryColor } from '../lib/utils';

interface InProgressTasksProps {
  tasks: Task[];
  loading?: boolean;
  getAccessToken?: () => Promise<string | undefined>;
  onStartTimer: (taskId: string, taskTitle: string, category: Category) => void;
  onUpdateTaskTime?: (taskId: string, fromTime: string, toTime: string) => void;
  isTimerActive: boolean;
}

// Map task category string to Category type
const mapTaskCategoryToCategory = (category?: string): Category => {
  if (!category) return 'Work';
  
  const normalized = category.toLowerCase().trim();
  const categoryMap: Record<string, Category> = {
    'work': 'Work',
    'learning': 'Learning',
    'admin': 'Admin',
    'health': 'Health',
    'personal': 'Personal',
    'rest': 'Rest',
  };
  
  return categoryMap[normalized] || 'Work';
};

export function InProgressTasks({ tasks, loading = false, getAccessToken, onStartTimer, onUpdateTaskTime, isTimerActive }: InProgressTasksProps) {
  const [taskTimes, setTaskTimes] = useState<Record<string, { from: string; to: string }>>({});

  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');

  const handleStartTimer = (task: Task) => {
    const category = mapTaskCategoryToCategory(task.category);
    onStartTimer(task.id, task.title, category);
  };

  const handleTimeChange = (taskId: string, field: 'from' | 'to', value: string) => {
    setTaskTimes(prev => {
      const current = prev[taskId] || { from: '', to: '' };
      const updated = { ...current, [field]: value };
      
      // Call the callback if both times are set
      if (onUpdateTaskTime && updated.from && updated.to) {
        onUpdateTaskTime(taskId, updated.from, updated.to);
      }
      
      return {
      ...prev,
        [taskId]: updated
      };
    });
  };

  const getTaskTime = (taskId: string, field: 'from' | 'to', task: Task) => {
    // Use local state if available, otherwise fall back to task data
    if (taskTimes[taskId]) {
      return taskTimes[taskId][field];
    }
    return field === 'from' ? (task.fromTime || '') : (task.toTime || '');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 h-[540px] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center">
          <Loader2 className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3 animate-spin" />
          <h3 className="text-neutral-600 dark:text-neutral-400 mb-1">Loading tasks...</h3>
        </div>
      </div>
    );
  }

  if (inProgressTasks.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 h-[540px] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-3" />
          <h3 className="text-neutral-600 dark:text-neutral-400 mb-1">No Tasks In Progress</h3>
          <p className="text-neutral-500 dark:text-neutral-600 text-sm">
            Start working on tasks in your task manager to see them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 h-[540px] flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-neutral-900 dark:text-neutral-100 font-semibold">In Progress</h3>
        <span className="text-neutral-600 dark:text-neutral-400 text-sm">
          {inProgressTasks.length} {inProgressTasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent dark:scrollbar-track-neutral-900">
        {inProgressTasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-neutral-900 dark:text-neutral-100 truncate text-sm">{task.title}</h4>
              </div>
              <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs ${getCategoryColor(mapTaskCategoryToCategory(task.category))}`}>
                {mapTaskCategoryToCategory(task.category)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="flex flex-col gap-1">
                <span className="text-neutral-600 dark:text-neutral-400 text-xs">From</span>
                <Input
                  type="time"
                  value={getTaskTime(task.id, 'from', task)}
                  onChange={(e) => handleTimeChange(task.id, 'from', e.target.value)}
                  className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 h-8 text-xs w-full"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-neutral-600 dark:text-neutral-400 text-xs">To</span>
                <Input
                  type="time"
                  value={getTaskTime(task.id, 'to', task)}
                  onChange={(e) => handleTimeChange(task.id, 'to', e.target.value)}
                  className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 h-8 text-xs w-full"
                />
              </div>
            </div>

            <div className="flex justify-end">
                <Button
                  onClick={() => handleStartTimer(task)}
                  disabled={isTimerActive}
                  size="sm"
                className="bg-blue-600 dark:bg-indigo-700 hover:bg-blue-700 dark:hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed h-8 text-xs px-3"
                >
                <Play className="w-3 h-3 mr-1" />
                  Track
                </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}