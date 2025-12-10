import { useState } from 'react';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@efficio/ui';
import { Plus } from 'lucide-react';
import { Category } from '../types';
import { sessionsApi, isTimeApiReady } from '../services/timeApi';
import { classifyTitleToCategoryId } from '../lib/classification';
import { useTasksStore } from '../store/slices/tasksSlice';
import { toast } from 'sonner';
import { useTaskClassification } from '../hooks/useTaskClassification';

interface ManualTimeEntryProps {
  onSave: () => void;
  selectedDate: Date;
  getAccessToken?: () => Promise<string | undefined>;
}

const CUSTOM_TASK_VALUE = '__custom__';

export function ManualTimeEntry({ onSave, selectedDate, getAccessToken }: ManualTimeEntryProps) {
  const [selectedTask, setSelectedTask] = useState<string>(CUSTOM_TASK_VALUE);
  const [customTitle, setCustomTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [loading, setLoading] = useState(false);

  // Zustand stores
  const { tasks, loading: tasksLoading } = useTasksStore();
  
  // Filter to only show in-progress tasks
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');

  // Use custom hook for task classification
  const selectedTaskCategory = useTaskClassification(selectedTask, inProgressTasks);

  const handleSave = async () => {
    // Determine title and task
    let taskTitle: string;
    let taskId: string | null = null;
    let task: typeof inProgressTasks[0] | undefined;

    if (selectedTask === CUSTOM_TASK_VALUE) {
      if (!customTitle.trim()) {
        toast.error('Please enter a title');
        return;
      }
      taskTitle = customTitle.trim();
    } else {
      task = inProgressTasks.find(t => t.id === selectedTask);
      if (!task) {
        toast.error('Selected task not found');
        return;
      }
      taskTitle = task.title;
      taskId = task.id;
    }

    if (!startTime || !endTime) {
      toast.error('Please fill in all time fields');
      return;
    }

    if (!isTimeApiReady()) {
      toast.error('API not initialized');
      return;
    }

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const start = new Date(selectedDate);
    start.setHours(startHours, startMinutes, 0, 0);

    const end = new Date(selectedDate);
    end.setHours(endHours, endMinutes, 0, 0);

    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      setLoading(true);
      
      // Determine category
      let categoryId: string;
      if (task) {
        // Use task.category if available, otherwise classify
        categoryId = await classifyTitleToCategoryId(taskTitle, task);
      } else {
        // Adhoc entry - always classify
        categoryId = await classifyTitleToCategoryId(taskTitle);
      }

      // Create session via API
      await sessionsApi.createSession({
        taskId: taskId || null,
        taskTitle,
        categoryId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes: '',
      });

      // Reset form
      setSelectedTask(CUSTOM_TASK_VALUE);
      setCustomTitle('');
      setStartTime('09:00');
      setEndTime('10:00');
      
      toast.success('Time entry saved');
      onSave();
    } catch (error) {
      console.error('Failed to save manual entry:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save time entry');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColorClass = (category: Category): string => {
    const colors: Record<Category, string> = {
      Work: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      Personal: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      Errands: 'bg-orange-400/10 text-orange-600 dark:text-orange-400 border-orange-400/20',
      Design: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
      Engineering: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
      Marketing: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      Finance: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      Rest: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20',
      Health: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      Learning: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      Admin: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      Other: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
    };
    return colors[category];
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-neutral-900 dark:text-neutral-100">Task</Label>
        <Select value={selectedTask} onValueChange={setSelectedTask} disabled={tasksLoading}>
          <SelectTrigger className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
            <SelectValue placeholder={tasksLoading ? "Loading tasks..." : "Select a task"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CUSTOM_TASK_VALUE}>
              Worked on something else
            </SelectItem>
            {inProgressTasks.length > 0 && inProgressTasks.map(task => (
              <SelectItem key={task.id} value={task.id}>
                {task.title}
              </SelectItem>
            ))}
            {inProgressTasks.length === 0 && !tasksLoading && (
              <div className="px-2 py-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                No in-progress tasks available
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Title Input - shown when "Worked on something else" is selected */}
      {selectedTask === CUSTOM_TASK_VALUE && (
        <div className="space-y-2">
          <Label className="text-neutral-900 dark:text-neutral-100">What did you work on?</Label>
          <Input
            type="text"
            placeholder="Enter task title..."
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
          />
        </div>
      )}

      {/* Category Pill - shown when a regular task is selected */}
      {selectedTask && selectedTask !== CUSTOM_TASK_VALUE && selectedTaskCategory && (
        <div className="flex items-center">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs border ${getCategoryColorClass(selectedTaskCategory)}`}>
            {selectedTaskCategory}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-neutral-900 dark:text-neutral-100">Start Time</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-neutral-900 dark:text-neutral-100">End Time</Label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
          />
        </div>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={
          !selectedTask || 
          (selectedTask === CUSTOM_TASK_VALUE && !customTitle.trim()) || 
          !startTime || 
          !endTime || 
          loading
        }
        className="w-full bg-blue-600 dark:bg-indigo-700 hover:bg-blue-700 dark:hover:bg-indigo-800"
      >
        <Plus className="w-4 h-4 mr-2" />
        {loading ? 'Saving...' : 'Save Entry'}
      </Button>
    </div>
  );
}

