import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { useAuth0 } from '@auth0/auth0-react';
import { userApi } from '../../services/userApi';
import { notificationApi } from '../../services/notificationApi';

// Mock @auth0/auth0-react
const mockLoginWithRedirect = jest.fn();
const mockLogout = jest.fn();
const mockGetAccessTokenSilently = jest.fn().mockResolvedValue('mock-token');

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn(),
}));

// Mock services
jest.mock('../../services/userApi', () => ({
  userApi: {
    getUserProfile: jest.fn(),
  },
  initializeUserApi: jest.fn(),
  isUserApiReady: jest.fn(() => true),
}));

jest.mock('../../services/notificationApi', () => ({
  notificationApi: {
    getNotifications: jest.fn(),
  },
  initializeNotificationApi: jest.fn(),
  isNotificationApiReady: jest.fn(() => true),
}));

// Mock all UI and icon components
jest.mock('@efficio/ui', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
  ScrollArea: ({ children }: any) => <div>{children}</div>,
  Sheet: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetTrigger: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('lucide-react', () => ({
  LogOut: () => null,
  Settings: () => null,
  User: () => null,
  Menu: () => null,
  Bell: () => null,
  Activity: () => null,
}));

jest.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: any) => <div>{children}</div>,
  Trigger: ({ children }: any) => <div>{children}</div>,
  Content: ({ children }: any) => <div>{children}</div>,
  Item: ({ children }: any) => <div>{children}</div>,
  Separator: () => null,
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('../ProfileModal', () => ({
  ProfileModal: () => null,
}));

jest.mock('../SettingsModal', () => ({
  SettingsModal: () => null,
}));

const mockNavigate = jest.fn();
const mockUseLocation = jest.fn(() => ({ pathname: '/task-manager' }));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockUseLocation.mockReturnValue({ pathname: '/task-manager' });
    
    (useAuth0 as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { name: 'Test User', email: 'test@example.com' },
      loginWithRedirect: mockLoginWithRedirect,
      logout: mockLogout,
      getAccessTokenSilently: mockGetAccessTokenSilently,
    });

    (userApi.getUserProfile as jest.Mock).mockResolvedValue({
      _id: '123',
      name: 'Test User',
      email: 'test@example.com',
    });

    (notificationApi.getNotifications as jest.Mock).mockResolvedValue({
      notifications: [],
      totalUnreadCount: 0,
    });
  });

  it('renders when authenticated', () => {
    renderWithRouter(<Navbar />);
    
    expect(screen.getByText(/Efficio/i)).toBeInTheDocument();
  });

  it('shows login button when not authenticated', () => {
    (useAuth0 as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loginWithRedirect: mockLoginWithRedirect,
    });

    renderWithRouter(<Navbar />);
    
    const loginButton = screen.getByRole('button', { name: /Log In/i });
    expect(loginButton).toBeInTheDocument();
  });

  it('calls loginWithRedirect when login button clicked', async () => {
    (useAuth0 as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loginWithRedirect: mockLoginWithRedirect,
    });

    renderWithRouter(<Navbar />);
    
    const loginButton = await screen.findByRole('button', { name: /Log In/i });
    await userEvent.click(loginButton);
    
    expect(mockLoginWithRedirect).toHaveBeenCalled();
  });

  it('renders navigation tabs when authenticated', () => {
    renderWithRouter(<Navbar activeTab="task" />);
    
    expect(screen.getByText(/Task Manager/i)).toBeInTheDocument();
    expect(screen.getByText(/Time Tracker/i)).toBeInTheDocument();
    expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
  });

  it('calls navigate when tab is clicked', async () => {
    renderWithRouter(<Navbar activeTab="task" onTabChange={jest.fn()} />);
    
    const timeTab = screen.getByText(/Time Tracker/i).closest('button') || screen.getByText(/Time Tracker/i);
    if (timeTab) {
      await userEvent.click(timeTab as HTMLElement);
      // Navigation should be called
      expect(mockNavigate).toHaveBeenCalled();
    }
  });
});
