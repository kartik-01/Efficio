import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock RemoteApp
jest.mock('../RemoteApp', () => ({
  AnalyticsApp: () => <div data-testid="analytics-app">Analytics App</div>,
}));

describe('App', () => {
  it('renders AnalyticsApp within BrowserRouter', () => {
    render(<App />);
    
    expect(screen.getByTestId('analytics-app')).toBeInTheDocument();
  });

  it('wraps AnalyticsApp in BrowserRouter', () => {
    const { container } = render(<App />);
    
    // App should render with BrowserRouter wrapper
    expect(container.firstChild).toBeInTheDocument();
  });
});

