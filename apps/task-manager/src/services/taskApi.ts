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
}

export interface CreateTaskData {
  title: string;
  description?: string;
  category?: string;
  priority?: 'High' | 'Medium' | 'Low';
  status?: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
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
    console.log('Headers include Authorization:', !!headers['Authorization']);
    
    const response = await fetch(url, {
      headers,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: result
      });
      throw new Error(result.message || result.error || `Failed to fetch tasks: ${response.status}`);
    }
    
    // Map _id to id for frontend compatibility
    return result.data.map((task: Task) => ({
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
    console.log('Headers include Authorization:', !!headers['Authorization']);
    
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
  async updateTaskStatus(id: string, status: 'pending' | 'in-progress' | 'completed'): Promise<Task> {
    const headers = await getHeaders();
    console.log('Making PATCH request to:', `${API_BASE_URL}/tasks/${id}/status`);
    console.log('Headers include Authorization:', !!headers['Authorization']);
    
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
    return {
      ...result.data,
      id: result.data._id || result.data.id,
    };
  },

  // Update task progress
  async updateTaskProgress(id: string, progress: number): Promise<Task> {
    const headers = await getHeaders();
    console.log('Making PATCH request to:', `${API_BASE_URL}/tasks/${id}/progress`);
    console.log('Headers include Authorization:', !!headers['Authorization']);
    
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
    console.log('Headers include Authorization:', !!headers['Authorization']);
    
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
};

