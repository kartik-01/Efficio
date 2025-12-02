import { create } from 'zustand';
import { Task } from '../../types';
import { taskApi } from '../../services/taskApi';
import { toast } from 'sonner';

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  
  fetchTasks: () => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  loading: false,
  error: null,
  
  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await taskApi.getTasks();
      set({ tasks, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },
  
  updateTask: async (id: string, updates: Partial<Task>) => {
    try {
      await taskApi.updateTask(id, updates);
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  },
}));

