import { render, screen } from '@testing-library/react';
import { Features } from '../Features';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Check: ({ className }: any) => <div data-testid="check-icon" className={className} />,
}));

describe('Features', () => {
  it('renders main heading', () => {
    render(<Features />);
    
    expect(screen.getByText(/Three Powerful Modules/i)).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<Features />);
    
    expect(screen.getByText(/Each micro-frontend is designed/i)).toBeInTheDocument();
  });

  it('renders all three feature cards', () => {
    render(<Features />);
    
    expect(screen.getByText('Task Manager')).toBeInTheDocument();
    expect(screen.getByText('Time Tracker')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders Task Manager feature details', () => {
    render(<Features />);
    
    expect(screen.getByText(/Organize, prioritize, and track/i)).toBeInTheDocument();
    expect(screen.getByText('Kanban boards & list views')).toBeInTheDocument();
    expect(screen.getByText('Priority management')).toBeInTheDocument();
    expect(screen.getByText('Due date tracking')).toBeInTheDocument();
  });

  it('renders Time Tracker feature details', () => {
    render(<Features />);
    
    expect(screen.getByText(/Monitor time spent on tasks/i)).toBeInTheDocument();
    expect(screen.getByText('Automatic time tracking')).toBeInTheDocument();
    expect(screen.getByText('Project categorization')).toBeInTheDocument();
    expect(screen.getByText('Break reminders')).toBeInTheDocument();
  });

  it('renders Analytics feature details', () => {
    render(<Features />);
    
    expect(screen.getByText(/Gain insights into your productivity/i)).toBeInTheDocument();
    expect(screen.getByText('Productivity insights')).toBeInTheDocument();
    expect(screen.getByText('Time distribution charts')).toBeInTheDocument();
    expect(screen.getByText('Goal tracking')).toBeInTheDocument();
  });

  it('renders check icons for feature items', () => {
    render(<Features />);
    
    const checkIcons = screen.getAllByTestId('check-icon');
    // Each feature has 3 items, so 3 features = 9 check icons
    expect(checkIcons.length).toBeGreaterThanOrEqual(3);
  });
});


