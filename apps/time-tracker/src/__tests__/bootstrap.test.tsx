describe('bootstrap', () => {
  beforeEach(() => {
    // Clear all module mocks
    jest.resetModules();
    
    // Mock DOM element
    const mockRoot = document.createElement('div');
    mockRoot.id = 'root';
    document.body.appendChild(mockRoot);
  });

  afterEach(() => {
    // Clean up
    const root = document.getElementById('root');
    if (root) {
      document.body.removeChild(root);
    }
  });

  it('should export mount function', async () => {
    // Mock dependencies
    jest.mock('react-dom/client', () => ({
      createRoot: jest.fn().mockReturnValue({
        render: jest.fn(),
      }),
    }));
    
    jest.mock('@auth0/auth0-react', () => ({
      Auth0Provider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    }));
    
    jest.mock('../App', () => ({
      __esModule: true,
      default: () => <div>App</div>,
    }));

    // Bootstrap module should export mount
    const bootstrap = await import('../bootstrap');
    expect(typeof bootstrap.mount).toBe('function');
  });

  it('should mount app to root element', async () => {
    const mockRender = jest.fn();
    const mockCreateRoot = jest.fn().mockReturnValue({ render: mockRender });
    
    jest.mock('react-dom/client', () => ({
      createRoot: mockCreateRoot,
    }));
    
    jest.mock('@auth0/auth0-react', () => ({
      Auth0Provider: ({ children }: { children: React.ReactNode }) => children,
    }));
    
    jest.mock('../App', () => ({
      __esModule: true,
      default: () => <div>App</div>,
    }));

    const bootstrap = await import('../bootstrap');
    
    const rootElement = document.getElementById('root');
    if (rootElement) {
      bootstrap.mount(rootElement);
      expect(mockCreateRoot).toHaveBeenCalledWith(rootElement);
      expect(mockRender).toHaveBeenCalled();
    }
  });
});

