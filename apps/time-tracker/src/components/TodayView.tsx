import { useState } from 'react';
import { TimerControl } from './TimerControl';
import { DateNavigation } from './DateNavigation';
import { SummaryStrip } from './SummaryStrip';
import { SessionTimeline } from './SessionTimeline';
import { ManualTimeEntry } from './ManualTimeEntry';
import { PlannedTimeBlocks } from './PlannedTimeBlocks';

interface TodayViewProps {
  getAccessToken?: () => Promise<string | undefined>;
}

export function TodayView({ getAccessToken }: TodayViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [summaryRefreshTrigger, setSummaryRefreshTrigger] = useState(0);
  const [sessionsRefreshTrigger, setSessionsRefreshTrigger] = useState(0);
  const [plansRefreshTrigger, setPlansRefreshTrigger] = useState(0);

  const refreshSummary = () => {
    setSummaryRefreshTrigger(prev => prev + 1);
  };

  const refreshSessions = () => {
    setSessionsRefreshTrigger(prev => prev + 1);
  };

  const refreshPlans = () => {
    setPlansRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Timer Control */}
      <TimerControl onUpdate={() => { refreshSummary(); refreshSessions(); refreshPlans(); }} getAccessToken={getAccessToken} selectedDate={selectedDate} />

      {/* Summary Strip */}
      <SummaryStrip selectedDate={selectedDate} getAccessToken={getAccessToken} refreshTrigger={summaryRefreshTrigger} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="space-y-6">
          <SessionTimeline 
            selectedDate={selectedDate} 
            getAccessToken={getAccessToken} 
            refreshTrigger={sessionsRefreshTrigger}
            onDelete={() => {
              refreshSessions();
              refreshSummary();
            }}
          />
          
          {/* Manual Entry */}
          <ManualTimeEntry onSave={() => { refreshSummary(); refreshSessions(); refreshPlans(); }} selectedDate={selectedDate} getAccessToken={getAccessToken} />
        </div>

        {/* Planned Time Blocks */}
        <PlannedTimeBlocks 
          selectedDate={selectedDate} 
          getAccessToken={getAccessToken} 
          onUpdate={() => { 
            refreshPlans(); 
            refreshSessions(); 
            refreshSummary(); 
          }} 
        />
      </div>
    </div>
  );
}
