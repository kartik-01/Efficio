import { Task } from '../types';
import { API_BASE_URL, getHeaders, handleResponse, initializeApi, isApiReady } from './apiBase';

// Re-export for backward compatibility
export const initializeTaskApi = initializeApi;
export const isTaskApiReady = isApiReady;

// Map backend status to frontend status
// Backend uses: 'pending' | 'in-progress' | 'completed'
// Frontend uses: 'todo' | 'in-progress' | 'done'
const mapStatus = (status: string): 'todo' | 'in-progress' | 'done' => {
  if (status === 'completed') return 'done';
  if (status === 'pending') return 'todo';
  if (status === 'in-progress') return 'in-progress';
  return 'todo'; // default
};

export const taskApi = {
  // Get all tasks (optionally filtered by groupTag)
  async getTasks(groupTag?: string): Promise<Task[]> {
    const headers = await getHeaders();
    
    // Build URL with optional groupTag query param
    let url = `${API_BASE_URL}/tasks`;
    if (groupTag) {
      url += `?groupTag=${encodeURIComponent(groupTag)}`;
    }
    
    const response = await fetch(url, {
      headers,
    });
    
    const result = await handleResponse<any>(response);
    
    // Map _id to id for frontend compatibility and map status values
    // Backend uses: 'pending' | 'in-progress' | 'completed'
    // Frontend uses: 'todo' | 'in-progress' | 'done'
    const mapStatus = (status: string): 'todo' | 'in-progress' | 'done' => {
      if (status === 'completed') return 'done';
      if (status === 'pending') return 'todo';
      if (status === 'in-progress') return 'in-progress';
      return 'todo'; // default
    };

    // Handle both wrapped { data: [...] } and direct array responses
    const tasks = Array.isArray(result) ? result : (result.data || []);
    
    return tasks.map((task: any) => ({
      id: task._id || task.id || '',
      _id: task._id,
      title: task.title || '',
      status: mapStatus(task.status || 'pending'),
      category: task.category || '', // Include category from task manager
      dueDate: task.dueDate || '', // Include dueDate from task manager
      groupTag: task.groupTag,
      fromTime: task.fromTime,
      toTime: task.toTime,
      timePlanning: task.timePlanning, // Include timePlanning config
    }));
  },

  // Update a task
  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const headers = await getHeaders();
    
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });
    
    const result = await handleResponse<{ _id?: string; id?: string; title: string; status: string; category?: string; groupTag?: string; fromTime?: string; toTime?: string; timePlanning?: any }>(response);

    const mappedTask: Task = {
      id: result._id || result.id || '',
      title: result.title || '',
      status: mapStatus(result.status || 'pending'),
      category: result.category || '',
      groupTag: result.groupTag,
      fromTime: result.fromTime,
      toTime: result.toTime,
      timePlanning: result.timePlanning,
    };
    
    return mappedTask;
  },
};

