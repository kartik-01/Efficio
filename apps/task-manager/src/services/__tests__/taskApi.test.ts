import { taskApi, initializeTaskApi, isTaskApiReady } from '../taskApi';

// Mock fetch globally
global.fetch = jest.fn();

const mockTokenGetter = jest.fn().mockResolvedValue('mock-token');

describe('taskApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    initializeTaskApi(mockTokenGetter);
    (global.fetch as jest.Mock).mockClear();
  });

  describe('initialization', () => {
    it('initializes with token getter', () => {
      expect(isTaskApiReady()).toBe(true);
    });

    it('returns false when not initialized', () => {
      // Reset the module
      jest.resetModules();
      const { isTaskApiReady: checkReady } = require('../taskApi');
      expect(checkReady()).toBe(false);
    });
  });

  describe('getTasks', () => {
    it('fetches all tasks successfully', async () => {
      const mockTasks = [
        { _id: '1', title: 'Task 1', status: 'pending' },
        { _id: '2', title: 'Task 2', status: 'in-progress' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTasks }),
      });

      const result = await taskApi.getTasks();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/tasks',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('fetches tasks filtered by groupTag', async () => {
      const mockTasks = [{ _id: '1', title: 'Task 1', groupTag: '@web-ui' }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTasks }),
      });

      await taskApi.getTasks('@web-ui');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/tasks?groupTag=%40web-ui',
        expect.any(Object)
      );
    });

    it('throws error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      await expect(taskApi.getTasks()).rejects.toThrow('Server error');
    });
  });

  describe('getTaskById', () => {
    it('fetches a single task by ID', async () => {
      const mockTask = { _id: '1', title: 'Task 1', status: 'pending' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTask }),
      });

      const result = await taskApi.getTaskById('1');

      expect(result.id).toBe('1');
      expect(result.title).toBe('Task 1');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/tasks/1',
        expect.any(Object)
      );
    });

    it('throws error when task not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Task not found' }),
      });

      await expect(taskApi.getTaskById('999')).rejects.toThrow('Task not found');
    });
  });

  describe('createTask', () => {
    it('creates a new task successfully', async () => {
      const newTask = {
        title: 'New Task',
        description: 'Task description',
        priority: 'High' as const,
        status: 'pending' as const,
      };

      const mockCreatedTask = { _id: '1', ...newTask };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCreatedTask }),
      });

      const result = await taskApi.createTask(newTask);

      expect(result.id).toBe('1');
      expect(result.title).toBe('New Task');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/tasks',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(newTask),
        })
      );
    });

    it('throws error when creation fails', async () => {
      const newTask = { title: 'New Task' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Validation error' }),
      });

      await expect(taskApi.createTask(newTask)).rejects.toThrow('Validation error');
    });
  });

  describe('updateTask', () => {
    it('updates a task successfully', async () => {
      const updateData = { title: 'Updated Task' };
      const mockUpdatedTask = { _id: '1', title: 'Updated Task', status: 'pending' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUpdatedTask }),
      });

      const result = await taskApi.updateTask('1', updateData);

      expect(result.title).toBe('Updated Task');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/tasks/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });

    it('throws error when update fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Update failed' }),
      });

      await expect(taskApi.updateTask('1', { title: 'Updated' })).rejects.toThrow('Update failed');
    });
  });

  describe('updateTaskStatus', () => {
    it('updates task status successfully', async () => {
      const mockUpdatedTask = { _id: '1', title: 'Task 1', status: 'in-progress' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUpdatedTask }),
      });

      const result = await taskApi.updateTaskStatus('1', 'in-progress');

      expect(result.status).toBe('in-progress');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/tasks/1/status',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'in-progress' }),
        })
      );
    });
  });

  describe('updateTaskProgress', () => {
    it('updates task progress successfully', async () => {
      const mockUpdatedTask = { _id: '1', title: 'Task 1', progress: 75 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUpdatedTask }),
      });

      const result = await taskApi.updateTaskProgress('1', 75);

      expect(result.progress).toBe(75);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/tasks/1/progress',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ progress: 75 }),
        })
      );
    });
  });

  describe('deleteTask', () => {
    it('deletes a task successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await taskApi.deleteTask('1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/tasks/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('throws error when deletion fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Delete failed' }),
      });

      await expect(taskApi.deleteTask('1')).rejects.toThrow('Delete failed');
    });
  });

  describe('error handling', () => {
    it('handles missing token gracefully', async () => {
      const tokenGetterWithoutToken = jest.fn().mockResolvedValue(undefined);
      initializeTaskApi(tokenGetterWithoutToken);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await expect(taskApi.getTasks()).rejects.toThrow();
    });

    it('handles network errors', async () => {
      // Ensure token getter is initialized
      initializeTaskApi(mockTokenGetter);
      // Reset and set up the mock to reject
      (global.fetch as jest.Mock).mockReset();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(taskApi.getTasks()).rejects.toThrow('Network error');
    });
  });
});

