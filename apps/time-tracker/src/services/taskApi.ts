import { Task } from '../types';

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
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: result
      });
      throw new Error(result.message || result.error || `Failed to fetch tasks: ${response.status}`);
    }
    
    // Map _id to id for frontend compatibility and map status values
    // Backend uses: 'pending' | 'in-progress' | 'completed'
    // Frontend uses: 'todo' | 'in-progress' | 'done'
    const mapStatus = (status: string): 'todo' | 'in-progress' | 'done' => {
      if (status === 'completed') return 'done';
      if (status === 'pending') return 'todo';
      if (status === 'in-progress') return 'in-progress';
      return 'todo'; // default
    };

    return result.data.map((task: any) => ({
      id: task._id || task.id || '',
      _id: task._id,
      title: task.title || '',
      status: mapStatus(task.status || 'pending'),
      groupTag: task.groupTag,
      fromTime: task.fromTime,
      toTime: task.toTime,
    }));
  },
};

