import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Home } from '../Home';

// Mock @efficio/ui
jest.mock('@efficio/ui', () => ({
  Button: ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return <div>{children}</div>;
    }
    return <button {...props}>{children}</button>;
  },
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
  CardDescription: ({ children, className }: any) => <p className={className}>{children}</p>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardFooter: ({ children }: any) => <div>{children}</div>,
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  ArrowRight: () => <div data-testid="arrow-icon" />,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Home', () => {
  it('renders welcome card with title', () => {
    renderWithRouter(<Home />);
    
    expect(screen.getByText(/Welcome to Efficio Workspace/i)).toBeInTheDocument();
  });

  it('renders welcome description', () => {
    renderWithRouter(<Home />);
    
    expect(screen.getByText(/Your unified shell aggregates/i)).toBeInTheDocument();
  });

  it('renders all three module cards', () => {
    renderWithRouter(<Home />);
    
    expect(screen.getByText('Task Manager')).toBeInTheDocument();
    expect(screen.getByText('Time Tracker')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders module descriptions', () => {
    renderWithRouter(<Home />);
    
    expect(screen.getByText(/Plan, prioritise, and track team workstreams/i)).toBeInTheDocument();
    expect(screen.getByText(/Keep accurate logs/i)).toBeInTheDocument();
    expect(screen.getByText(/Insights and dashboards/i)).toBeInTheDocument();
  });

  it('renders navigation links for modules', () => {
    renderWithRouter(<Home />);
    
    const taskManagerLink = screen.getByRole('link', { name: /Go to Task Manager/i });
    expect(taskManagerLink).toHaveAttribute('href', '/tasks');
    
    const analyticsLink = screen.getByRole('link', { name: /View Analytics/i });
    expect(analyticsLink).toHaveAttribute('href', '/analytics');
  });

  it('renders Open module buttons for each module', () => {
    renderWithRouter(<Home />);
    
    const openButtons = screen.getAllByText(/Open module/i);
    expect(openButtons).toHaveLength(3);
  });
});

