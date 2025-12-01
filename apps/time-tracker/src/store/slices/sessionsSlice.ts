import { create } from 'zustand';
import { TimeSession, Category } from '../../types';
import { sessionsApi } from '../../services/timeApi';
import { toast } from 'sonner';

interface SessionsState {
  // State
  sessions: TimeSession[];
  activeSession: TimeSession | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchSessions: (date: string, tz: string) => Promise<void>;
  fetchActiveSession: () => Promise<void>;
  startSession: (taskId: string | null, taskTitle: string, category: Category) => Promise<void>;
  stopSession: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  updateSession: (id: string, updates: { taskTitle: string; startTime: string; endTime: string; categoryId: string }) => Promise<void>;
  setActiveSession: (session: TimeSession | null) => void;
}

// Helper to convert backend session to TimeSession
const convertSession = (s: any): TimeSession => {
  const startTime = typeof s.startTime === 'string' ? new Date(s.startTime) : s.startTime;
  const endTime = s.endTime ? (typeof s.endTime === 'string' ? new Date(s.endTime) : s.endTime) : undefined;
  
  // Calculate duration
  let duration: number | undefined;
  if (endTime) {
    duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  } else {
    duration = Math.round((new Date().getTime() - startTime.getTime()) / 60000);
  }
  
  return {
    id: s._id || s.id || '',
    taskId: s.taskId || undefined,
    taskTitle: s.taskTitle || '',
    category: (s.categoryId?.charAt(0).toUpperCase() + s.categoryId?.slice(1)) as Category || 'Work',
    startTime,
    endTime,
    duration,
  };
};

export const useSessionsStore = create<SessionsState>((set, get) => ({
  // Initial state
  sessions: [],
  activeSession: null,
  loading: false,
  error: null,
  
  // Fetch sessions for a date
  fetchSessions: async (date: string, tz: string) => {
    set({ loading: true, error: null });
    try {
      const fetchedSessions = await sessionsApi.listSessions({ date, tz });
      const convertedSessions = fetchedSessions.map(convertSession);
      set({ sessions: convertedSessions, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sessions';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },
  
  // Fetch active/running session
  fetchActiveSession: async () => {
    try {
      const running = await sessionsApi.getRunning();
      if (running) {
        set({ activeSession: convertSession(running) });
      } else {
        set({ activeSession: null });
      }
    } catch (error) {
      // 404 is expected when no session is running
      set({ activeSession: null });
    }
  },
  
  // Start a new session
  startSession: async (taskId, taskTitle, category) => {
    try {
      const categoryId = category.toLowerCase();
      const session = await sessionsApi.startSession({
        taskId: taskId || null,
        taskTitle,
        categoryId,
      });
      const newSession = convertSession(session);
      set({ activeSession: newSession });
      toast.success('Timer started');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start timer';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Stop active session
  stopSession: async () => {
    const { activeSession } = get();
    if (!activeSession) return;
    
    try {
      await sessionsApi.stopSession(activeSession.id);
      set({ activeSession: null });
      toast.success('Timer stopped');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop timer';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Delete a session
  deleteSession: async (id: string) => {
    try {
      await sessionsApi.deleteSession(id);
      set(state => ({
        sessions: state.sessions.filter(s => s.id !== id),
        activeSession: state.activeSession?.id === id ? null : state.activeSession,
      }));
      toast.success('Session deleted');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete session';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Update a session
  updateSession: async (id: string, updates: { taskTitle: string; startTime: string; endTime: string; categoryId: string; selectedDate?: Date }) => {
    try {
      const [startHours, startMinutes] = updates.startTime.split(':').map(Number);
      const [endHours, endMinutes] = updates.endTime.split(':').map(Number);
      
      // Use provided selectedDate or current date as fallback
      const selectedDate = updates.selectedDate || new Date();
      const start = new Date(selectedDate);
      start.setHours(startHours, startMinutes, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(endHours, endMinutes, 0, 0);
      
      await sessionsApi.updateSession(id, {
        taskTitle: updates.taskTitle,
        categoryId: updates.categoryId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      
      // Update local state
      const newCategory = (updates.categoryId.charAt(0).toUpperCase() + updates.categoryId.slice(1)) as Category;
      const newDuration = end ? Math.round((end.getTime() - start.getTime()) / 60000) : undefined;
      
      set(state => ({
        sessions: state.sessions.map(s => 
          s.id === id ? {
            ...s,
            taskTitle: updates.taskTitle,
            category: newCategory,
            startTime: start,
            endTime: end || undefined,
            duration: newDuration,
          } : s
        ),
        activeSession: state.activeSession?.id === id 
          ? {
              ...state.activeSession,
              taskTitle: updates.taskTitle,
              category: newCategory,
              startTime: start,
              endTime: end || undefined,
              duration: newDuration,
            }
          : state.activeSession,
      }));
      
      toast.success('Session updated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update session';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Direct setter (for optimistic updates)
  setActiveSession: (session: TimeSession | null) => {
    set({ activeSession: session });
  },
}));

