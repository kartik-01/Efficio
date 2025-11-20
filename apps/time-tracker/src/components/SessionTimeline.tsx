import { useState, useEffect } from 'react';
import { TimeSession, Category } from '../types';
import { formatTime, formatDuration, getCategoryColor, getCategoryCardColors } from '../lib/utils';
import { Clock, Trash2 } from 'lucide-react';
import { timeApi, initializeTimeApi, isTimeApiReady } from '../services/timeApi';
import { toast } from 'sonner';

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

// Convert backend session to frontend format
const convertBackendSession = (backendSession: any): TimeSession => {
  const startTime = new Date(backendSession.startTime);
  const endTime = backendSession.endTime ? new Date(backendSession.endTime) : undefined;
  
  // Calculate duration in minutes
  let duration: number | undefined;
  if (endTime) {
    duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60);
  }
  
  return {
    id: backendSession.id || backendSession._id,
    taskId: backendSession.taskId || undefined,
    taskTitle: backendSession.taskTitle || 'Untitled Task',
    category: mapCategoryIdToCategory(backendSession.categoryId),
    startTime,
    endTime,
    duration,
  };
};

interface SessionTimelineProps {
  selectedDate: Date;
  getAccessToken?: () => Promise<string | undefined>;
  refreshTrigger?: number; // Increment this to trigger a refresh
  onDelete?: () => void; // Callback when a session is deleted
}

export function SessionTimeline({ selectedDate, getAccessToken, refreshTrigger, onDelete }: SessionTimelineProps) {
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize API
  useEffect(() => {
    if (getAccessToken) {
      initializeTimeApi(getAccessToken);
    }
  }, [getAccessToken]);

  // Fetch sessions from backend
  useEffect(() => {
    const loadSessions = async () => {
      if (!isTimeApiReady()) return;

      try {
        setLoading(true);
        
        // Format date as YYYY-MM-DD (normalize to local date, not UTC)
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const backendSessions = await timeApi.listSessions({ date: dateStr, tz });
        
        // Convert backend sessions to frontend format
        const convertedSessions = backendSessions.map(convertBackendSession);
        setSessions(convertedSessions);
      } catch (error) {
        console.error('Failed to load sessions:', error);
        toast.error('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [selectedDate, getAccessToken, refreshTrigger]);

  // Sort sessions by start time (earliest first)
  const sortedSessions = [...sessions].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
      <h2 className="text-neutral-900 dark:text-neutral-100 mb-4 font-semibold">Session Timeline</h2>
      
      {loading ? (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          Loading sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          No sessions tracked yet
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map(session => (
            <SessionCard 
              key={session.id} 
              session={session} 
              isOngoing={!session.endTime}
              onDelete={onDelete} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, isOngoing = false, onDelete }: { session: TimeSession; isOngoing?: boolean; onDelete?: () => void }) {
  const cardColors = getCategoryCardColors(session.category);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isTimeApiReady()) {
      toast.error('API not initialized');
      return;
    }

    try {
      setDeleting(true);
      await timeApi.deleteSession(session.id);
      toast.success('Session deleted');
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete session');
    } finally {
      setDeleting(false);
    }
  };
  
  return (
    <div className={`${cardColors.bg} border ${cardColors.border} ${cardColors.hoverBorder} rounded-lg p-4 transition-colors`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-neutral-900 dark:text-neutral-100 truncate font-medium">{session.taskTitle}</div>
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
        
        <div className="flex items-start gap-3 flex-shrink-0">
          <div className="text-right">
            {session.endTime ? (
              <>
                <div className="text-neutral-900 dark:text-neutral-100 font-semibold">{formatDuration(session.duration || 0)}</div>
                <div className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Clock className="w-3 h-3" />
                  <span className="text-sm">Running</span>
                </div>
                <div className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
                  Started {formatTime(session.startTime)}
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 hover:bg-white/20 dark:hover:bg-black/20 rounded transition-colors disabled:opacity-50"
            title="Delete session"
          >
            <Trash2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
