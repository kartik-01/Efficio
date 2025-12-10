import { useState, useEffect } from 'react';
import { Category } from '../types';
import { formatTime, formatDuration, getCategoryColor, getCategoryCardColor } from '../lib/utils';
import { classifyTitleToCategoryId } from '../lib/classification';
import { Clock, Plus, Trash2, Edit } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, Input, Label } from '@efficio/ui';
import { ManualTimeEntry } from './ManualTimeEntry';
import { useSessionsStore } from '../store/slices/sessionsSlice';
import { useUIStore } from '../store/slices/uiSlice';
import { usePlansStore } from '../store/slices/plansSlice';
import { useSummaryStore } from '../store/slices/summarySlice';
import { isTimeApiReady } from '../services/timeApi';
import { toast } from 'sonner';

interface SessionTimelineProps {
  selectedDate: Date;
  getAccessToken?: () => Promise<string | undefined>;
}

export function SessionTimeline({ selectedDate, getAccessToken }: SessionTimelineProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { sessions, loading, deleteSession, updateSession, fetchSessions, fetchActiveSession } = useSessionsStore();
  const { selectedDate: storeDate } = useUIStore();
  const { fetchPlans } = usePlansStore();
  const { fetchSummary } = useSummaryStore();

  // Fetch sessions when selectedDate changes
  useEffect(() => {
    if (!isTimeApiReady()) return;
    
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    fetchSessions(dateStr, tz);
  }, [selectedDate, fetchSessions]);

  const handleSave = async () => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    
    await Promise.all([
      fetchSessions(dateStr, tz),
      fetchActiveSession(),
      fetchPlans(dateStr, tz),
      fetchSummary(dateStr, tz, isToday),
    ]);
    
    setIsDialogOpen(false);
  };

  const handleDelete = async (sessionId: string) => {
    if (!isTimeApiReady()) {
      return;
    }

    try {
      await deleteSession(sessionId);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const isToday = selectedDate.toDateString() === new Date().toDateString();
      
      await Promise.all([
        fetchActiveSession(),
        fetchSummary(dateStr, tz, isToday),
      ]);
    } catch (error) {
      // Error already handled in store
    }
  };

  const handleEdit = async (sessionId: string, updates: { taskTitle: string; startTime: string; endTime: string; categoryId: string }) => {
    if (!isTimeApiReady()) {
      return;
    }

    try {
      await updateSession(sessionId, { ...updates, selectedDate } as any);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const isToday = selectedDate.toDateString() === new Date().toDateString();
      
      await Promise.all([
        fetchSessions(dateStr, tz),
        fetchActiveSession(),
        fetchSummary(dateStr, tz, isToday),
      ]);
    } catch (error) {
      // Error already handled in store
    }
  };
  
  // Sort sessions by start time (earliest first)
  const sortedSessions = [...sessions].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  
  // Separate completed and ongoing sessions
  const completedSessions = sortedSessions.filter(s => s.endTime);
  const ongoingSessions = sortedSessions.filter(s => !s.endTime);

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
            <ManualTimeEntry onSave={handleSave} selectedDate={selectedDate} getAccessToken={getAccessToken} />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent dark:scrollbar-track-neutral-900">
      {loading ? (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          Loading sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          No sessions tracked yet today
        </div>
      ) : (
        <div className="space-y-3">
          {ongoingSessions.map(session => (
            <SessionCard 
              key={session.id} 
              session={session} 
              isOngoing 
              selectedDate={selectedDate}
              onDelete={handleDelete}
              onEdit={handleEdit}
              getAccessToken={getAccessToken}
            />
          ))}
          {completedSessions.map(session => (
            <SessionCard 
              key={session.id} 
              session={session} 
              selectedDate={selectedDate}
              onDelete={handleDelete}
              onEdit={handleEdit}
              getAccessToken={getAccessToken}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function SessionCard({ 
  session, 
  isOngoing = false, 
  selectedDate,
  onDelete,
  onEdit,
  getAccessToken
}: { 
  session: import('../types').TimeSession; 
  isOngoing?: boolean;
  selectedDate: Date;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, updates: { taskTitle: string; startTime: string; endTime: string; categoryId: string; selectedDate?: Date }) => void;
  getAccessToken?: () => Promise<string | undefined>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    taskTitle: session.taskTitle,
    startTime: '',
    endTime: '',
    categoryId: session.category.toLowerCase(),
  });
  const [classifying, setClassifying] = useState(false);

  // Initialize form with session data
  useEffect(() => {
    const startHours = String(session.startTime.getHours()).padStart(2, '0');
    const startMins = String(session.startTime.getMinutes()).padStart(2, '0');
    const endHours = session.endTime ? String(session.endTime.getHours()).padStart(2, '0') : '';
    const endMins = session.endTime ? String(session.endTime.getMinutes()).padStart(2, '0') : '';
    
    setEditForm({
      taskTitle: session.taskTitle,
      startTime: `${startHours}:${startMins}`,
      endTime: session.endTime ? `${endHours}:${endMins}` : '',
      categoryId: session.category.toLowerCase(),
    });
  }, [session]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    
    try {
      setDeleting(true);
      await onDelete(session.id);
    } finally {
      setDeleting(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editForm.taskTitle || !editForm.startTime || (!editForm.endTime && !isOngoing)) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!onEdit) return;

    let endTime = editForm.endTime;
    if (!endTime && isOngoing) {
      const now = new Date();
      endTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    await onEdit(session.id, {
      taskTitle: editForm.taskTitle,
      startTime: editForm.startTime,
      endTime: endTime,
      categoryId: editForm.categoryId,
    });

    setIsEditDialogOpen(false);
  };

  const handleClassifyTitle = async () => {
    if (!editForm.taskTitle.trim()) return;

    try {
      setClassifying(true);
      const categoryId = await classifyTitleToCategoryId(editForm.taskTitle);
      setEditForm(prev => ({ ...prev, categoryId }));
    } catch (error) {
      console.error('Failed to classify title:', error);
    } finally {
      setClassifying(false);
    }
  };

  // Real-time duration update for running sessions
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  useEffect(() => {
    if (isOngoing && !session.endTime) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOngoing, session.endTime]);

  // Calculate duration for display
  const displayDuration = () => {
    if (isOngoing && !session.endTime) {
      const minutes = Math.round((currentTime - session.startTime.getTime()) / 60000);
      return formatDuration(minutes);
    }
    if (session.duration !== undefined) {
      return formatDuration(session.duration);
    }
    if (session.endTime) {
      const minutes = Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000);
      return formatDuration(minutes);
    }
    return '0m';
  };

  const cardColorClasses = getCategoryCardColor(session.category);

  return (
    <>
      <div className={`${cardColorClasses} rounded-lg p-4 hover:opacity-90 transition-opacity`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-neutral-900 dark:text-neutral-100 truncate font-medium">{session.taskTitle || 'Untitled'}</div>
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
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              {session.endTime ? (
                <>
                  <div className="text-neutral-900 dark:text-neutral-100 font-semibold">{displayDuration()}</div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
                    {formatTime(session.startTime)} - {formatTime(session.endTime)}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <Clock className="w-3 h-3" />
                    <span className="text-sm font-medium">Running</span>
                  </div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
                    Started {formatTime(session.startTime)}
                  </div>
                  <div className="text-neutral-500 dark:text-neutral-500 text-xs mt-0.5">
                    {displayDuration()} elapsed
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={handleEditClick}
                  className="p-1.5 hover:bg-white/20 dark:hover:bg-black/20 rounded transition-colors"
                  title="Edit session"
                >
                  <Edit className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-1.5 hover:bg-red-500/20 dark:hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
                  title="Delete session"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Edit Session</DialogTitle>
            <DialogDescription className="text-neutral-600 dark:text-neutral-400">
              Update the session details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-neutral-900 dark:text-neutral-100">Title</Label>
              <Input
                type="text"
                placeholder="What did you work on?"
                value={editForm.taskTitle}
                onChange={(e) => {
                  setEditForm(prev => ({ ...prev, taskTitle: e.target.value }));
                  if (e.target.value.trim()) {
                    setTimeout(() => handleClassifyTitle(), 500);
                  }
                }}
                className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-neutral-900 dark:text-neutral-100">Start Time</Label>
                <Input
                  type="time"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                  className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-900 dark:text-neutral-100">End Time {isOngoing && '(optional)'}</Label>
                <Input
                  type="time"
                  value={editForm.endTime}
                  onChange={(e) => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                  disabled={isOngoing && !editForm.endTime}
                  className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                  placeholder={isOngoing ? 'Leave empty for now' : ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-900 dark:text-neutral-100">Category</Label>
              <select
                value={editForm.categoryId}
                onChange={(e) => setEditForm(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md text-neutral-900 dark:text-neutral-100"
              >
                <option value="work">Work</option>
                <option value="learning">Learning</option>
                <option value="admin">Admin</option>
                <option value="health">Health</option>
                <option value="personal">Personal</option>
                <option value="rest">Rest</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={!editForm.taskTitle || !editForm.startTime || (!editForm.endTime && !isOngoing) || classifying}
              className="bg-blue-600 dark:bg-indigo-700 hover:bg-blue-700 dark:hover:bg-indigo-800"
            >
              {classifying ? 'Classifying...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

