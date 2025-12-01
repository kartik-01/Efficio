import { useState, useEffect } from 'react';
import { TimeSession, PlannedBlock, DailySummary, Category } from '../types';
import { getSessions, getPlannedBlocks, getTasks, updateTask } from '../lib/storage';
import { calculateDailySummary, isSameDay } from '../lib/utils';
import { TimerControl } from './TimerControl';
import { DateNavigation } from './DateNavigation';
import { SummaryStrip } from './SummaryStrip';
import { SessionTimeline } from './SessionTimeline';
import { PlannedTimeBlocks } from './PlannedTimeBlocks';
import { InProgressTasks } from './InProgressTasks';

export function TodayView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [plannedBlocks, setPlannedBlocks] = useState<PlannedBlock[]>([]);
  const [summary, setSummary] = useState<DailySummary>({ totalMinutes: 0, focusMinutes: 0, topCategory: null });
  const [externalTimerStart, setExternalTimerStart] = useState<{ taskId: string; taskTitle: string; category: Category } | null>(null);

  const refreshData = () => {
    const allSessions = getSessions();
    setSessions(allSessions);
    
    const allBlocks = getPlannedBlocks();
    setPlannedBlocks(allBlocks);
    
    const newSummary = calculateDailySummary(allSessions, selectedDate);
    setSummary(newSummary);
  };

  useEffect(() => {
    refreshData();
    // Refresh every second to update running timer
    const interval = setInterval(refreshData, 1000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const handleStartTimerFromTask = (taskId: string, taskTitle: string, category: Category) => {
    setExternalTimerStart({ taskId, taskTitle, category });
    // Reset after a short delay to allow the effect to trigger
    setTimeout(() => setExternalTimerStart(null), 100);
  };

  const handleUpdateTaskTime = (taskId: string, fromTime: string, toTime: string) => {
    updateTask(taskId, { fromTime, toTime });
    refreshData();
  };

  const todaySessions = sessions.filter(s => isSameDay(s.startTime, selectedDate));
  const todayPlannedBlocks = plannedBlocks.filter(b => isSameDay(b.startTime, selectedDate));
  const tasks = getTasks();
  const activeSession = sessions.find(s => !s.endTime);

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Timer Control + In Progress Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimerControl onUpdate={refreshData} externalStart={externalTimerStart} />
        <InProgressTasks 
          tasks={tasks} 
          onStartTimer={handleStartTimerFromTask}
          onUpdateTaskTime={handleUpdateTaskTime}
          isTimerActive={!!activeSession}
        />
      </div>

      {/* Summary Strip */}
      <SummaryStrip summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <SessionTimeline sessions={todaySessions} onUpdate={refreshData} selectedDate={selectedDate} />

        {/* Planned Time Blocks */}
        <PlannedTimeBlocks blocks={todayPlannedBlocks} onUpdate={refreshData} />
      </div>
    </div>
  );
}