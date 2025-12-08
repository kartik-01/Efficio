import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Loader2, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Task, Category } from '../types';
import { Input } from '@efficio/ui';
import { getCategoryColor, formatDuration } from '../lib/utils';
import { classifyTitle, classifyTitleToCategoryId } from '../lib/classification';
import { useSessionsStore } from '../store/slices/sessionsSlice';
import { useUIStore } from '../store/slices/uiSlice';
import { usePlansStore } from '../store/slices/plansSlice';
import { Plan } from '../services/timeApi';
import { toast } from 'sonner';

interface InProgressTasksProps {
  tasks: Task[];
  loading?: boolean;
  getAccessToken?: () => Promise<string | undefined>;
  onStartTimer: (taskId: string, taskTitle: string, category: Category) => void;
  onUpdateTaskTime?: (taskId: string, fromTime: string, toTime: string) => void;
  isTimerActive: boolean;
}

// Helper to get classified category for a task
const getTaskCategory = (taskId: string, taskCategories: Record<string, Category>): Category => {
  return taskCategories[taskId] || 'Work'; // Default to Work if not yet classified
};

export function InProgressTasks({ tasks, loading = false, getAccessToken, onStartTimer, onUpdateTaskTime, isTimerActive }: InProgressTasksProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [taskCategories, setTaskCategories] = useState<Record<string, Category>>({});

  // Zustand stores
  const { sessions, activeSession } = useSessionsStore();
  const { selectedDate, timerTick } = useUIStore();
  const { plans, createPlan, updatePlan, fetchPlans } = usePlansStore();

  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');

  // Classify all in-progress tasks on mount and when tasks change
  useEffect(() => {
    const classifyTasks = async () => {
      const categoryMap: Record<string, Category> = {};
      
      for (const task of inProgressTasks) {
        try {
          // Pass task to classification - it will use task.category if available
          const category = await classifyTitle(task.title, task);
          categoryMap[task.id] = category;
        } catch (error) {
          console.error(`Failed to classify task ${task.id}:`, error);
          categoryMap[task.id] = 'Work'; // Default fallback
        }
      }
      
      setTaskCategories(categoryMap);
    };

    if (inProgressTasks.length > 0) {
      classifyTasks();
    } else {
      setTaskCategories({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inProgressTasks.map(t => `${t.id}:${t.title}`).join(',')]); // Re-classify when task IDs or titles change

  // Update elapsed time every second for active session
  useEffect(() => {
    if (!activeSession) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.round((now.getTime() - activeSession.startTime.getTime()) / 60000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, timerTick]);

  // Calculate time spent today for each task
  const getTaskTimeSpentToday = (taskId: string): number => {
    const today = new Date(selectedDate);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const taskSessions = sessions.filter(s => {
      if (s.taskId !== taskId) return false;
      
      // Check if session overlaps with today
      const sessionStart = s.startTime;
      const sessionEnd = s.endTime || new Date(); // Use current time if running
      
      return sessionStart < tomorrow && sessionEnd >= today;
    });

    let totalMinutes = 0;
    for (const session of taskSessions) {
      const sessionStart = new Date(Math.max(session.startTime.getTime(), today.getTime()));
      const sessionEnd = new Date(Math.min((session.endTime || new Date()).getTime(), tomorrow.getTime()));
      const minutes = Math.round((sessionEnd.getTime() - sessionStart.getTime()) / 60000);
      totalMinutes += Math.max(0, minutes);
    }

    return totalMinutes;
  };

  // Check if task is currently active
  const isTaskActive = (taskId: string): boolean => {
    return activeSession?.taskId === taskId;
  };

  // Get active elapsed time for a task
  const getActiveElapsedTime = (taskId: string): number | null => {
    if (!isTaskActive(taskId)) return null;
    return elapsedTime;
  };

  // Helper to normalize date to YYYY-MM-DD string
  const normalizeDateToString = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  };

  // Find override plan for a task and date (excluding canceled plans)
  const findOverrideForTaskAndDate = (taskId: string, targetDate: Date, plansList: Plan[]): Plan | undefined => {
    const targetDateStr = normalizeDateToString(targetDate);
    const searchTaskId = String(taskId);
    
    return plansList.find(p => {
      if (!p.taskId || p.isAutoGenerated) return false;
      if (p.status === 'canceled') return false; // Exclude canceled plans
      
      if (p.instanceDate) {
        const pDate = new Date(p.instanceDate);
        pDate.setHours(0, 0, 0, 0);
        const pDateStr = pDate.toISOString().split('T')[0];
        return String(p.taskId) === searchTaskId && pDateStr === targetDateStr;
      }
      
      const pStartDate = new Date(p.startTime);
      pStartDate.setHours(0, 0, 0, 0);
      const pStartDateStr = pStartDate.toISOString().split('T')[0];
      return String(p.taskId) === searchTaskId && pStartDateStr === targetDateStr;
    });
  };

  // Get planned time for a task (from override or virtual plan)
  const getPlannedTime = (task: Task): { from: string; to: string } | null => {
    const dateStr = normalizeDateToString(selectedDate);
    
    // First check for real plan override
    const override = findOverrideForTaskAndDate(task.id, selectedDate, plans);
    if (override) {
      const start = override.startTime instanceof Date ? override.startTime : new Date(override.startTime);
      const end = override.endTime instanceof Date ? override.endTime : new Date(override.endTime);
      return {
        from: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
        to: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
      };
    }

    // Check if task has timePlanning enabled and not excluded for this date
    const timePlanning = task.timePlanning;
    if (timePlanning?.enabled && timePlanning.defaultStartTime && timePlanning.defaultEndTime) {
      const excludedDates = timePlanning.excludedDates || [];
      if (!excludedDates.includes(dateStr)) {
        return {
          from: timePlanning.defaultStartTime,
          to: timePlanning.defaultEndTime,
        };
      }
    }

    return null;
  };

  const handleTimeChange = async (taskId: string, field: 'from' | 'to', value: string, task: Task) => {
    // Get current planned time
    const plannedTime = getPlannedTime(task);
    const currentFrom = plannedTime?.from || '';
    const currentTo = plannedTime?.to || '';
    
    // Update local state immediately for UI responsiveness
    const updatedFrom = field === 'from' ? value : currentFrom;
    const updatedTo = field === 'to' ? value : currentTo;

    // Only proceed if both times are set
    if (!updatedFrom || !updatedTo) {
      return;
    }

    // Validate times
    const [startHours, startMinutes] = updatedFrom.split(':').map(Number);
    const [endHours, endMinutes] = updatedTo.split(':').map(Number);
    
    const start = new Date(selectedDate);
    start.setHours(startHours, startMinutes, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(endHours, endMinutes, 0, 0);

    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      // Use classification API for consistency
      const categoryId = await classifyTitleToCategoryId(task.title);
      const dateStr = normalizeDateToString(selectedDate);
      
      // Check if override already exists
      const existingOverride = findOverrideForTaskAndDate(taskId, selectedDate, plans);

      if (existingOverride) {
        // Update existing override
        const planId = (existingOverride as any)._id || existingOverride.id;
        const instanceDate = new Date(selectedDate);
        instanceDate.setHours(0, 0, 0, 0);
        await updatePlan(planId, {
          taskTitle: task.title,
          categoryId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          instanceDate: instanceDate.toISOString().split('T')[0], // Include instanceDate in update
        } as any);
      } else {
        // Create new override
        const instanceDateForCreate = new Date(selectedDate);
        instanceDateForCreate.setHours(0, 0, 0, 0);
        await createPlan({
          taskId: taskId,
          taskTitle: task.title,
          categoryId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          instanceDate: instanceDateForCreate.toISOString().split('T')[0], // Use YYYY-MM-DD format
          isOverride: true,
        });
      }

      // Refresh plans to show updated time
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStrForFetch = `${year}-${month}-${day}`;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      await fetchPlans(dateStrForFetch, tz);
      
      toast.success('Planned time updated');
    } catch (error) {
      console.error('Failed to update planned time:', error);
      toast.error('Failed to update planned time');
    }
  };

  const getTaskTime = (taskId: string, field: 'from' | 'to', task: Task): string => {
    const plannedTime = getPlannedTime(task);
    if (plannedTime) {
      return field === 'from' ? plannedTime.from : plannedTime.to;
    }
    return '';
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
                <h4 className="text-neutral-900 dark:text-neutral-100 truncate text-sm font-medium">{task.title}</h4>
              </div>
              <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs ${getCategoryColor(getTaskCategory(task.id, taskCategories))}`}>
                {getTaskCategory(task.id, taskCategories)}
              </span>
            </div>

            {/* Time Stats Row */}
            <div className="flex items-center gap-3 mb-2 text-xs">
              {(() => {
                const timeSpent = getTaskTimeSpentToday(task.id);
                const isActive = isTaskActive(task.id);
                const activeElapsed = getActiveElapsedTime(task.id);
                const sessionCount = sessions.filter(s => s.taskId === task.id && 
                  new Date(s.startTime).toDateString() === selectedDate.toDateString()).length;

                return (
                  <>
                    {timeSpent > 0 && (
                      <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(timeSpent)}</span>
                        {sessionCount > 0 && (
                          <span className="text-neutral-500 dark:text-neutral-500 ml-1">
                            ({sessionCount} {sessionCount === 1 ? 'session' : 'sessions'})
                          </span>
                        )}
                      </div>
                    )}
                    {isActive && activeElapsed !== null && (
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium animate-pulse">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                        <span>Active: {formatDuration(activeElapsed)}</span>
                      </div>
                    )}
                    {!timeSpent && !isActive && (
                      <div className="text-neutral-500 dark:text-neutral-500 italic">
                        Not tracked today
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="flex flex-col gap-1">
                <span className="text-neutral-600 dark:text-neutral-400 text-xs">From</span>
                <Input
                  type="time"
                  value={getTaskTime(task.id, 'from', task)}
                  onChange={(e) => handleTimeChange(task.id, 'from', e.target.value, task)}
                  className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 h-8 text-xs w-full"
                  placeholder="--:--"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-neutral-600 dark:text-neutral-400 text-xs">To</span>
                <Input
                  type="time"
                  value={getTaskTime(task.id, 'to', task)}
                  onChange={(e) => handleTimeChange(task.id, 'to', e.target.value, task)}
                  className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 h-8 text-xs w-full"
                  placeholder="--:--"
                />
              </div>
            </div>

          </motion.div>
        ))}
      </div>
    </div>
  );
}