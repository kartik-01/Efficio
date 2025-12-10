import { render } from '@testing-library/react';
import App from '../App';

// Mock the RemoteApp module
jest.mock('../RemoteApp', () => ({
  TimeTrackerApp: () => <div data-testid="time-tracker-app">Time Tracker</div>,
}));

// Mock BrowserRouter
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });

  it('renders TimeTrackerApp component', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('time-tracker-app')).toBeInTheDocument();
  });
});

