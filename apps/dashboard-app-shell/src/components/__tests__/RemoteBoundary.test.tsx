import { render, screen } from '@testing-library/react';
import { RemoteBoundary } from '../RemoteBoundary';

// Mock the Card components
jest.mock('@efficio/ui', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader">Loading...</div>,
}));

describe('RemoteBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <RemoteBoundary>
        <div>Test Content</div>
      </RemoteBoundary>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('shows skeleton fallback while loading', () => {
    const TestComponent = () => {
      throw new Promise(() => {}); // Simulate Suspense
    };

    render(
      <RemoteBoundary>
        <TestComponent />
      </RemoteBoundary>
    );
    
    // Suspense will show fallback
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('shows failure message when error occurs', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <RemoteBoundary moduleName="test-module">
        <ThrowError />
      </RemoteBoundary>
    );

    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/test-module/i)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('accepts custom title and description props for skeleton', () => {
    const TestComponent = () => {
      throw new Promise(() => {}); // Simulate Suspense
    };

    render(
      <RemoteBoundary title="Custom Title" description="Custom Description">
        <TestComponent />
      </RemoteBoundary>
    );
    
    // These should appear in the skeleton fallback
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Description')).toBeInTheDocument();
  });
});

