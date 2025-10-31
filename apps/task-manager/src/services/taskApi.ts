// API base URL - injected by webpack DefinePlugin at build time
// For development, defaults to http://localhost:4000/api
// Can be overridden by setting API_BASE_URL environment variable
declare const process: {
  env: {
    API_BASE_URL?: string;
  };
};

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';

export interface Task {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
  progress?: number;
  isOverdue?: boolean;
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
  // Get all tasks
  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${API_BASE_URL}/tasks`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch tasks');
    }
    // Map _id to id for frontend compatibility
    return result.data.map((task: Task) => ({
      ...task,
      id: task._id || task.id,
    }));
  },

  // Get single task
  async getTaskById(id: string): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`);
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
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update task');
    }
    return {
      ...result.data,
      id: result.data._id || result.data.id,
    };
  },

  // Update task status
  async updateTaskStatus(id: string, status: 'pending' | 'in-progress' | 'completed'): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update task status');
    }
    return {
      ...result.data,
      id: result.data._id || result.data.id,
    };
  },

  // Update task progress
  async updateTaskProgress(id: string, progress: number): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ progress }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update task progress');
    }
    return {
      ...result.data,
      id: result.data._id || result.data.id,
    };
  },

  // Delete task
  async deleteTask(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete task');
    }
  },
};

