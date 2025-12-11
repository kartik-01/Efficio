import { sessionsApi, plansApi, timeApi, isTimeApiReady, initializeTimeApi } from '../timeApi';
import { setupApiTest } from './testHelpers';

// Mock fetch globally
global.fetch = jest.fn();

const mockTokenGetter = setupApiTest(initializeTimeApi);

// Helper function to create mock fetch response
const createMockResponse = (data: any) => ({
  ok: true,
  json: async () => ({ data }),
});

describe('timeApi', () => {
  describe('isTimeApiReady', () => {
    it('returns true when API is ready', () => {
      expect(isTimeApiReady()).toBe(true);
    });
  });
});

describe('sessionsApi', () => {
  describe('getRunning', () => {
    it('returns null when no session is running', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(null));

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

      (global.fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockSession));

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

      (global.fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockSession));

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

      (global.fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockSession));

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

      (global.fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockSessions));

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

      (global.fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockPlans));

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

      (global.fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockPlan));

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

      (global.fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse));

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

      (global.fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockSummary));

      const result = await timeApi.getSummary({ range: 'today', tz: 'UTC' });
      expect(result.data.totalMinutes).toBe(120);
    });
  });
});

