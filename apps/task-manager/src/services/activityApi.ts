import { API_BASE_URL, getHeaders, handleResponse, initializeApi, isApiReady } from '@efficio/api';

// Backward compatibility: Re-export shared functions with activity-specific names
export const initializeActivityApi = initializeApi;
export const isActivityApiReady = isApiReady;

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

