import { useState, useEffect } from 'react';
import { TimeSession, DailySummary, Category, Task } from '../types';
import { TimerControl } from './TimerControl';
import { DateNavigation } from './DateNavigation';
import { SummaryStrip } from './SummaryStrip';
import { SessionTimeline } from './SessionTimeline';
import { PlannedTimeBlocks } from './PlannedTimeBlocks';
import { InProgressTasks } from './InProgressTasks';
import { taskApi, initializeTaskApi, isTaskApiReady } from '../services/taskApi';
import { sessionsApi, timeApi, initializeTimeApi, isTimeApiReady } from '../services/timeApi';
import { toast } from 'sonner';

interface TodayViewProps {
  getAccessToken?: () => Promise<string | undefined>;
}

export function TodayView({ getAccessToken }: TodayViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [activeSession, setActiveSession] = useState<TimeSession | null>(null);
  const [summary, setSummary] = useState<DailySummary>({ totalMinutes: 0, focusMinutes: 0, topCategory: null });
  const [externalTimerStart, setExternalTimerStart] = useState<{ taskId: string; taskTitle: string; category: Category } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [timerTick, setTimerTick] = useState(0); // Timestamp to trigger real-time updates
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [isTaskApiInitialized, setIsTaskApiInitialized] = useState(false);
  const [isTimeApiInitialized, setIsTimeApiInitialized] = useState(false);

  // Initialize APIs (only once)
  useEffect(() => {
    if (getAccessToken) {
      if (!isTaskApiInitialized) {
        initializeTaskApi(getAccessToken);
        setIsTaskApiInitialized(true);
      }
      if (!isTimeApiInitialized) {
        initializeTimeApi(getAccessToken);
        setIsTimeApiInitialized(true);
      }
    }
  }, [getAccessToken, isTaskApiInitialized, isTimeApiInitialized]);

  // Fetch tasks from backend
  useEffect(() => {
    const loadTasks = async () => {
      if (!isTaskApiReady()) return;

      try {
        setTasksLoading(true);
        const fetchedTasks = await taskApi.getTasks();
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Failed to load tasks:', error);
        toast.error('Failed to load tasks');
      } finally {
        setTasksLoading(false);
      }
    };

    if (isTaskApiReady()) {
      loadTasks();
    }
  }, [isTaskApiInitialized]); // Only fetch when API is initialized

  const refreshData = async (shouldRefreshPlans = false, shouldRefreshTasks = false) => {
    if (!isTimeApiReady()) return;

    try {
      setSessionsLoading(true);
      
      // Prepare date string for API calls
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Fetch sessions for selected date
      const fetchedSessions = await sessionsApi.listSessions({ date: dateStr, tz });
      const convertedSessions: TimeSession[] = fetchedSessions.map(s => ({
        id: s._id || s.id || '',
        taskId: s.taskId || undefined,
        taskTitle: s.taskTitle || '',
        category: (s.categoryId?.charAt(0).toUpperCase() + s.categoryId?.slice(1)) as Category || 'Work',
        startTime: typeof s.startTime === 'string' ? new Date(s.startTime) : s.startTime,
        endTime: s.endTime ? (typeof s.endTime === 'string' ? new Date(s.endTime) : s.endTime) : undefined,
        duration: s.duration,
      }));
      setSessions(convertedSessions);

      // Fetch active/running session
      try {
        const running = await sessionsApi.getRunning();
        if (running) {
          const active: TimeSession = {
            id: running._id || running.id || '',
            taskId: running.taskId || undefined,
            taskTitle: running.taskTitle || '',
            category: (running.categoryId?.charAt(0).toUpperCase() + running.categoryId?.slice(1)) as Category || 'Work',
            startTime: typeof running.startTime === 'string' ? new Date(running.startTime) : running.startTime,
            endTime: running.endTime ? (typeof running.endTime === 'string' ? new Date(running.endTime) : running.endTime) : undefined,
            duration: running.duration,
          };
          setActiveSession(active);
        } else {
          setActiveSession(null);
        }
      } catch (error) {
        // 404 is expected when no session is running
        setActiveSession(null);
      }

      // Fetch summary from backend
      const isToday = selectedDate.toDateString() === new Date().toDateString();
      let fetchedSummary;
      if (isToday) {
        fetchedSummary = await timeApi.getSummary({ range: 'today', tz });
      } else {
        fetchedSummary = await timeApi.getDailySummary(dateStr, tz);
      }
      
      const summaryData = fetchedSummary?.data || { totalMinutes: 0, byCategory: [], focus: { deepMinutes: 0, otherMinutes: 0 } };
      const topCategory = summaryData.byCategory && summaryData.byCategory.length > 0
        ? (summaryData.byCategory[0].categoryId.charAt(0).toUpperCase() + summaryData.byCategory[0].categoryId.slice(1)) as Category
        : null;
      
      setSummary({
        totalMinutes: summaryData.totalMinutes || 0,
        focusMinutes: summaryData.focus?.deepMinutes || 0,
        topCategory,
      });
      
      // Only trigger refresh for PlannedTimeBlocks if explicitly requested
      if (shouldRefreshPlans) {
        setRefreshTrigger(prev => prev + 1);
      }

      // Refresh tasks if requested
      if (shouldRefreshTasks && isTaskApiReady()) {
        taskApi.getTasks()
          .then(fetchedTasks => setTasks(fetchedTasks))
          .catch(error => {
            console.error('Failed to refresh tasks:', error);
            toast.error('Failed to refresh tasks');
          });
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setSessionsLoading(false);
    }
  };

  // Initial load and on date change
  useEffect(() => {
    if (isTimeApiReady()) {
      refreshData(true, true); // Initial load - refresh plans and tasks
    }
  }, [selectedDate, isTimeApiInitialized]);

  // Update timer display every second (but don't refetch from backend)
  // This updates a timestamp that triggers SummaryStrip to recalculate aggregated summary
  // with current time for running sessions
  useEffect(() => {
    if (!activeSession) return;
    
    const interval = setInterval(() => {
      setTimerTick(Date.now()); // Update timestamp to trigger recalculation
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleStartTimerFromTask = (taskId: string, taskTitle: string, category: Category) => {
    setExternalTimerStart({ taskId, taskTitle, category });
    // Reset after a short delay to allow the effect to trigger
    setTimeout(() => setExternalTimerStart(null), 100);
  };

  const handleUpdateTaskTime = async (taskId: string, fromTime: string, toTime: string) => {
    // Update task time via backend API
    if (!isTaskApiReady()) {
      toast.error('API not initialized');
      return;
    }

    try {
      // Note: The backend might need an endpoint to update task times
      // For now, we'll update locally and refresh
      // TODO: Add backend API endpoint for updating task times if needed
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, fromTime, toTime }
            : task
        )
      );
      refreshData(false, false); // Don't refetch, we've updated locally
    } catch (error) {
      console.error('Failed to update task time:', error);
      toast.error('Failed to update task time');
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Timer Control + In Progress Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimerControl 
          onUpdate={refreshData} 
          externalStart={externalTimerStart} 
          getAccessToken={getAccessToken}
          activeSession={activeSession}
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
      <SummaryStrip 
        selectedDate={selectedDate}
        getAccessToken={getAccessToken}
        refreshTrigger={refreshTrigger}
        sessions={sessions} // Pass sessions for real-time aggregation
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <SessionTimeline 
          selectedDate={selectedDate}
          getAccessToken={getAccessToken}
          refreshTrigger={refreshTrigger}
          onUpdate={refreshData}
        />

        {/* Planned Time Blocks */}
        <PlannedTimeBlocks 
          selectedDate={selectedDate}
          getAccessToken={getAccessToken}
          onUpdate={() => refreshData(true, true)} // Explicitly refresh plans and sessions when data changes
          refreshTrigger={refreshTrigger}
          activeSession={activeSession}
        />
      </div>
    </div>
  );
}