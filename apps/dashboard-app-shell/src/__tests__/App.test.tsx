import { render, screen, waitFor } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import App from '../App';
import { useAuth0 } from '@auth0/auth0-react';

// Mock @auth0/auth0-react
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn(),
}));

// Mock pages
jest.mock('../pages/HomePage', () => ({
  __esModule: true,
  default: () => <div data-testid="home-page">HomePage</div>,
}));

jest.mock('../DashboardApp', () => ({
  __esModule: true,
  default: () => <div data-testid="dashboard-app">DashboardApp</div>,
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/task-manager' }),
}));

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders loading state when authentication is loading', () => {
    (useAuth0 as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    render(<App />);

    expect(screen.getByText(/Checking authentication/i)).toBeInTheDocument();
  });

  it('renders HomePage when not authenticated', () => {
    (useAuth0 as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(<App />);

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders DashboardApp when authenticated', () => {
    (useAuth0 as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(<App />);

    expect(screen.getByTestId('dashboard-app')).toBeInTheDocument();
  });

  it('redirects to homepage when accessing app routes while not authenticated', async () => {
    const mockLocation = { pathname: '/task-manager' };
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue(mockLocation);

    (useAuth0 as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(<App />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('redirects to task-manager when authenticated and on root path', async () => {
    const mockLocation = { pathname: '/' };
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue(mockLocation);

    (useAuth0 as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(<App />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/task-manager');
    });
  });
});

