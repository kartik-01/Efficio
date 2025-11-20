// API base URL
declare const process: {
  env: {
    API_BASE_URL?: string;
  };
};

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';

// Token getter function type
let getAccessToken: (() => Promise<string | undefined>) | null = null;
let isInitialized = false;

// Initialize taskApi with Auth0 token getter
export const initializeTaskApi = (tokenGetter: () => Promise<string | undefined>) => {
  getAccessToken = tokenGetter;
  isInitialized = true;
};

// Check if taskApi is ready
export const isTaskApiReady = () => isInitialized && getAccessToken !== null;

// Get headers with authorization token
const getHeaders = async (): Promise<HeadersInit> => {
  if (!getAccessToken) {
    throw new Error('Task API not initialized. Call initializeTaskApi first.');
  }
  const token = await getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Task interface for time tracker
export interface Task {
  id: string;
  _id?: string;
  title: string;
  status?: string;
  groupTag?: string;
}

export const taskApi = {
  // Get all tasks (personal + assigned in groups - what user sees in "All Tasks")
  async getTasks(): Promise<Task[]> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      headers,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || `Failed to fetch tasks: ${response.status}`);
    }
    
    // Map _id to id for frontend compatibility
    return result.data.map((task: any) => ({
      ...task,
      id: task._id || task.id,
    }));
  },
};

