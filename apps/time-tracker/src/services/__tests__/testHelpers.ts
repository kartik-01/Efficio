// Test helper utilities for time-tracker tests

export const createMockSession = (overrides = {}) => ({
  _id: 'session-1',
  id: 'session-1',
  userId: 'user-1',
  taskId: 'task-1',
  taskTitle: 'Test Session',
  categoryId: 'work',
  startTime: new Date('2024-01-01T09:00:00Z'),
  endTime: new Date('2024-01-01T10:00:00Z'),
  duration: 60,
  source: 'timer',
  notes: '',
  ...overrides,
});

export const createMockPlan = (overrides = {}) => ({
  _id: 'plan-1',
  id: 'plan-1',
  userId: 'user-1',
  taskId: 'task-1',
  taskTitle: 'Test Plan',
  categoryId: 'work',
  startTime: new Date('2024-01-01T09:00:00Z'),
  endTime: new Date('2024-01-01T10:00:00Z'),
  status: 'scheduled' as const,
  notes: '',
  ...overrides,
});

export const createMockTask = (overrides = {}) => ({
  id: 'task-1',
  _id: 'task-1',
  title: 'Test Task',
  status: 'in-progress' as const,
  category: 'Work',
  groupTag: '@personal',
  ...overrides,
});

export const createMockSummary = (overrides = {}) => ({
  totalMinutes: 120,
  focusMinutes: 100,
  topCategory: 'Work' as const,
  ...overrides,
});

// Mock fetch helper
export const mockFetchResponse = (data: any, ok = true, status = 200) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  });
};

/**
 * Sets up common beforeEach for API tests
 * Initializes the API with a mock token getter
 */
export const setupApiTest = (initializeFn: (tokenGetter: () => Promise<string | undefined>) => void) => {
  const mockTokenGetter = jest.fn().mockResolvedValue('mock-token');
  
  beforeEach(() => {
    jest.clearAllMocks();
    initializeFn(mockTokenGetter);
    (global.fetch as jest.Mock).mockClear();
  });
  
  return mockTokenGetter;
};

