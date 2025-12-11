// Notification API service
import { API_BASE_URL, getHeaders, initializeApi, isApiReady } from './apiBase';

// Re-export for backward compatibility
export const initializeNotificationApi = initializeApi;
export const isNotificationApiReady = isApiReady;

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
  acknowledgedAt?: string | null;
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

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers,
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to mark notification as read');
    }
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers,
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to mark all notifications as read');
    }
  },
  
  async deleteNotification(notificationId: string): Promise<void> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers,
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to clear notification');
    }
  },

  async clearTaskNotifications(): Promise<void> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/notifications/task-assignments`, {
      method: 'DELETE',
      headers,
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to clear task notifications');
    }
  },
};

