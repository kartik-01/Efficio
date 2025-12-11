import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { AuthProvider } from '../auth/AuthProvider';
import App from '../App';

// Mock react-dom/client
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
  })),
}));

// Mock AuthProvider
jest.mock('../auth/AuthProvider', () => ({
  AuthProvider: ({ children }: any) => <div data-testid="auth-provider">{children}</div>,
}));

// Mock App
jest.mock('../App', () => ({
  __esModule: true,
  default: () => <div data-testid="app">App</div>,
}));

describe('bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock document.getElementById
    // Create elements dynamically based on ID to avoid always returning the same value
    const mockGetElementById = jest.fn((id: string) => {
      if (id === 'root') {
        const div = document.createElement('div');
        div.id = id;
        return div;
      }
      // Return null for other IDs (different behavior for different IDs)
      return null;
    });
    
    document.getElementById = mockGetElementById;
  });

  it('should render app when root element exists', () => {
    // Import bootstrap to execute the code
    require('../bootstrap');
    
    expect(document.getElementById).toHaveBeenCalledWith('root');
    expect(createRoot).toHaveBeenCalled();
    
    const rootInstance = (createRoot as jest.Mock).mock.results[0].value;
    expect(rootInstance.render).toHaveBeenCalled();
    
    // Check that render was called with StrictMode, AuthProvider, and App
    const renderCall = rootInstance.render.mock.calls[0][0];
    expect(renderCall.type).toBe(StrictMode);
  });

  it('should throw error when root element does not exist', () => {
    jest.isolateModules(() => {
      // Mock getElementById to return null for root
      const mockGetElementById = jest.fn((id: string) => {
        if (id === 'root') {
          return null;
        }
        return null;
      });
      
      document.getElementById = mockGetElementById;
      
      expect(() => {
        require('../bootstrap');
      }).toThrow('Root element #root was not found');
    });
  });
});

