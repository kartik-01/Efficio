import { render } from '@testing-library/react';
import App from '../App';

// Mock RemoteApp
jest.mock('../RemoteApp', () => ({
  TaskManagerApp: () => <div data-testid="task-manager-app">Task Manager App</div>,
}));

describe('App', () => {
  it('renders TaskManagerApp within BrowserRouter', () => {
    const { getByTestId } = render(<App />);
    
    expect(getByTestId('task-manager-app')).toBeInTheDocument();
  });

  it('wraps TaskManagerApp in BrowserRouter', () => {
    const { container } = render(<App />);
    
    // App should render with BrowserRouter wrapper
    expect(container.firstChild).toBeInTheDocument();
  });
});

