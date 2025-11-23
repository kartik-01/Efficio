import { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import { TimeSession, Category } from '../types';
import { formatTime, formatDuration } from '../lib/utils';
import { Button } from '@efficio/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@efficio/ui';
import { Label } from '@efficio/ui';
import { Input } from '@efficio/ui';
import { toast } from 'sonner';
import { timeApi, initializeTimeApi, isTimeApiReady } from '../services/timeApi';
import { taskApi, initializeTaskApi, isTaskApiReady, Task } from '../services/taskApi';

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

interface TimerControlProps {
  onUpdate: () => void;
  getAccessToken?: () => Promise<string | undefined>;
  selectedDate: Date;
}

export function TimerControl({ onUpdate, getAccessToken, selectedDate }: TimerControlProps) {
  const [activeSession, setActive] = useState<TimeSession | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('__none__');
  const [customTaskTitle, setCustomTaskTitle] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Check if selected date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isTodaySelected = isToday(selectedDate);

  // Initialize APIs
  useEffect(() => {
    if (getAccessToken) {
      initializeTimeApi(getAccessToken);
      initializeTaskApi(getAccessToken);
    }
  }, [getAccessToken]);

  // Fetch tasks and running session on mount
  useEffect(() => {
    const loadData = async () => {
      if (!isTaskApiReady() || !isTimeApiReady()) return;

      try {
        setLoadingTasks(true);
        const [fetchedTasks, runningSession] = await Promise.all([
          taskApi.getTasks(),
          timeApi.getRunningSession().catch(() => null),
        ]);
        setTasks(fetchedTasks);
        if (runningSession) {
          // Convert backend session to frontend format
          const session: TimeSession = {
            id: runningSession.id,
            taskId: runningSession.taskId || undefined,
            taskTitle: runningSession.taskTitle || 'Untitled Task',
            category: mapCategoryIdToCategory(runningSession.categoryId),
            startTime: new Date(runningSession.startTime),
            endTime: runningSession.endTime ? new Date(runningSession.endTime) : undefined,
          };
          setActive(session);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load tasks');
      } finally {
        setLoadingTasks(false);
      }
    };

    loadData();
  }, []);

  // Update elapsed time for running session
  useEffect(() => {
    if (activeSession && !activeSession.endTime) {
      const interval = setInterval(async () => {
        // Refresh running session from backend to get accurate time
        try {
          const runningSession = await timeApi.getRunningSession();
          if (runningSession) {
            const now = new Date();
            const start = new Date(runningSession.startTime);
            const elapsed = (now.getTime() - start.getTime()) / 1000 / 60;
            setElapsedMinutes(elapsed);
          }
        } catch (error) {
          console.error('Failed to refresh session:', error);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else if (activeSession && activeSession.endTime) {
      // Calculate final duration for stopped session
      const start = new Date(activeSession.startTime);
      const end = new Date(activeSession.endTime);
      const elapsed = (end.getTime() - start.getTime()) / 1000 / 60;
      setElapsedMinutes(elapsed);
    }
  }, [activeSession]);

  const handleStart = async () => {
    if (!isTimeApiReady()) {
      toast.error('API not initialized');
      return;
    }

    // Determine task title
    let taskTitle = '';
    let taskId: string | null = null;

    if (selectedTaskId === '__none__') {
      // Custom task title
      taskTitle = customTaskTitle.trim();
      if (!taskTitle) {
        toast.error('Please enter a task title');
        return;
      }
    } else {
      // Selected task
      const task = tasks.find(t => t.id === selectedTaskId);
      if (!task) {
        toast.error('Selected task not found');
        return;
      }
      taskTitle = task.title;
      taskId = task.id;
    }

    try {
      setLoading(true);
      
      // Classify the task title to get category
      const classification = await timeApi.classifyTitle(taskTitle);
      const categoryId = classification.categoryId;

      // Start session
      const session = await timeApi.startSession({
        taskId: taskId || null,
        taskTitle: taskTitle || null,
        categoryId,
      });

      // Convert to frontend format
      const frontendSession: TimeSession = {
        id: session.id,
        taskId: session.taskId || undefined,
        taskTitle: session.taskTitle || 'Untitled Task',
        category: mapCategoryIdToCategory(session.categoryId),
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined,
      };

      setActive(frontendSession);
      setSelectedTaskId('__none__');
      setCustomTaskTitle('');
      toast.success('Timer started');
      onUpdate();
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start timer');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!activeSession || !isTimeApiReady()) {
      return;
    }

    try {
      setLoading(true);
      const stoppedSession = await timeApi.stopSession(activeSession.id);

      // Clear the active session to show the form again
      setActive(null);
      setSelectedTaskId('__none__');
      setCustomTaskTitle('');
      setElapsedMinutes(0);
      toast.success('Timer stopped');
      onUpdate();
    } catch (error) {
      console.error('Failed to stop session:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to stop timer');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskChange = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (taskId === '__none__') {
      setCustomTaskTitle('');
    } else {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setCustomTaskTitle('');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
      {!isTodaySelected && (
        <div className="mb-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Timer is only available for today. Please select today's date to start tracking time.
          </p>
        </div>
      )}
      
      {activeSession ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="text-neutral-600 dark:text-neutral-400 text-sm">Currently tracking</div>
              <div className="text-neutral-900 dark:text-neutral-100 font-medium">{activeSession.taskTitle}</div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs border ${getCategoryColorClass(activeSession.category)}`}>
                  {activeSession.category}
                </span>
                <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                  Started at {formatTime(activeSession.startTime)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-neutral-900 dark:text-neutral-100 text-2xl tabular-nums font-semibold">
                {formatDuration(elapsedMinutes)}
              </div>
            </div>
          </div>
          <Button onClick={handleStop} disabled={loading || !isTodaySelected} variant="destructive" className="w-full">
            <Square className="w-4 h-4 mr-2" />
            Stop Timer
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Task</Label>
            <Select value={selectedTaskId} onValueChange={handleTaskChange} disabled={loadingTasks || !isTodaySelected}>
              <SelectTrigger className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
                <SelectValue placeholder={loadingTasks ? "Loading tasks..." : "Select a task or enter custom title"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Work on something else</SelectItem>
                {tasks.map(task => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTaskId === '__none__' && (
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input
                type="text"
                placeholder="What are you working on?"
                value={customTaskTitle}
                onChange={(e) => setCustomTaskTitle(e.target.value)}
                className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                disabled={loading || !isTodaySelected}
              />
            </div>
          )}

          <Button 
            onClick={handleStart} 
            disabled={!isTodaySelected || loading || loadingTasks || (selectedTaskId === '__none__' && !customTaskTitle.trim())}
            className="w-full bg-blue-600 dark:bg-indigo-700 hover:bg-blue-700 dark:hover:bg-indigo-800"
          >
            <Play className="w-4 h-4 mr-2" />
            {loading ? 'Starting...' : 'Start Timer'}
          </Button>
        </div>
      )}
    </div>
  );
}

function getCategoryColorClass(category: Category): string {
  const colors: Record<Category, string> = {
    Work: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    Learning: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    Admin: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    Health: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    Personal: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    Rest: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20',
  };
  return colors[category];
}
