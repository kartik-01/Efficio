import { render, screen, waitFor } from '@testing-library/react';
import { TimeTrackerApp } from '../RemoteApp';
import { useAuth0 } from '@auth0/auth0-react';
import { initializeApi, isApiReady } from '@efficio/api';

// Mock Auth0
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn(),
}));

// Mock TodayView component
jest.mock('../components/TodayView', () => ({
  TodayView: () => <div data-testid="today-view">Today View</div>,
}));

// Mock API services
jest.mock('@efficio/api', () => ({
  initializeApi: jest.fn(),
  isApiReady: jest.fn(),
}));

jest.mock('../services/taskApi', () => ({
  isTaskApiReady: jest.fn().mockReturnValue(true),
}));

jest.mock('../services/timeApi', () => ({
  isTimeApiReady: jest.fn().mockReturnValue(true),
}));

describe('TimeTrackerApp', () => {
  const mockGetAccessTokenSilently = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (isApiReady as jest.Mock).mockReturnValue(true);
    
    (useAuth0 as jest.Mock).mockReturnValue({
      getAccessTokenSilently: mockGetAccessTokenSilently,
      user: { sub: 'user123' },
    });
    
    mockGetAccessTokenSilently.mockResolvedValue('mock-token');
  });

  it('renders TodayView when API is ready', async () => {
    render(<TimeTrackerApp />);
    
    await waitFor(() => {
      expect(screen.getByTestId('today-view')).toBeInTheDocument();
    });
  });

  it('shows loading state when API is not ready', () => {
    (isApiReady as jest.Mock).mockReturnValue(false);
    
    render(<TimeTrackerApp />);
    
    expect(screen.getByText('Initializing...')).toBeInTheDocument();
    expect(screen.queryByTestId('today-view')).not.toBeInTheDocument();
  });

  it('initializes API with token getter from Auth0 hook', async () => {
    render(<TimeTrackerApp />);
    
    await waitFor(() => {
      expect(initializeApi).toHaveBeenCalled();
    });
    
    // Verify token getter function is passed
    const apiInit = (initializeApi as jest.Mock).mock.calls[0][0];
    expect(typeof apiInit).toBe('function');
  });

  it('uses prop token getter when provided', async () => {
    const propTokenGetter = jest.fn().mockResolvedValue('prop-token');
    
    render(<TimeTrackerApp getAccessToken={propTokenGetter} />);
    
    await waitFor(() => {
      expect(initializeApi).toHaveBeenCalled();
    });
    
    // Verify the prop token getter is used instead of Auth0 hook
    const apiInit = (initializeApi as jest.Mock).mock.calls[0][0];
    const token = await apiInit();
    expect(token).toBe('prop-token');
    expect(propTokenGetter).toHaveBeenCalled();
    expect(mockGetAccessTokenSilently).not.toHaveBeenCalled();
  });

  it('handles token getter errors gracefully', async () => {
    mockGetAccessTokenSilently.mockRejectedValue(new Error('Token error'));
    
    render(<TimeTrackerApp />);
    
    await waitFor(() => {
      expect(initializeApi).toHaveBeenCalled();
    });
    
    // Token getter should handle errors
    const apiInit = (initializeApi as jest.Mock).mock.calls[0][0];
    const token = await apiInit();
    expect(token).toBeUndefined();
  });

  it('re-initializes API when prop token getter changes', async () => {
    const tokenGetter1 = jest.fn().mockResolvedValue('token1');
    const { rerender } = render(<TimeTrackerApp getAccessToken={tokenGetter1} />);
    
    await waitFor(() => {
      expect(initializeApi).toHaveBeenCalledTimes(1);
    });
    
    const tokenGetter2 = jest.fn().mockResolvedValue('token2');
    rerender(<TimeTrackerApp getAccessToken={tokenGetter2} />);
    
    await waitFor(() => {
      expect(initializeApi).toHaveBeenCalledTimes(2);
    });
  });
});

