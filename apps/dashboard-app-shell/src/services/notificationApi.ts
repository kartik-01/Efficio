// Notification API service
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

let tokenGetter: (() => Promise<string | undefined>) | null = null;

export function initializeNotificationApi(getToken: () => Promise<string | undefined>) {
  tokenGetter = getToken;
}

export function isNotificationApiReady(): boolean {
  return tokenGetter !== null;
}

async function getHeaders(): Promise<HeadersInit> {
  if (!tokenGetter) {
    throw new Error('Notification API not initialized. Call initializeNotificationApi first.');
  }

  const token = await tokenGetter();

  if (!token) {
    throw new Error('No authentication token available');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  return headers;
}

export interface Notification {
  id: string;
  type: 'invitation' | 'task_assigned';
  taskId?: string;
  taskTitle?: string;
  groupId?: string;
  groupName?: string;
  groupTag?: string;
  invitedAt?: string;
  createdAt?: string;
  read: boolean;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pendingInvitationsCount: number;
  taskAssignmentsCount: number;
  totalUnreadCount: number;
}

export const notificationApi = {
  // Get all notifications
  async getNotifications(): Promise<NotificationsResponse> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers,
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch notifications');
    }
    
    return result.data;
  },
};

