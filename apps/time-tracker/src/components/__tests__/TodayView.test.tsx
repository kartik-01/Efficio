import { render, screen, waitFor } from '@testing-library/react';
import { TodayView } from '../TodayView';
import { useSessionsStore } from '../../store/slices/sessionsSlice';
import { useTasksStore } from '../../store/slices/tasksSlice';
import { usePlansStore } from '../../store/slices/plansSlice';
import { useSummaryStore } from '../../store/slices/summarySlice';
import { useUIStore } from '../../store/slices/uiSlice';
import { isTimeApiReady } from '../../services/timeApi';
import { isTaskApiReady } from '../../services/taskApi';

// Mock all stores
jest.mock('../../store/slices/sessionsSlice');
jest.mock('../../store/slices/tasksSlice');
jest.mock('../../store/slices/plansSlice');
jest.mock('../../store/slices/summarySlice');
jest.mock('../../store/slices/uiSlice');

// Mock services
jest.mock('@efficio/api', () => ({
  initializeApi: jest.fn(),
  isApiReady: jest.fn().mockReturnValue(true),
}));

jest.mock('../../services/taskApi', () => ({
  isTaskApiReady: jest.fn().mockReturnValue(true),
}));

jest.mock('../../services/timeApi', () => ({
  isTimeApiReady: jest.fn().mockReturnValue(true),
}));

// Mock child components
jest.mock('../TimerControl', () => ({
  TimerControl: () => <div data-testid="timer-control">Timer Control</div>,
}));

jest.mock('../DateNavigation', () => ({
  DateNavigation: ({ selectedDate, onDateChange }: { selectedDate: Date; onDateChange: (date: Date) => void }) => (
    <div data-testid="date-navigation">Date Navigation</div>
  ),
}));

jest.mock('../SummaryStrip', () => ({
  SummaryStrip: () => <div data-testid="summary-strip">Summary Strip</div>,
}));

jest.mock('../SessionTimeline', () => ({
  SessionTimeline: () => <div data-testid="session-timeline">Session Timeline</div>,
}));

jest.mock('../PlannedTimeBlocks', () => ({
  PlannedTimeBlocks: () => <div data-testid="planned-blocks">Planned Time Blocks</div>,
}));

jest.mock('../InProgressTasks', () => ({
  InProgressTasks: () => <div data-testid="in-progress-tasks">In Progress Tasks</div>,
}));

describe('TodayView', () => {
  const mockGetAccessToken = jest.fn().mockResolvedValue('test-token');
  
  const defaultStoreValues = {
    sessions: [],
    activeSession: null,
    loading: false,
    fetchSessions: jest.fn().mockResolvedValue(undefined),
    fetchActiveSession: jest.fn().mockResolvedValue(undefined),
    tasks: [],
    fetchTasks: jest.fn().mockResolvedValue(undefined),
    updateTask: jest.fn().mockResolvedValue(undefined),
    plans: [],
    fetchPlans: jest.fn().mockResolvedValue(undefined),
    summary: { totalMinutes: 0, focusMinutes: 0, topCategory: null },
    fetchSummary: jest.fn().mockResolvedValue(undefined),
    selectedDate: new Date(),
    externalTimerStart: null,
    timerTick: Date.now(),
    setSelectedDate: jest.fn(),
    setExternalTimerStart: jest.fn(),
    updateTimerTick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useSessionsStore as unknown as jest.Mock).mockReturnValue({
      sessions: defaultStoreValues.sessions,
      activeSession: defaultStoreValues.activeSession,
      loading: defaultStoreValues.loading,
      fetchSessions: defaultStoreValues.fetchSessions,
      fetchActiveSession: defaultStoreValues.fetchActiveSession,
    });

    (useTasksStore as unknown as jest.Mock).mockReturnValue({
      tasks: defaultStoreValues.tasks,
      loading: defaultStoreValues.loading,
      fetchTasks: defaultStoreValues.fetchTasks,
      updateTask: defaultStoreValues.updateTask,
    });

    (usePlansStore as unknown as jest.Mock).mockReturnValue({
      plans: defaultStoreValues.plans,
      fetchPlans: defaultStoreValues.fetchPlans,
    });

    (useSummaryStore as unknown as jest.Mock).mockReturnValue({
      summary: defaultStoreValues.summary,
      fetchSummary: defaultStoreValues.fetchSummary,
    });

    (useUIStore as unknown as jest.Mock).mockReturnValue({
      selectedDate: defaultStoreValues.selectedDate,
      externalTimerStart: defaultStoreValues.externalTimerStart,
      timerTick: defaultStoreValues.timerTick,
      setSelectedDate: defaultStoreValues.setSelectedDate,
      setExternalTimerStart: defaultStoreValues.setExternalTimerStart,
      updateTimerTick: defaultStoreValues.updateTimerTick,
    });
  });

  it('renders all main components', () => {
    render(<TodayView getAccessToken={mockGetAccessToken} />);
    
    expect(screen.getByTestId('date-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('timer-control')).toBeInTheDocument();
    expect(screen.getByTestId('in-progress-tasks')).toBeInTheDocument();
    expect(screen.getByTestId('summary-strip')).toBeInTheDocument();
    expect(screen.getByTestId('session-timeline')).toBeInTheDocument();
    expect(screen.getByTestId('planned-blocks')).toBeInTheDocument();
  });

  it('fetches data when API is ready', async () => {
    render(<TodayView getAccessToken={mockGetAccessToken} />);
    
    await waitFor(() => {
      expect(defaultStoreValues.fetchSessions).toHaveBeenCalled();
      expect(defaultStoreValues.fetchTasks).toHaveBeenCalled();
      expect(defaultStoreValues.fetchPlans).toHaveBeenCalled();
      expect(defaultStoreValues.fetchSummary).toHaveBeenCalled();
    });
  });

  it('updates timer tick when active session exists', async () => {
    const mockActiveSession = {
      id: 'session-1',
      taskTitle: 'Active Task',
      category: 'Work',
      startTime: new Date(),
    };

    (useSessionsStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreValues,
      activeSession: mockActiveSession,
      fetchSessions: defaultStoreValues.fetchSessions,
      fetchActiveSession: defaultStoreValues.fetchActiveSession,
    });

    jest.useFakeTimers();
    
    render(<TodayView getAccessToken={mockGetAccessToken} />);
    
    // Advance timer by 1 second
    jest.advanceTimersByTime(1000);
    
    expect(defaultStoreValues.updateTimerTick).toHaveBeenCalled();
    
    jest.useRealTimers();
  });
});

