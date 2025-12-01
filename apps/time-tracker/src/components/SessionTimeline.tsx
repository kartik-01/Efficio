import { useState } from 'react';
import { TimeSession } from '../types';
import { formatTime, formatDuration, getCategoryColor } from '../lib/utils';
import { Clock, Plus } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@efficio/ui';
import { ManualTimeEntry } from './ManualTimeEntry';

interface SessionTimelineProps {
  sessions: TimeSession[];
  onUpdate: () => void;
  selectedDate: Date;
}

export function SessionTimeline({ sessions, onUpdate, selectedDate }: SessionTimelineProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Sort sessions by start time (most recent first)
  const sortedSessions = [...sessions].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  
  // Separate completed and ongoing sessions
  const completedSessions = sortedSessions.filter(s => s.endTime);
  const ongoingSessions = sortedSessions.filter(s => !s.endTime);

  const handleSave = () => {
    onUpdate();
    setIsDialogOpen(false);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-neutral-900 dark:text-neutral-100 font-semibold">Session Timeline</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 dark:bg-indigo-700 hover:bg-blue-700 dark:hover:bg-indigo-800">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <DialogHeader>
              <DialogTitle className="text-neutral-900 dark:text-neutral-100">Manual Time Entry</DialogTitle>
            </DialogHeader>
            <ManualTimeEntry onSave={handleSave} selectedDate={selectedDate} />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent dark:scrollbar-track-neutral-900">
      {sessions.length === 0 ? (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          No sessions tracked yet today
        </div>
      ) : (
        <div className="space-y-3">
          {ongoingSessions.map(session => (
            <SessionCard key={session.id} session={session} isOngoing />
          ))}
          {completedSessions.map(session => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function SessionCard({ session, isOngoing = false }: { session: TimeSession; isOngoing?: boolean }) {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-neutral-900 dark:text-neutral-100 truncate">{session.taskTitle}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${getCategoryColor(session.category)}`}>
              {session.category}
            </span>
            {isOngoing && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                In Progress
              </span>
            )}
          </div>
        </div>
        
        <div className="text-right flex-shrink-0">
          {session.endTime ? (
            <>
              <div className="text-neutral-900 dark:text-neutral-100">{formatDuration(session.duration || 0)}</div>
              <div className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
                {formatTime(session.startTime)} - {formatTime(session.endTime)}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Clock className="w-3 h-3" />
                <span className="text-sm">Running</span>
              </div>
              <div className="text-neutral-500 text-sm mt-1">
                Started {formatTime(session.startTime)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}