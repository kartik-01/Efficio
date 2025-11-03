import { activityApi, initializeActivityApi, isActivityApiReady } from '../activityApi';
import { setupApiTest } from './testHelpers';

// Mock fetch globally
global.fetch = jest.fn();

const mockTokenGetter = setupApiTest(initializeActivityApi);

describe('activityApi', () => {

  describe('initialization', () => {
    it('initializes with token getter', () => {
      expect(isActivityApiReady()).toBe(true);
    });

    it('returns false when not initialized', () => {
      jest.resetModules();
      const { isActivityApiReady: checkReady } = require('../activityApi');
      expect(checkReady()).toBe(false);
    });
  });

  describe('getActivities', () => {
    it('fetches activities successfully', async () => {
      const mockActivities = [
        {
          _id: '1',
          type: 'task_created',
          taskTitle: 'Task 1',
          userId: 'user123',
          userName: 'John Doe',
          timestamp: new Date().toISOString(),
        },
        {
          _id: '2',
          type: 'task_moved',
          taskTitle: 'Task 2',
          userId: 'user456',
          userName: 'Jane Smith',
          timestamp: new Date().toISOString(),
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockActivities }),
      });

      const result = await activityApi.getActivities();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/activities',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('fetches activities filtered by groupTag', async () => {
      const mockActivities = [
        {
          _id: '1',
          type: 'task_created',
          groupTag: '@web-ui',
          userId: 'user123',
          userName: 'John Doe',
          timestamp: new Date().toISOString(),
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockActivities }),
      });

      await activityApi.getActivities({ groupTag: '@web-ui' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/activities?groupTag=%40web-ui',
        expect.any(Object)
      );
    });

    it('fetches activities with limit', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await activityApi.getActivities({ limit: 50 });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/activities?limit=50',
        expect.any(Object)
      );
    });

    it('fetches activities with both groupTag and limit', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await activityApi.getActivities({ groupTag: '@web-ui', limit: 50 });

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('groupTag=%40web-ui');
      expect(url).toContain('limit=50');
    });

    it('throws error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Server error' }),
      });

      await expect(activityApi.getActivities()).rejects.toThrow('Server error');
    });
  });

  describe('createActivity', () => {
    it('creates a new activity successfully', async () => {
      const newActivity = {
        type: 'task_created' as const,
        taskTitle: 'New Task',
        taskId: 'task1',
        userId: 'user123',
        userName: 'John Doe',
        groupTag: '@web-ui',
      };

      const mockCreatedActivity = {
        _id: '1',
        ...newActivity,
        timestamp: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCreatedActivity }),
      });

      const result = await activityApi.createActivity(newActivity);

      expect(result.id).toBe('1');
      expect(result.type).toBe('task_created');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/activities',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(newActivity),
        })
      );
    });

    it('creates task_moved activity with status information', async () => {
      const newActivity = {
        type: 'task_moved' as const,
        taskTitle: 'Moved Task',
        taskId: 'task1',
        userId: 'user123',
        userName: 'John Doe',
        fromStatus: 'pending' as const,
        toStatus: 'in-progress' as const,
      };

      const mockCreatedActivity = {
        _id: '1',
        ...newActivity,
        timestamp: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCreatedActivity }),
      });

      const result = await activityApi.createActivity(newActivity);

      expect(result.fromStatus).toBe('pending');
      expect(result.toStatus).toBe('in-progress');
    });

    it('throws error when creation fails', async () => {
      const newActivity = {
        type: 'task_created' as const,
        userId: 'user123',
        userName: 'John Doe',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Validation error' }),
      });

      await expect(activityApi.createActivity(newActivity)).rejects.toThrow('Validation error');
    });
  });

  describe('error handling', () => {
    it('handles missing token gracefully', async () => {
      const tokenGetterWithoutToken = jest.fn().mockResolvedValue(undefined);
      initializeActivityApi(tokenGetterWithoutToken);

      await expect(activityApi.getActivities()).rejects.toThrow('Failed to retrieve access token');
    });

    it('handles network errors', async () => {
      // Re-initialize with valid token getter for this test
      initializeActivityApi(mockTokenGetter);
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(activityApi.getActivities()).rejects.toThrow('Network error');
    });

    it('maps _id to id correctly', async () => {
      // Re-initialize with valid token getter for this test
      initializeActivityApi(mockTokenGetter);
      
      const mockActivity = {
        _id: 'abc123',
        type: 'task_created',
        userId: 'user123',
        userName: 'John Doe',
        timestamp: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockActivity] }),
      });

      const result = await activityApi.getActivities();

      expect(result[0].id).toBe('abc123');
      // Note: mapActivity spreads all properties, so _id might still be present
      // The important thing is that id is set correctly
      expect(result[0]).toHaveProperty('id');
    });
  });
});

