// API base URL - injected by webpack DefinePlugin at build time
declare const process: {
  env: {
    API_BASE_URL?: string;
  };
};

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';

// Token getter function type - will be set by initializeTimeApi
let getAccessToken: (() => Promise<string | undefined>) | null = null;
let isInitialized = false;

// Initialize timeApi with Auth0 token getter
export const initializeTimeApi = (tokenGetter: () => Promise<string | undefined>) => {
  getAccessToken = tokenGetter;
  isInitialized = true;
};

// Check if timeApi is ready
export const isTimeApiReady = () => isInitialized && getAccessToken !== null;

// Get headers with authorization token
const getHeaders = async (): Promise<HeadersInit> => {
  if (!getAccessToken) {
    throw new Error('Time API not initialized. Call initializeTimeApi first.');
  }
  const token = await getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Handle API response and map _id to id
const handleResponse = async <T>(response: Response): Promise<T> => {
  const result = await response.json().catch(() => ({}));
  console.log('[handleResponse] Raw result:', JSON.stringify(result, null, 2));
  if (!response.ok) {
    const message =
      (result && (result.message || result.error)) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  const data = result.data ?? result;
  console.log('[handleResponse] Extracted data:', JSON.stringify(data, null, 2));

  // Map _id to id for arrays
  if (Array.isArray(data)) {
    return data.map((item: any) => ({
      ...item,
      id: item.id || item._id,
    })) as T;
  }

  // Map _id to id for single objects
  if (data && typeof data === 'object' && '_id' in data) {
    return {
      ...data,
      id: data.id || data._id,
    } as T;
  }

  return data;
};

// Types
export interface TimeSession {
  id: string;
  userId?: string;
  taskId?: string | null;
  taskTitle?: string | null;
  groupTag?: string;
  categoryId: string;
  startTime: string | Date;
  endTime?: string | Date | null;
  source: 'timer' | 'manual';
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Category {
  id: string;
  label: string;
  color: string;
}

export interface ClassificationResult {
  categoryId: string;
  confidence?: number;
}

export interface StartSessionData {
  taskId?: string | null;
  taskTitle?: string | null;
  groupTag?: string;
  categoryId?: string;
  notes?: string;
}

export interface CreateManualSessionData {
  taskId?: string | null;
  taskTitle?: string | null;
  groupTag?: string;
  categoryId?: string;
  startTime: string; // ISO 8601 string
  endTime: string; // ISO 8601 string
  notes?: string;
}

export interface SummaryData {
  totalMinutes: number;
  byCategory: Array<{ categoryId: string; minutes: number }>;
  focus: {
    deepMinutes: number;
    otherMinutes: number;
  };
}

export interface GetSummaryParams {
  range?: 'today';
  start?: string; // YYYY-MM-DD format
  end?: string; // YYYY-MM-DD format
  tz?: string; // Timezone
}

export const timeApi = {
  // Get running session
  async getRunningSession(): Promise<TimeSession | null> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/time/sessions/running`, {
      headers,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 404) {
        return null; // No running session
      }
      const message =
        (result && (result.message || result.error)) ||
        `Request failed with status ${response.status}`;
      throw new Error(message);
    }
    const data = result.data ?? null;
    if (data && typeof data === 'object' && '_id' in data) {
      return {
        ...data,
        id: data.id || data._id,
      } as TimeSession;
    }
    return data;
  },

  // Start a new session
  async startSession(data: StartSessionData): Promise<TimeSession> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/time/sessions/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<TimeSession>(response);
  },

  // Stop a session
  async stopSession(sessionId: string, endTime?: string): Promise<TimeSession> {
    const headers = await getHeaders();
    const body: any = {};
    if (endTime) {
      body.endTime = endTime;
    }
    const response = await fetch(`${API_BASE_URL}/time/sessions/${sessionId}/stop`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse<TimeSession>(response);
  },

  // Delete a session
  async deleteSession(sessionId: string): Promise<void> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/time/sessions/${sessionId}`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse<void>(response);
  },

  // Classify task title to get category
  async classifyTitle(title: string): Promise<ClassificationResult> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/time/classify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title }),
    });
    return handleResponse<ClassificationResult>(response);
  },

  // Get categories
  async getCategories(): Promise<Category[]> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/time/categories`, {
      headers,
    });
    return handleResponse<Category[]>(response);
  },

  // Get summary (real-time calculation)
  async getSummary(params: GetSummaryParams): Promise<SummaryData> {
    const headers = await getHeaders();
    const queryParams = new URLSearchParams();
    
    if (params.range === 'today') {
      queryParams.append('range', 'today');
    } else if (params.start && params.end) {
      queryParams.append('start', params.start);
      queryParams.append('end', params.end);
    }
    
    if (params.tz) {
      queryParams.append('tz', params.tz);
    }
    
    const url = `${API_BASE_URL}/time/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('[timeApi.getSummary] Fetching from:', url);
    const response = await fetch(url, {
      headers,
    });
    const result = await handleResponse<SummaryData>(response);
    console.log('[timeApi.getSummary] Processed result:', JSON.stringify(result, null, 2));
    return result;
  },

  // Get stored daily summary for a specific date (or calculate on-demand for past dates)
  async getDailySummary(date: string, tz?: string): Promise<SummaryData> {
    const headers = await getHeaders();
    const queryParams = new URLSearchParams();
    queryParams.append('date', date);
    if (tz) {
      queryParams.append('tz', tz);
    }
    const url = `${API_BASE_URL}/time/summary/daily?${queryParams.toString()}`;
    console.log('[timeApi.getDailySummary] Fetching from:', url);
    const response = await fetch(url, {
      headers,
    });
    const result = await handleResponse<SummaryData>(response);
    console.log('[timeApi.getDailySummary] Processed result:', JSON.stringify(result, null, 2));
    return result;
  },

  // Create manual session
  async createManualSession(data: CreateManualSessionData): Promise<TimeSession> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/time/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<TimeSession>(response);
  },

  // List sessions for a date or date range
  async listSessions(params: { date?: string; start?: string; end?: string; tz?: string }): Promise<TimeSession[]> {
    const headers = await getHeaders();
    const queryParams = new URLSearchParams();
    
    if (params.date) {
      queryParams.append('date', params.date);
    } else if (params.start && params.end) {
      queryParams.append('start', params.start);
      queryParams.append('end', params.end);
    }
    
    if (params.tz) {
      queryParams.append('tz', params.tz);
    }
    
    const url = `${API_BASE_URL}/time/sessions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      headers,
    });
    return handleResponse<TimeSession[]>(response);
  },
};

// Goals API
export interface Goal {
  id: string;
  _id?: string;
  userId?: string;
  categoryId: string;
  period: 'daily' | 'weekly';
  targetMinutes: number;
  active: boolean;
  progress?: {
    minutes: number;
    met: boolean;
  };
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateGoalData {
  categoryId: string;
  period: 'daily' | 'weekly';
  targetMinutes: number;
  active?: boolean;
}

export interface UpdateGoalData {
  categoryId?: string;
  period?: 'daily' | 'weekly';
  targetMinutes?: number;
  active?: boolean;
}

export const goalsApi = {
  // List goals (with optional progress)
  async listGoals(withProgress: boolean = false, tz?: string): Promise<Goal[]> {
    const headers = await getHeaders();
    const queryParams = new URLSearchParams();
    
    if (withProgress) {
      queryParams.append('withProgress', 'true');
      queryParams.append('range', 'today');
      if (tz) {
        queryParams.append('tz', tz);
      }
    }
    
    const url = `${API_BASE_URL}/time/goals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      headers,
    });
    return handleResponse<Goal[]>(response);
  },

  // Create goal
  async createGoal(data: CreateGoalData): Promise<Goal> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/time/goals`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<Goal>(response);
  },

  // Update goal
  async updateGoal(goalId: string, data: UpdateGoalData): Promise<Goal> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/time/goals/${goalId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<Goal>(response);
  },
};

// Plans API
export interface Plan {
  id: string;
  _id?: string;
  userId?: string;
  taskId?: string | null;
  taskTitle?: string | null;
  categoryId: string;
  startTime: string | Date;
  endTime: string | Date;
  status: 'scheduled' | 'in_progress' | 'done';
  notes?: string;
  sessionId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreatePlanData {
  taskId?: string | null;
  taskTitle?: string | null;
  categoryId?: string;
  startTime: string; // ISO 8601 string
  endTime: string; // ISO 8601 string
  notes?: string;
}

export interface UpdatePlanData {
  taskId?: string | null;
  taskTitle?: string | null;
  categoryId?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  status?: 'scheduled' | 'in_progress' | 'done';
}

export const plansApi = {
  // List plans for a date or date range
  async listPlans(params: { date?: string; start?: string; end?: string; tz?: string; status?: string }): Promise<Plan[]> {
    const headers = await getHeaders();
    const queryParams = new URLSearchParams();
    
    if (params.date) {
      queryParams.append('date', params.date);
    } else if (params.start && params.end) {
      queryParams.append('start', params.start);
      queryParams.append('end', params.end);
    }
    
    if (params.tz) {
      queryParams.append('tz', params.tz);
    }
    
    if (params.status) {
      queryParams.append('status', params.status);
    }
    
    const url = `${API_BASE_URL}/time/plans${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      headers,
    });
    return handleResponse<Plan[]>(response);
  },

  // Create plan
  async createPlan(data: CreatePlanData): Promise<Plan> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/time/plans`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<Plan>(response);
  },

  // Update plan
  async updatePlan(planId: string, data: UpdatePlanData): Promise<Plan> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/time/plans/${planId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<Plan>(response);
  },

  // Delete plan
  async deletePlan(planId: string): Promise<void> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/time/plans/${planId}`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse<void>(response);
  },

  // Start session from plan
  async startFromPlan(planId: string): Promise<{ plan: Plan; session: TimeSession }> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/time/plans/${planId}/start`, {
      method: 'POST',
      headers,
    });
    return handleResponse<{ plan: Plan; session: TimeSession }>(response);
  },

  // Complete plan
  async completePlan(planId: string): Promise<{ plan: Plan; session?: TimeSession }> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/time/plans/${planId}/complete`, {
      method: 'POST',
      headers,
    });
    return handleResponse<{ plan: Plan; session?: TimeSession }>(response);
  },
};

