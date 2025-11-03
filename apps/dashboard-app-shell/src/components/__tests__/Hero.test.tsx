import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hero } from '../Hero';

// Mock @efficio/ui
jest.mock('@efficio/ui', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

describe('Hero', () => {
  it('renders heading correctly', () => {
    render(<Hero />);
    
    expect(screen.getByText(/Organize Your/i)).toBeInTheDocument();
    expect(screen.getByText(/Productivity/i)).toBeInTheDocument();
    expect(screen.getByText(/Like Never Before/i)).toBeInTheDocument();
  });

  it('renders description correctly', () => {
    render(<Hero />);
    
    expect(screen.getByText(/Efficio combines task management/i)).toBeInTheDocument();
  });

  it('renders Get Started button', () => {
    render(<Hero />);
    
    const button = screen.getByRole('button', { name: /Get Started Free/i });
    expect(button).toBeInTheDocument();
  });

  it('renders Watch Demo button', () => {
    render(<Hero />);
    
    const button = screen.getByRole('button', { name: /Watch Demo/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onGetStarted when Get Started button is clicked', async () => {
    const mockOnGetStarted = jest.fn();
    render(<Hero onGetStarted={mockOnGetStarted} />);
    
    const button = screen.getByRole('button', { name: /Get Started Free/i });
    await userEvent.click(button);
    
    expect(mockOnGetStarted).toHaveBeenCalledTimes(1);
  });

  it('does not throw error when Get Started is clicked without callback', async () => {
    render(<Hero />);
    
    const button = screen.getByRole('button', { name: /Get Started Free/i });
    await userEvent.click(button);
    
    // Should not throw
    expect(button).toBeInTheDocument();
  });
});

