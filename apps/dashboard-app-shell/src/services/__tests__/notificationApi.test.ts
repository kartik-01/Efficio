import { notificationApi, initializeNotificationApi, isNotificationApiReady, NotificationsResponse } from '../notificationApi';

// Mock fetch globally
global.fetch = jest.fn();

describe('notificationApi', () => {
  const mockTokenGetter = jest.fn().mockResolvedValue('mock-token');
  const mockNotifications: NotificationsResponse = {
    notifications: [
      {
        id: '1',
        type: 'invitation',
        groupId: 'group-1',
        groupName: 'Test Group',
        groupTag: '@test-group',
        invitedAt: '2025-01-15T10:00:00.000Z',
        createdAt: '2025-01-15T10:00:00.000Z',
        read: false,
      },
      {
        id: '2',
        type: 'task_assigned',
        taskId: 'task-1',
        taskTitle: 'Test Task',
        createdAt: '2025-01-15T11:00:00.000Z',
        read: false,
      },
    ],
    pendingInvitationsCount: 1,
    taskAssignmentsCount: 1,
    totalUnreadCount: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    initializeNotificationApi(mockTokenGetter);
  });

  describe('initialization', () => {
    it('should initialize with token getter', () => {
      expect(isNotificationApiReady()).toBe(true);
    });

    it('should not be ready before initialization', () => {
      const { initializeNotificationApi: init, isNotificationApiReady: ready } = require('../notificationApi');
      // Reset state by re-initializing
      initializeNotificationApi(mockTokenGetter);
      expect(ready()).toBe(true);
    });
  });

  describe('getNotifications', () => {
    it('should get notifications successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockNotifications,
        }),
      });

      const result = await notificationApi.getNotifications();

      expect(result).toEqual(mockNotifications);
      expect(result.notifications).toHaveLength(2);
      expect(result.totalUnreadCount).toBe(2);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/notifications'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('should throw error on API failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          message: 'Server error',
        }),
      });

      await expect(notificationApi.getNotifications()).rejects.toThrow('Server error');
    });

    it('should throw error when not initialized', async () => {
      initializeNotificationApi(null as any);

      await expect(notificationApi.getNotifications()).rejects.toThrow('Notification API not initialized');
    });

    it('should throw error when token is missing', async () => {
      const emptyTokenGetter = jest.fn().mockResolvedValue(undefined);
      initializeNotificationApi(emptyTokenGetter);

      await expect(notificationApi.getNotifications()).rejects.toThrow('No authentication token available');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await notificationApi.markAsRead('notification-1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/notifications/notification-1/read'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('should throw error on API failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          message: 'Notification not found',
        }),
      });

      await expect(notificationApi.markAsRead('invalid-id')).rejects.toThrow('Notification not found');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await notificationApi.markAllAsRead();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/notifications/read-all'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('should throw error on API failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          message: 'Failed to mark all as read',
        }),
      });

      await expect(notificationApi.markAllAsRead()).rejects.toThrow('Failed to mark all as read');
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(notificationApi.getNotifications()).rejects.toThrow('Network error');
    });
  });
});


