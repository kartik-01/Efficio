import { render, screen, waitFor } from '@testing-library/react';
import { ExecutiveSummary } from '../pages/ExecutiveSummary';

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  Area: () => <div data-testid="area" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock environment variable
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    API_BASE_URL: 'http://localhost:4000/api',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// ============ Test Helpers ============

// Type for time summary mock
interface MockTimeSummary {
  totalMinutes: number;
  byCategory: { categoryId: string; minutes: number }[];
  focus: { deepMinutes: number; otherMinutes: number };
}

// Default empty time summary for mocks
const emptyTimeSummary: MockTimeSummary = { totalMinutes: 0, byCategory: [], focus: { deepMinutes: 0, otherMinutes: 0 } };

// Helper to create a mock task
const createMockTask = (overrides: Partial<{
  _id: string;
  title: string;
  status: string;
  createdAt: string;
  completedAt: string;
  groupTag: string;
}> = {}) => ({
  _id: overrides._id || '1',
  title: overrides.title || 'Test Task',
  status: overrides.status || 'pending',
  createdAt: overrides.createdAt || new Date().toISOString(),
  completedAt: overrides.completedAt,
  groupTag: overrides.groupTag || '@work',
});

// Helper to setup standard fetch mocks for successful API calls
const setupSuccessfulFetchMocks = (tasks: unknown[] = [], timeSummary = emptyTimeSummary) => {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: tasks }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: timeSummary }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
    .mockResolvedValue({ ok: true, json: async () => ({ data: { totalMinutes: 0 } }) });
};

// ============ Tests ============

describe('ExecutiveSummary', () => {
  const mockGetAccessToken = jest.fn().mockResolvedValue('mock-token');

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    localStorageMock.clear();
    
    // Mock timezone
    jest.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
      resolvedOptions: () => ({ timeZone: 'America/Los_Angeles' }),
    } as Intl.DateTimeFormat);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('renders error state when API call fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);
    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });
  });

  it('renders error state when tasks API fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => '{}',
    });
    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);
    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });
  });

  it('fetches and displays dashboard data successfully', async () => {
    const mockTasks = [
      createMockTask({ _id: '1', title: 'Test Task 1', status: 'completed', completedAt: new Date().toISOString() }),
      createMockTask({ _id: '2', title: 'Test Task 2', status: 'pending', groupTag: '@personal' }),
    ];
    const mockTimeSummary = {
      totalMinutes: 120,
      byCategory: [{ categoryId: 'work', minutes: 120 }],
      focus: { deepMinutes: 60, otherMinutes: 60 },
    };

    setupSuccessfulFetchMocks(mockTasks, mockTimeSummary);
    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);

    await waitFor(() => {
      expect(screen.getByText('Task Progress')).toBeInTheDocument();
    });
    expect(screen.getByText(/My Tasks List/i)).toBeInTheDocument();
  });

  it('includes Authorization header when getAccessToken is provided', async () => {
    const mockGetAccessToken = jest.fn().mockResolvedValue('test-token');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });

    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchCalls = (global.fetch as jest.Mock).mock.calls;
    expect(fetchCalls.length).toBeGreaterThan(0);
    
    const hasAuthHeader = fetchCalls.some((call) => call[1]?.headers?.Authorization === 'Bearer test-token');
    expect(hasAuthHeader).toBe(true);
  });

  it('does not include Authorization header when getAccessToken is not provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });

    render(<ExecutiveSummary />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchCalls = (global.fetch as jest.Mock).mock.calls;
    const hasAuthHeader = fetchCalls.some((call) => call[1]?.headers?.Authorization);
    expect(hasAuthHeader).toBe(false);
  });

  it('renders date filter dropdown', async () => {
    setupSuccessfulFetchMocks();
    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Current Week')).toBeInTheDocument();
    });

    expect(screen.getByText('Previous Week')).toBeInTheDocument();
    expect(screen.getByText('Current Month')).toBeInTheDocument();
    expect(screen.getByText('Previous Month')).toBeInTheDocument();
  });

  it('displays empty state when no tasks are available', async () => {
    setupSuccessfulFetchMocks();
    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);

    await waitFor(() => {
      expect(screen.getAllByText('No tasks found').length).toBeGreaterThan(0);
    });
  });

  it('displays tasks list when tasks are available', async () => {
    const mockTasks = [createMockTask({ title: 'Complete project', status: 'completed', completedAt: new Date().toISOString() })];
    setupSuccessfulFetchMocks(mockTasks);

    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);

    await waitFor(() => {
      expect(screen.getByText('Complete project')).toBeInTheDocument();
    });
    expect(screen.getByText(/My Tasks List/i)).toBeInTheDocument();
  });

  it('handles date filter change', async () => {
    setupSuccessfulFetchMocks();
    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(screen.getByDisplayValue('Current Week')).toBeInTheDocument();
  });

  it('displays task status distribution section', async () => {
    const mockTasks = [
      createMockTask({ _id: '1', title: 'Task 1', status: 'completed' }),
      createMockTask({ _id: '2', title: 'Task 2', status: 'pending' }),
    ];
    setupSuccessfulFetchMocks(mockTasks);

    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);

    await waitFor(() => {
      expect(screen.getByText(/Task Status Distribution/i)).toBeInTheDocument();
    });
  });
});
