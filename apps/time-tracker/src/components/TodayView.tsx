import { useEffect } from 'react';
import { Category } from '../types';
import { TimerControl } from './TimerControl';
import { DateNavigation } from './DateNavigation';
import { SummaryStrip } from './SummaryStrip';
import { SessionTimeline } from './SessionTimeline';
import { PlannedTimeBlocks } from './PlannedTimeBlocks';
import { InProgressTasks } from './InProgressTasks';
import { initializeTaskApi, isTaskApiReady } from '../services/taskApi';
import { initializeTimeApi, isTimeApiReady } from '../services/timeApi';
import { useSessionsStore } from '../store/slices/sessionsSlice';
import { useTasksStore } from '../store/slices/tasksSlice';
import { usePlansStore } from '../store/slices/plansSlice';
import { useSummaryStore } from '../store/slices/summarySlice';
import { useUIStore } from '../store/slices/uiSlice';
import { toast } from 'sonner';

interface TodayViewProps {
  getAccessToken?: () => Promise<string | undefined>;
}

export function TodayView({ getAccessToken }: TodayViewProps) {
  // Zustand stores
  const { 
    sessions, 
    activeSession, 
    loading: sessionsLoading,
    fetchSessions, 
    fetchActiveSession 
  } = useSessionsStore();
  
  const { 
    tasks, 
    loading: tasksLoading, 
    fetchTasks,
    updateTask 
  } = useTasksStore();
  
  const { 
    summary, 
    fetchSummary 
  } = useSummaryStore();
  
  const { 
    selectedDate, 
    externalTimerStart,
    timerTick,
    setSelectedDate, 
    setExternalTimerStart,
    updateTimerTick 
  } = useUIStore();
  
  const { fetchPlans } = usePlansStore();

  // Initialize APIs (only once)
  useEffect(() => {
    if (getAccessToken) {
      initializeTaskApi(getAccessToken);
      initializeTimeApi(getAccessToken);
    }
  }, [getAccessToken]);

  // Fetch all data when date changes or on initial load
  useEffect(() => {
    if (!isTimeApiReady() || !isTaskApiReady()) return;
    
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    
    // Fetch all data in parallel
    Promise.all([
      fetchSessions(dateStr, tz),
      fetchActiveSession(),
      fetchTasks(),
      fetchPlans(dateStr, tz),
      fetchSummary(dateStr, tz, isToday),
    ]);
  }, [selectedDate, fetchSessions, fetchActiveSession, fetchTasks, fetchPlans, fetchSummary]);

  // Update timer display every second (but don't refetch from backend)
  // This updates a timestamp that triggers SummaryStrip to recalculate aggregated summary
  // with current time for running sessions
  useEffect(() => {
    if (!activeSession) return;
    
    const interval = setInterval(() => {
      updateTimerTick(); // Update timestamp to trigger recalculation
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession, updateTimerTick]);

  const handleStartTimerFromTask = (taskId: string, taskTitle: string, category: Category) => {
    setExternalTimerStart({ taskId, taskTitle, category });
    // Reset after a short delay to allow the effect to trigger
    setTimeout(() => setExternalTimerStart(null), 100);
  };

  const handleUpdateTaskTime = async (taskId: string, fromTime: string, toTime: string) => {
    try {
      await updateTask(taskId, { fromTime, toTime });
    } catch (error) {
      console.error('Failed to update task time:', error);
      // Error is already handled in the store
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Timer Control + In Progress Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimerControl 
          externalStart={externalTimerStart} 
          getAccessToken={getAccessToken}
        />
        <InProgressTasks 
          tasks={tasks}
          loading={tasksLoading}
          getAccessToken={getAccessToken}
          onStartTimer={handleStartTimerFromTask}
          onUpdateTaskTime={handleUpdateTaskTime}
          isTimerActive={!!activeSession}
        />
      </div>

      {/* Summary Strip */}
      <SummaryStrip selectedDate={selectedDate} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <SessionTimeline selectedDate={selectedDate} />

        {/* Planned Time Blocks */}
        <PlannedTimeBlocks selectedDate={selectedDate} />
      </div>
    </div>
  );
}