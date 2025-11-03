import { screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { Home } from '../Home';

// Mock @efficio/ui
jest.mock('@efficio/ui', () => require('../../components/__tests__/mocks.tsx').efficioUIMocks);

// Mock lucide-react
jest.mock('lucide-react', () => ({
  ArrowRight: () => <div data-testid="arrow-icon" />,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Home', () => {
  beforeEach(() => {
    renderWithRouter(<Home />);
  });

  it('renders welcome card with title and description', () => {
    expect(screen.getByText(/Welcome to Efficio Workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/Your unified shell aggregates/i)).toBeInTheDocument();
  });

  it('renders all three module cards with descriptions', () => {
    expect(screen.getByText('Task Manager')).toBeInTheDocument();
    expect(screen.getByText('Time Tracker')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText(/Plan, prioritise, and track team workstreams/i)).toBeInTheDocument();
    expect(screen.getByText(/Keep accurate logs/i)).toBeInTheDocument();
    expect(screen.getByText(/Insights and dashboards/i)).toBeInTheDocument();
  });

  it('renders navigation links and buttons for modules', () => {
    const taskManagerLink = screen.getByRole('link', { name: /Go to Task Manager/i });
    expect(taskManagerLink).toHaveAttribute('href', '/tasks');
    
    const analyticsLink = screen.getByRole('link', { name: /View Analytics/i });
    expect(analyticsLink).toHaveAttribute('href', '/analytics');
    
    const openButtons = screen.getAllByText(/Open module/i);
    expect(openButtons).toHaveLength(3);
  });
});

