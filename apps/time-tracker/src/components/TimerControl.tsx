import { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import { motion } from 'motion/react';
import { Category } from '../types';
import { formatTime, formatDuration, formatDateStr, getTimezone, isToday, getCategoryBadgeColor, getTimerStrokeColor, getTimerFillColor } from '../lib/utils';
import { classifyTitle } from '../lib/classification';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label, Input } from '@efficio/ui';
import { useTasksStore } from '../store/slices/tasksSlice';
import { useSessionsStore } from '../store/slices/sessionsSlice';
import { useUIStore } from '../store/slices/uiSlice';
import { usePlansStore } from '../store/slices/plansSlice';
import { useSummaryStore } from '../store/slices/summarySlice';
import { isTimeApiReady } from '../services/timeApi';
import { toast } from 'sonner';
import { useTaskClassification } from '../hooks/useTaskClassification';

interface TimerControlProps {
  externalStart?: { taskId: string; taskTitle: string; category: Category } | null;
  getAccessToken?: () => Promise<string | undefined>;
}

const CUSTOM_TASK_VALUE = '__custom__';

export function TimerControl({ externalStart, getAccessToken }: TimerControlProps) {
  const [selectedTask, setSelectedTask] = useState<string>(CUSTOM_TASK_VALUE);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);

  // Zustand stores
  const { tasks, loading: tasksLoading } = useTasksStore();
  const { activeSession, startSession, stopSession, fetchActiveSession } = useSessionsStore();
  const { selectedDate } = useUIStore();
  const { fetchPlans } = usePlansStore();
  const { fetchSummary } = useSummaryStore();
  
  const loading = tasksLoading;
  
  // Filter to only show in-progress tasks
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');

  // Use custom hook for task classification
  const selectedTaskCategory = useTaskClassification(selectedTask, inProgressTasks);

  // Handle external timer start requests
  useEffect(() => {
    if (externalStart && !activeSession) {
      startTimerForTask(externalStart.taskId, externalStart.taskTitle, externalStart.category);
    }
  }, [externalStart]);

  useEffect(() => {
    if (activeSession) {
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = (now.getTime() - activeSession.startTime.getTime()) / 1000 / 60;
        setElapsedMinutes(elapsed);
        // Trigger pulse animation every minute
        if (Math.floor(elapsed) > Math.floor(elapsed - 1/60)) {
          setPulseKey(prev => prev + 1);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeSession]);

  const startTimerForTask = async (taskId: string, taskTitle: string, category: Category) => {
    if (!isTimeApiReady()) {
      toast.error('API not initialized');
      return;
    }

    try {
      await startSession(taskId || null, taskTitle, category);

      // Reset form
      setSelectedTask(CUSTOM_TASK_VALUE);
      setCustomTitle('');

      // Refresh related data
      const dateStr = formatDateStr(selectedDate);
      const tz = getTimezone();
      const isTodayDate = isToday(selectedDate);
      
      const { fetchSessions } = useSessionsStore.getState();
      await Promise.all([
        fetchSessions(dateStr, tz),
        fetchPlans(dateStr, tz),
        fetchSummary(dateStr, tz, isTodayDate),
      ]);
    } catch (error) {
      // Error already handled in store
    }
  };

  const handleStart = async () => {
    if (!selectedTask) return;

    // Handle custom task (adhoc - always classify)
    if (selectedTask === CUSTOM_TASK_VALUE) {
      if (!customTitle.trim()) {
        toast.error('Please enter a title');
        return;
      }

      // Adhoc sessions should always be classified
      const category = await classifyTitle(customTitle.trim());
      await startTimerForTask('', customTitle.trim(), category);
      return;
    }

    // Handle regular task
    const task = inProgressTasks.find(t => t.id === selectedTask);
    if (!task) return;

    // Pass task to classification - it will use task.category if available, otherwise classify
    const category = await classifyTitle(task.title, task);
    await startTimerForTask(task.id, task.title, category);
  };

  const handleStop = async () => {
    if (!activeSession || !isTimeApiReady()) return;

    try {
      await stopSession();
      
      // Reset form
      setSelectedTask(CUSTOM_TASK_VALUE);
      setCustomTitle('');

      // Refresh related data
      const dateStr = formatDateStr(selectedDate);
      const tz = getTimezone();
      const isTodayDate = isToday(selectedDate);
      
      const { fetchSessions } = useSessionsStore.getState();
      await Promise.all([
        fetchSessions(dateStr, tz),
        fetchPlans(dateStr, tz),
        fetchSummary(dateStr, tz, isTodayDate),
      ]);
    } catch (error) {
      // Error already handled in store
    }
  };

  // Calculate progress for circular animation (reset every 60 minutes)
  const circleProgress = activeSession ? (elapsedMinutes % 60) / 60 : 0;
  const circumference = 2 * Math.PI * 120; // radius 120

  return (
    <div className="h-[540px]">
      {activeSession ? (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 space-y-6 h-full flex flex-col"
        >
          {/* Circular Timer Graphic */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            <svg className="w-56 h-56 -rotate-90" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx="112"
                cy="112"
                r="104"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-neutral-200 dark:text-neutral-800"
              />
              {/* Animated progress circle */}
              <circle
                cx="112"
                cy="112"
                r="104"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className={`${getTimerStrokeColor(activeSession.category)} transition-all duration-500 ease-out`}
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - circleProgress)}
                strokeLinecap="round"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: circumference * (1 - circleProgress),
                  transition: 'stroke-dashoffset 0.5s ease-out'
                }}
              />
              {/* Inner pulsing circle */}
              <circle
                key={pulseKey}
                cx="112"
                cy="112"
                r="88"
                fill="currentColor"
                className={`${getTimerFillColor(activeSession.category)} animate-pulse-once`}
                style={{
                  animation: `pulse-once 1s ease-out`
                }}
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div 
                className="text-5xl tabular-nums text-neutral-900 dark:text-neutral-100"
                key={Math.floor(elapsedMinutes)}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.3 }}
              >
                {formatDuration(elapsedMinutes)}
              </motion.div>
              <div className="text-neutral-600 dark:text-neutral-400 mt-2">elapsed</div>
            </div>
              </div>

          {/* Task Info */}
          <div className="text-center space-y-3 flex-shrink-0">
            <div className="text-neutral-900 dark:text-neutral-100 text-xl font-semibold">{activeSession.taskTitle}</div>
            <div className="flex items-center justify-center gap-3">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs border ${getCategoryBadgeColor(activeSession.category)}`}>
                {activeSession.category}
              </span>
              <span className="text-neutral-600 dark:text-neutral-400 text-sm">
                Started {formatTime(activeSession.startTime)}
              </span>
            </div>
          </div>

          {/* Stop Button */}
          <div>
            <Button 
              onClick={handleStop} 
              variant="destructive" 
              className="w-full h-12"
              size="lg"
            >
              <Square className="w-5 h-5 mr-2" />
            Stop Timer
          </Button>
        </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 space-y-6 h-full flex flex-col"
        >
          {/* Idle State Graphic */}
          <div className="relative flex items-center justify-center py-6 flex-shrink-0">
            <svg className="w-40 h-40">
              <circle
                cx="80"
                cy="80"
                r="75"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-neutral-300 dark:text-neutral-800 animate-spin-slow"
                strokeDasharray="4 4"
                style={{
                  animation: 'spin 20s linear infinite'
                }}
              />
              <circle
                cx="80"
                cy="80"
                r="58"
                fill="currentColor"
                className="text-neutral-200 dark:text-neutral-800/30"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Play className="w-12 h-12 text-neutral-500 dark:text-neutral-600" />
            </div>
          </div>

          {/* Task Selection */}
        <div className="space-y-3 flex-1 flex flex-col">
            <div className="space-y-2">
              <Label className="text-neutral-900 dark:text-neutral-100">Task</Label>
              <Select value={selectedTask} onValueChange={setSelectedTask} disabled={loading}>
                <SelectTrigger className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 h-11">
                  <SelectValue placeholder={loading ? "Loading tasks..." : "Select a task"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CUSTOM_TASK_VALUE}>
                    Work on something else
                  </SelectItem>
                  {inProgressTasks.length > 0 && inProgressTasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                  {inProgressTasks.length === 0 && !loading && (
                    <div className="px-2 py-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                      No in-progress tasks available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Title Input - shown when "Work on something else" is selected */}
            {selectedTask === CUSTOM_TASK_VALUE && (
              <div className="space-y-2">
                <Label className="text-neutral-900 dark:text-neutral-100">What are you working on?</Label>
                <Input
                  type="text"
                  placeholder="Enter task title..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 h-11"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customTitle.trim()) {
                      handleStart();
                    }
                  }}
                />
              </div>
            )}

            {/* Category Pill - shown when a regular task is selected */}
            {selectedTask && selectedTask !== CUSTOM_TASK_VALUE && selectedTaskCategory && (
              <div className="flex items-center">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs border ${getCategoryBadgeColor(selectedTaskCategory)}`}>
                  {selectedTaskCategory}
                </span>
              </div>
            )}
          </div>

          {/* Start Button */}
          <div className="mt-auto">
            <Button 
              onClick={handleStart} 
              disabled={!selectedTask || (selectedTask === CUSTOM_TASK_VALUE && !customTitle.trim())} 
              className="w-full h-12 bg-blue-600 dark:bg-indigo-700 hover:bg-blue-700 dark:hover:bg-indigo-800 disabled:opacity-50"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Timer
          </Button>
        </div>
        </motion.div>
      )}
    </div>
  );
}


