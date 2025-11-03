import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotFound } from '../NotFound';

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
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardFooter: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('NotFound', () => {
  beforeEach(() => {
    renderWithRouter(<NotFound />);
  });

  it('renders page content and navigation', () => {
    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.getByText(/The view you were looking for cannot be reached/i)).toBeInTheDocument();
    expect(screen.getByText(/If you believe this is a mistake/i)).toBeInTheDocument();
    
    const link = screen.getByRole('link', { name: /Return home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});



