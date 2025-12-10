import { taskApi, isTaskApiReady, initializeTaskApi } from '../taskApi';

// Mock fetch globally
global.fetch = jest.fn();

// Mock apiBase
jest.mock('../apiBase', () => ({
  API_BASE_URL: 'http://localhost:4000/api',
  getHeaders: jest.fn().mockResolvedValue({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-token',
  }),
  handleResponse: jest.fn().mockImplementation(async (response) => {
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'API error');
    }
    return result.data !== undefined ? result.data : result;
  }),
  initializeApi: jest.fn(),
  isApiReady: jest.fn().mockReturnValue(true),
}));

describe('taskApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isTaskApiReady', () => {
    it('returns true when API is ready', () => {
      expect(isTaskApiReady()).toBe(true);
    });
  });

  describe('getTasks', () => {
    it('fetches all tasks', async () => {
      const mockTasks = [
        {
          _id: 'task1',
          title: 'Task 1',
          status: 'in-progress',
          category: 'Work',
        },
        {
          _id: 'task2',
          title: 'Task 2',
          status: 'completed',
          category: 'Personal',
        },
      ];

      const { handleResponse } = require('../apiBase');
      (handleResponse as jest.Mock).mockResolvedValueOnce(mockTasks);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockTasks }),
      });

      const result = await taskApi.getTasks();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('task1');
      expect(result[0].status).toBe('in-progress');
      expect(result[1].status).toBe('done'); // 'completed' maps to 'done'
    });

    it('fetches tasks filtered by groupTag', async () => {
      const mockTasks = [
        {
          _id: 'task1',
          title: 'Task 1',
          status: 'pending',
          groupTag: '@personal',
        },
      ];

      const { handleResponse } = require('../apiBase');
      (handleResponse as jest.Mock).mockResolvedValueOnce(mockTasks);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockTasks }),
      });

      const result = await taskApi.getTasks('@personal');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/tasks?groupTag=%40personal',
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
    });

    it('maps backend status correctly', async () => {
      const mockTasks = [
        { _id: '1', title: 'Pending', status: 'pending' },
        { _id: '2', title: 'In Progress', status: 'in-progress' },
        { _id: '3', title: 'Completed', status: 'completed' },
      ];

      const { handleResponse } = require('../apiBase');
      (handleResponse as jest.Mock).mockResolvedValueOnce(mockTasks);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockTasks }),
      });

      const result = await taskApi.getTasks();
      expect(result[0].status).toBe('todo');
      expect(result[1].status).toBe('in-progress');
      expect(result[2].status).toBe('done');
    });
  });

  describe('updateTask', () => {
    it('updates a task', async () => {
      const mockUpdatedTask = {
        _id: 'task1',
        title: 'Updated Task',
        status: 'in-progress',
        category: 'Work',
      };

      const { handleResponse } = require('../apiBase');
      (handleResponse as jest.Mock).mockResolvedValueOnce(mockUpdatedTask);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockUpdatedTask }),
      });

      const result = await taskApi.updateTask('task1', { title: 'Updated Task' });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/tasks/task1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ title: 'Updated Task' }),
        })
      );
      expect(result.id).toBe('task1');
      expect(result.title).toBe('Updated Task');
    });
  });
});

