import { notificationApi, initializeNotificationApi, isNotificationApiReady, NotificationsResponse } from '../notificationApi';
import { setupApiTest } from './testHelpers';

// Mock fetch globally
global.fetch = jest.fn();

describe('notificationApi', () => {
  const mockTokenGetter = setupApiTest(initializeNotificationApi);
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
        acknowledgedAt: null,
      },
      {
        id: '2',
        type: 'task_assigned',
        taskId: 'task-1',
        taskTitle: 'Test Task',
        createdAt: '2025-01-15T11:00:00.000Z',
        acknowledgedAt: null,
      },
    ],
    pendingInvitationsCount: 1,
    taskAssignmentsCount: 1,
    totalUnreadCount: 2,
  };

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
      // Reset module to test uninitialized state
      jest.resetModules();
      const { notificationApi: freshNotificationApi } = require('../notificationApi');

      await expect(freshNotificationApi.getNotifications()).rejects.toThrow('Authentication not initialized');
    });

    it('should throw error when token is missing', async () => {
      const emptyTokenGetter = jest.fn().mockResolvedValue(undefined);
      initializeNotificationApi(emptyTokenGetter);

      await expect(notificationApi.getNotifications()).rejects.toThrow('Failed to retrieve access token');
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

  describe('deleteNotification', () => {
    it('should delete a notification successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await notificationApi.deleteNotification('notification-1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/notifications/notification-1'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('should throw error on API failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to clear notification' }),
      });

      await expect(notificationApi.deleteNotification('notification-1')).rejects.toThrow('Failed to clear notification');
    });
  });

  describe('clearTaskNotifications', () => {
    it('should clear all task notifications successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await notificationApi.clearTaskNotifications();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/notifications/task-assignments'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('should throw error on API failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to clear task notifications' }),
      });

      await expect(notificationApi.clearTaskNotifications()).rejects.toThrow('Failed to clear task notifications');
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(notificationApi.getNotifications()).rejects.toThrow('Network error');
    });
  });
});



