import { render, screen, waitFor, within } from '@testing-library/react';
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

describe('ExecutiveSummary', () => {
  const mockGetAccessToken = jest.fn().mockResolvedValue('mock-token');

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    
    // Mock timezone
    jest.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
      resolvedOptions: () => ({ timeZone: 'America/Los_Angeles' }),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

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
      json: async () => ({}),
    });

    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });
  });

  it('fetches and displays dashboard data successfully', async () => {
    const mockTasks = [
      {
        _id: '1',
        title: 'Test Task 1',
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        groupTag: '@work',
      },
      {
        _id: '2',
        title: 'Test Task 2',
        status: 'pending',
        createdAt: new Date().toISOString(),
        groupTag: '@personal',
      },
    ];

    const mockTimeSummary = {
      totalMinutes: 120,
      byCategory: [{ categoryId: 'work', minutes: 120 }],
      focus: { deepMinutes: 60, otherMinutes: 60 },
    };

    const mockActivities: any[] = [];
    const mockSessions: any[] = [];

    // Mock fetch responses - need to mock all 7 daily summary calls too
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTasks }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTimeSummary }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockActivities }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSessions }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ data: { totalMinutes: 0 } }),
      });

    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);

    await waitFor(() => {
      expect(screen.getByText('Tasks Completed')).toBeInTheDocument();
    });

    // Check that KPI cards are rendered
    expect(screen.getByText('Tasks Completed')).toBeInTheDocument();
    expect(screen.getByText('Time Tracked')).toBeInTheDocument();
  });

  it('includes Authorization header when getAccessToken is provided', async () => {
    const mockGetAccessToken = jest.fn().mockResolvedValue('test-token');
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchCalls = (global.fetch as jest.Mock).mock.calls;
    expect(fetchCalls.length).toBeGreaterThan(0);
    
    // Check that at least one call includes Authorization header
    const hasAuthHeader = fetchCalls.some((call) => {
      const options = call[1];
      return options?.headers?.Authorization === 'Bearer test-token';
    });
    
    expect(hasAuthHeader).toBe(true);
  });

  it('does not include Authorization header when getAccessToken is not provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    render(<ExecutiveSummary />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchCalls = (global.fetch as jest.Mock).mock.calls;
    const hasAuthHeader = fetchCalls.some((call) => {
      const options = call[1];
      return options?.headers?.Authorization;
    });
    
    expect(hasAuthHeader).toBe(false);
  });

  it('renders date filter dropdown', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { totalMinutes: 0, byCategory: [], focus: { deepMinutes: 0, otherMinutes: 0 } } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ data: { totalMinutes: 0 } }),
      });

    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);

    await waitFor(() => {
      const select = screen.getByDisplayValue('Current Week');
      expect(select).toBeInTheDocument();
    });

    expect(screen.getByText('Current Week')).toBeInTheDocument();
    expect(screen.getByText('Previous Week')).toBeInTheDocument();
    expect(screen.getByText('Current Month')).toBeInTheDocument();
    expect(screen.getByText('Previous Month')).toBeInTheDocument();
  });

  it('displays empty state when no tasks are available', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { totalMinutes: 0, byCategory: [], focus: { deepMinutes: 0, otherMinutes: 0 } } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ data: { totalMinutes: 0 } }),
      });

    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);

    await waitFor(() => {
      expect(screen.getAllByText(/No tasks found/i).length).toBeGreaterThan(0);
    });
  });

  it('displays tasks list when tasks are available', async () => {
    const mockTasks = [
      {
        _id: '1',
        title: 'Complete project',
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        groupTag: '@work',
      },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTasks }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { totalMinutes: 0, byCategory: [], focus: { deepMinutes: 0, otherMinutes: 0 } } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ data: { totalMinutes: 0 } }),
      });

    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);

    await waitFor(() => {
      expect(screen.getByText('Complete project')).toBeInTheDocument();
    });

    expect(screen.getByText(/My Tasks List/i)).toBeInTheDocument();
  });

  it('handles date filter change', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { totalMinutes: 0, byCategory: [], focus: { deepMinutes: 0, otherMinutes: 0 } } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ data: { totalMinutes: 0 } }),
      });

    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    (global.fetch as jest.Mock).mockClear();

    const select = screen.getByDisplayValue('Current Week') as HTMLSelectElement;
    // Simulate changing the filter
    select.value = 'previousWeek';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('displays activity feed section', async () => {
    const mockActivities = [
      {
        _id: '1',
        type: 'task_created',
        taskTitle: 'New Task',
        userId: 'user1',
        userName: 'Test User',
        timestamp: new Date().toISOString(),
      },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { totalMinutes: 0, byCategory: [], focus: { deepMinutes: 0, otherMinutes: 0 } } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockActivities }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ data: { totalMinutes: 0 } }),
      });

    render(<ExecutiveSummary getAccessToken={mockGetAccessToken} />);

    await waitFor(() => {
      expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument();
    });
  });
});

