// API base URL - injected by webpack DefinePlugin at build time
// For development, defaults to http://localhost:4000/api
// Can be overridden by setting API_BASE_URL environment variable
declare const process: {
  env: {
    API_BASE_URL?: string;
  };
};

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';

// Token getter function type - will be set by initializeTaskApi
let getAccessToken: (() => Promise<string | undefined>) | null = null;
let isInitialized = false;

// Initialize taskApi with Auth0 token getter
export const initializeTaskApi = (tokenGetter: () => Promise<string | undefined>) => {
  getAccessToken = tokenGetter;
  isInitialized = true;
};

// Check if taskApi is ready
export const isTaskApiReady = () => isInitialized && getAccessToken !== null;

// Helper function to get headers with authorization
const getHeaders = async (): Promise<HeadersInit> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (!getAccessToken) {
    console.error('getAccessToken function is not initialized - API calls will fail');
    throw new Error('Authentication not initialized. Please refresh the page.');
  }

  try {
    const token = await getAccessToken();
    if (token && token.trim()) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.error('Token getter returned empty/undefined token');
      throw new Error('Failed to retrieve access token. Please login again.');
    }
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw error;
  }

  return headers;
};

export interface TimePlanning {
  enabled?: boolean;
  defaultStartTime?: string; // "HH:MM" format
  defaultEndTime?: string; // "HH:MM" format
  defaultDuration?: number; // minutes
  categoryId?: 'work' | 'learning' | 'admin' | 'health' | 'personal' | 'rest';
  recurrence?: {
    type?: 'none' | 'daily' | 'weekdays';
    endDate?: string; // ISO date string
    activatedAt?: string; // ISO date string
  };
  autoPlanOnStart?: boolean;
  showPlanningPrompt?: boolean;
  lastPlanGenerated?: string; // ISO date string
  planInstanceCount?: number;
}

export interface Task {
  _id?: string;
  id?: string;
  userId?: string; // Task owner's auth0Id
  title: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
  progress?: number;
  isOverdue?: boolean;
  groupTag?: string; // Group/Workspace tag
  assignedTo?: string[]; // Array of user IDs assigned to this task
  assignedUsers?: Array<{ userId: string; name: string; email?: string; picture?: string | null }>; // Assigned user info (for displaying exited users)
  timePlanning?: TimePlanning;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  category?: string;
  priority?: 'High' | 'Medium' | 'Low';
  status?: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
  allowBackdate?: boolean;
  progress?: number;
  isOverdue?: boolean;
  groupTag?: string; // Group/Workspace tag (e.g., "@personal", "@web-ui")
  assignedTo?: string[]; // Array of user IDs assigned to this task
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  category?: string;
  priority?: 'High' | 'Medium' | 'Low';
  status?: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
  allowBackdate?: boolean;
  progress?: number;
  isOverdue?: boolean;
}

export const taskApi = {
  // Get all tasks (optionally filtered by groupTag)
  async getTasks(groupTag?: string): Promise<Task[]> {
    const headers = await getHeaders();
    
    // Build URL with optional groupTag query param
    let url = `${API_BASE_URL}/tasks`;
    if (groupTag) {
      url += `?groupTag=${encodeURIComponent(groupTag)}`;
    }
    
    console.log('Making request to:', url);
    const headersObj = headers as Record<string, string>;
    console.log('Headers include Authorization:', !!headersObj['Authorization']);
    
    let response: Response;
    try {
      response = await fetch(url, {
        headers,
      });
    } catch (fetchError) {
      console.error('Network error fetching tasks:', fetchError);
      throw new Error(`Network error: Failed to connect to ${url}. Please check if the API server is running.`);
    }
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: result
      });
      const errorMessage = result.message || result.error || `Failed to fetch tasks (${response.status} ${response.statusText})`;
      throw new Error(errorMessage);
    }
    
    // Handle different response formats and ensure data is an array
    const tasksData = result.data || result.tasks || result || [];
    
    console.log('API Response received:', {
      status: response.status,
      hasData: !!result.data,
      dataType: Array.isArray(result.data) ? 'array' : typeof result.data,
      dataLength: Array.isArray(result.data) ? result.data.length : 'N/A',
      fullResult: result
    });
    
    if (!Array.isArray(tasksData)) {
      console.error('Invalid response format - expected array, got:', typeof tasksData, tasksData);
      console.error('Full API response:', result);
      return [];
    }
    
    console.log(`Successfully fetched ${tasksData.length} task(s) from API`);
    
    // Map _id to id for frontend compatibility
    return tasksData.map((task: Task) => ({
      ...task,
      id: task._id || task.id,
    }));
  },

  // Get single task
  async getTaskById(id: string): Promise<Task> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      headers,
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch task');
    }
    return {
      ...result.data,
      id: result.data._id || result.data.id,
    };
  },

  // Create new task
  async createTask(data: CreateTaskData): Promise<Task> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create task');
    }
    return {
      ...result.data,
      id: result.data._id || result.data.id,
    };
  },

  // Update task
  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    const headers = await getHeaders();
    console.log('Making PUT request to:', `${API_BASE_URL}/tasks/${id}`);
    const headersObj = headers as Record<string, string>;
    console.log('Headers include Authorization:', !!headersObj['Authorization']);
    
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Update Task Error:', {
        status: response.status,
        error: result
      });
      throw new Error(result.message || result.error || 'Failed to update task');
    }
    return {
      ...result.data,
      id: result.data._id || result.data.id,
    };
  },

  // Update task status
  async updateTaskStatus(id: string, status: 'pending' | 'in-progress' | 'completed'): Promise<{ task: Task; activity?: any }> {
    const headers = await getHeaders();
    console.log('Making PATCH request to:', `${API_BASE_URL}/tasks/${id}/status`);
    const headersObj = headers as Record<string, string>;
    console.log('Headers include Authorization:', !!headersObj['Authorization']);
    
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Update Status Error:', {
        status: response.status,
        error: result
      });
      throw new Error(result.message || result.error || 'Failed to update task status');
    }
    const mappedTask: Task = {
      ...result.data,
      id: result.data._id || result.data.id,
    };
    return { task: mappedTask, activity: result.activity };
  },

  // Update task progress
  async updateTaskProgress(id: string, progress: number): Promise<Task> {
    const headers = await getHeaders();
    console.log('Making PATCH request to:', `${API_BASE_URL}/tasks/${id}/progress`);
    const headersObj = headers as Record<string, string>;
    console.log('Headers include Authorization:', !!headersObj['Authorization']);
    
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/progress`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ progress }),
    });
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Update Progress Error:', {
        status: response.status,
        error: result
      });
      throw new Error(result.message || result.error || 'Failed to update task progress');
    }
    return {
      ...result.data,
      id: result.data._id || result.data.id,
    };
  },

  // Delete task
  async deleteTask(id: string): Promise<void> {
    const headers = await getHeaders();
    console.log('Making DELETE request to:', `${API_BASE_URL}/tasks/${id}`);
    const headersObj = headers as Record<string, string>;
    console.log('Headers include Authorization:', !!headersObj['Authorization']);
    
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers,
    });
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Delete Task Error:', {
        status: response.status,
        error: result
      });
      throw new Error(result.message || result.error || 'Failed to delete task');
    }
  },

  // Configure time planning for a task
  async configureTimePlanning(id: string, config: Partial<TimePlanning>): Promise<Task> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/time-planning`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(config),
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Failed to configure time planning');
    }
    return {
      ...result.data,
      id: result.data._id || result.data.id,
    };
  },
};

