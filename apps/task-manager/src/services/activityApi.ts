// API base URL
declare const process: {
  env: {
    API_BASE_URL?: string;
  };
};

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';

// Token getter function type - will be set by initializeActivityApi
let getAccessToken: (() => Promise<string | undefined>) | null = null;
let isInitialized = false;

// Initialize activityApi with Auth0 token getter
export const initializeActivityApi = (tokenGetter: () => Promise<string | undefined>) => {
  getAccessToken = tokenGetter;
  isInitialized = true;
};

// Check if activityApi is ready
export const isActivityApiReady = () => isInitialized && getAccessToken !== null;

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

export interface Activity {
  _id?: string;
  id?: string;
  type: 'task_created' | 'task_moved' | 'task_deleted' | 'task_updated' | 'member_added' | 'member_removed' | 'member_role_changed' | 'member_rejoined';
  taskId?: string;
  taskTitle?: string;
  userId: string;
  userName: string;
  userPicture?: string | null; // Profile picture for the user who performed the activity
  groupTag?: string;
  fromStatus?: 'pending' | 'in-progress' | 'completed';
  toStatus?: 'pending' | 'in-progress' | 'completed';
  timestamp: string;
  createdAt?: string;
}

export interface GetActivitiesParams {
  groupTag?: string;
  limit?: number;
}

// Helper function to map backend activity to frontend format
const mapActivity = (activity: Activity): Activity => ({
  ...activity,
  id: activity._id || activity.id,
});

export const activityApi = {
  // Get activities
  async getActivities(params?: GetActivitiesParams): Promise<Activity[]> {
    const headers = await getHeaders();
    
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.groupTag) {
      queryParams.append('groupTag', params.groupTag);
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    const url = `${API_BASE_URL}/activities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      headers,
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch activities');
    }
    
    // Map _id to id for frontend compatibility
    return result.data.map((activity: Activity) => mapActivity(activity));
  },

  // Create activity (usually called internally)
  async createActivity(data: Omit<Activity, '_id' | 'id' | 'timestamp'>): Promise<Activity> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/activities`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create activity');
    }
    
    return mapActivity(result.data);
  },
};

