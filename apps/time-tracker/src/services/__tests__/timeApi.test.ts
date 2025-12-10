import { sessionsApi, plansApi, timeApi, isTimeApiReady, initializeTimeApi } from '../timeApi';

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

describe('timeApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isTimeApiReady', () => {
    it('returns true when API is ready', () => {
      expect(isTimeApiReady()).toBe(true);
    });
  });

  describe('sessionsApi', () => {
    describe('getRunning', () => {
      it('returns null when no session is running', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: null }),
        });

        const result = await sessionsApi.getRunning();
        expect(result).toBeNull();
      });

      it('returns session when one is running', async () => {
        const mockSession = {
          _id: 'session1',
          taskTitle: 'Test Task',
          categoryId: 'work',
          startTime: '2024-01-01T09:00:00Z',
          endTime: null,
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSession }),
        });

        // Mock handleResponse to return the session
        const { handleResponse } = require('../apiBase');
        (handleResponse as jest.Mock).mockResolvedValueOnce(mockSession);

        const result = await sessionsApi.getRunning();
        expect(result).not.toBeNull();
        expect(result?.id).toBe('session1');
      });
    });

    describe('startSession', () => {
      it('starts a new session', async () => {
        const mockSession = {
          _id: 'session1',
          taskId: 'task1',
          taskTitle: 'Test Task',
          categoryId: 'work',
          startTime: '2024-01-01T09:00:00Z',
        };

        const { handleResponse } = require('../apiBase');
        (handleResponse as jest.Mock).mockResolvedValueOnce(mockSession);

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSession }),
        });

        const result = await sessionsApi.startSession({
          taskId: 'task1',
          taskTitle: 'Test Task',
          categoryId: 'work',
        });

        expect(result.id).toBe('session1');
        expect(result.taskTitle).toBe('Test Task');
      });
    });

    describe('stopSession', () => {
      it('stops a running session', async () => {
        const mockSession = {
          _id: 'session1',
          taskTitle: 'Test Task',
          categoryId: 'work',
          startTime: '2024-01-01T09:00:00Z',
          endTime: '2024-01-01T10:00:00Z',
        };

        const { handleResponse } = require('../apiBase');
        (handleResponse as jest.Mock).mockResolvedValueOnce(mockSession);

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSession }),
        });

        const result = await sessionsApi.stopSession('session1');
        expect(result.endTime).not.toBeNull();
      });
    });

    describe('listSessions', () => {
      it('lists sessions for a date', async () => {
        const mockSessions = [
          {
            _id: 'session1',
            taskTitle: 'Task 1',
            categoryId: 'work',
            startTime: '2024-01-01T09:00:00Z',
            endTime: '2024-01-01T10:00:00Z',
          },
          {
            _id: 'session2',
            taskTitle: 'Task 2',
            categoryId: 'learning',
            startTime: '2024-01-01T11:00:00Z',
            endTime: '2024-01-01T12:00:00Z',
          },
        ];

        const { handleResponse } = require('../apiBase');
        (handleResponse as jest.Mock).mockResolvedValueOnce(mockSessions);

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSessions }),
        });

        const result = await sessionsApi.listSessions({ date: '2024-01-01', tz: 'UTC' });
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('session1');
        expect(result[1].id).toBe('session2');
      });
    });
  });

  describe('plansApi', () => {
    describe('getPlans', () => {
      it('gets plans for a date', async () => {
        const mockPlans = [
          {
            _id: 'plan1',
            taskTitle: 'Planned Task',
            categoryId: 'work',
            startTime: '2024-01-01T09:00:00Z',
            endTime: '2024-01-01T10:00:00Z',
            status: 'scheduled',
          },
        ];

        const { handleResponse } = require('../apiBase');
        (handleResponse as jest.Mock).mockResolvedValueOnce(mockPlans);

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockPlans }),
        });

        const result = await plansApi.getPlans({ date: '2024-01-01', tz: 'UTC' });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('plan1');
      });
    });

    describe('createPlan', () => {
      it('creates a new plan', async () => {
        const mockPlan = {
          _id: 'plan1',
          taskTitle: 'New Plan',
          categoryId: 'work',
          startTime: '2024-01-01T09:00:00Z',
          endTime: '2024-01-01T10:00:00Z',
          status: 'scheduled',
        };

        const { handleResponse } = require('../apiBase');
        (handleResponse as jest.Mock).mockResolvedValueOnce(mockPlan);

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockPlan }),
        });

        const result = await plansApi.createPlan({
          taskTitle: 'New Plan',
          categoryId: 'work',
          startTime: '2024-01-01T09:00:00Z',
          endTime: '2024-01-01T10:00:00Z',
        });

        expect(result.id).toBe('plan1');
        expect(result.taskTitle).toBe('New Plan');
      });
    });

    describe('classifyTitle', () => {
      it('classifies a title and returns categoryId', async () => {
        const mockResponse = {
          categoryId: 'work',
          confidence: 0.95,
          source: 'ml',
        };

        const { handleResponse } = require('../apiBase');
        (handleResponse as jest.Mock).mockResolvedValueOnce(mockResponse);

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await plansApi.classifyTitle('Review PRs');
        expect(result.categoryId).toBe('work');
        expect(result.confidence).toBe(0.95);
      });
    });
  });

  describe('timeApi', () => {
    describe('getSummary', () => {
      it('gets summary for today', async () => {
        const mockSummary = {
          success: true,
          data: {
            totalMinutes: 120,
            byCategory: [{ categoryId: 'work', minutes: 120 }],
            focus: { deepMinutes: 100, otherMinutes: 20 },
          },
        };

        const { handleResponse } = require('../apiBase');
        (handleResponse as jest.Mock).mockResolvedValueOnce(mockSummary);

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSummary),
        });

        const result = await timeApi.getSummary({ range: 'today', tz: 'UTC' });
        expect(result.data.totalMinutes).toBe(120);
      });
    });
  });
});

