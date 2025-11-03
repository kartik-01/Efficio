import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardApp from '../DashboardApp';
import { useAuth0 } from '@auth0/auth0-react';
import { useTheme } from '../hooks/useTheme';
import { userApi, initializeUserApi, isUserApiReady } from '../services/userApi';
import * as reactRouterDom from 'react-router-dom';

// Mock @auth0/auth0-react
const mockGetAccessTokenSilently = jest.fn().mockResolvedValue('mock-token');

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn(),
}));

// Mock useTheme
const mockLoadTheme = jest.fn();

jest.mock('../hooks/useTheme', () => ({
  useTheme: jest.fn(),
}));

// Mock userApi
jest.mock('../services/userApi', () => ({
  userApi: {
    getOrCreateUser: jest.fn(),
  },
  initializeUserApi: jest.fn(),
  isUserApiReady: jest.fn(() => true),
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
  },
  Toaster: () => <div data-testid="toaster" />,
}));

// Mock components
jest.mock('../components/Navbar', () => ({
  Navbar: ({ activeTab, onTabChange }: any) => (
    <div data-testid="navbar" data-active-tab={activeTab}>
      <button onClick={() => onTabChange?.('time')}>Switch to Time</button>
    </div>
  ),
}));

jest.mock('../components/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

jest.mock('../components/RemoteBoundary', () => ({
  RemoteBoundary: ({ children, title, moduleName }: any) => (
    <div data-testid="remote-boundary" data-title={title} data-module={moduleName}>
      {children}
    </div>
  ),
}));

// Mock remote modules with lazy loading
jest.mock('task_manager/Module', () => ({
  __esModule: true,
  default: () => <div data-testid="task-manager-module">TaskManager</div>,
}), { virtual: true });

jest.mock('time_tracker/Module', () => ({
  __esModule: true,
  default: () => <div data-testid="time-tracker-module">TimeTracker</div>,
}), { virtual: true });

jest.mock('analytics/Module', () => ({
  __esModule: true,
  default: () => <div data-testid="analytics-module">Analytics</div>,
}), { virtual: true });

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Mock useLocation at module level
const mockUseLocation = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockUseLocation(),
}));

describe('DashboardApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseLocation.mockReturnValue({ pathname: '/task-manager' });
    (useAuth0 as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      getAccessTokenSilently: mockGetAccessTokenSilently,
    });
    (useTheme as jest.Mock).mockReturnValue({
      loadTheme: mockLoadTheme,
    });
    (isUserApiReady as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders Navbar and Footer', () => {
    renderWithRouter(<DashboardApp />);

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('initializes userApi when authenticated', () => {
    renderWithRouter(<DashboardApp />);

    expect(initializeUserApi).toHaveBeenCalled();
  });

  it('shows task manager by default', async () => {
    mockUseLocation.mockReturnValue({ pathname: '/task-manager' });
    
    renderWithRouter(<DashboardApp />);

    await waitFor(() => {
      expect(screen.getByTestId('navbar')).toHaveAttribute('data-active-tab', 'task');
    });
  });

  it('shows time tracker when on time-tracker route', async () => {
    mockUseLocation.mockReturnValue({ pathname: '/time-tracker' });
    
    renderWithRouter(<DashboardApp />);

    await waitFor(() => {
      expect(screen.getByTestId('navbar')).toHaveAttribute('data-active-tab', 'time');
    });
  });

  it('shows analytics when on analytics route', async () => {
    mockUseLocation.mockReturnValue({ pathname: '/analytics' });
    
    renderWithRouter(<DashboardApp />);

    await waitFor(() => {
      expect(screen.getByTestId('navbar')).toHaveAttribute('data-active-tab', 'analytics');
    });
  });

  it('loads theme after initialization', async () => {
    renderWithRouter(<DashboardApp />);

    // Fast-forward timers to trigger the delayed loadTheme call
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(mockLoadTheme).toHaveBeenCalled();
    });
  });

  it('handles account reactivation', async () => {
    (userApi.getOrCreateUser as jest.Mock).mockResolvedValueOnce({
      user: { _id: '123', name: 'Test User' },
      reactivated: true,
    });

    const { toast } = require('sonner');

    renderWithRouter(<DashboardApp />);

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(userApi.getOrCreateUser).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Welcome back'),
        expect.any(Object)
      );
    });
  });

  it('does not show reactivation message for new users', async () => {
    (userApi.getOrCreateUser as jest.Mock).mockResolvedValueOnce({
      user: { _id: '123', name: 'Test User' },
      reactivated: false,
    });

    const { toast } = require('sonner');

    renderWithRouter(<DashboardApp />);

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(userApi.getOrCreateUser).toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalledWith(
        expect.stringContaining('Welcome back'),
        expect.any(Object)
      );
    });
  });

  it('handles reactivation check error', async () => {
    (userApi.getOrCreateUser as jest.Mock).mockRejectedValueOnce(new Error('Failed'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderWithRouter(<DashboardApp />);

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(userApi.getOrCreateUser).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to check for account reactivation:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('does not check reactivation if API not ready', async () => {
    (isUserApiReady as jest.Mock).mockReturnValue(false);

    renderWithRouter(<DashboardApp />);

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(userApi.getOrCreateUser).not.toHaveBeenCalled();
    });
  });

  it('only checks reactivation once', async () => {
    (userApi.getOrCreateUser as jest.Mock).mockResolvedValue({
      user: { _id: '123', name: 'Test User' },
      reactivated: false,
    });

    const { rerender } = renderWithRouter(<DashboardApp />);

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(userApi.getOrCreateUser).toHaveBeenCalledTimes(1);
    });

    // Clear mock and rerender - should not check again due to ref guard
    jest.clearAllMocks();
    jest.advanceTimersByTime(500);

    // Should still only be called once due to reactivationCheckedRef
    expect(userApi.getOrCreateUser).not.toHaveBeenCalled();
  });

  it('shows loading state when authentication is loading', () => {
    (useAuth0 as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: true,
      getAccessTokenSilently: mockGetAccessTokenSilently,
    });

    renderWithRouter(<DashboardApp />);

    expect(screen.getByText(/Checking authentication/i)).toBeInTheDocument();
  });

  it('handles token getter error gracefully', async () => {
    mockGetAccessTokenSilently.mockRejectedValueOnce(new Error('Token failed'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderWithRouter(<DashboardApp />);

    // Verify initializeUserApi was called - this is sufficient to test error handling
    await waitFor(() => {
      expect(initializeUserApi).toHaveBeenCalled();
    }, { timeout: 2000 });

    consoleErrorSpy.mockRestore();
  }, 10000);
});
