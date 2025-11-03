import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CTASection } from '../CTASection';

// Mock @efficio/ui
jest.mock('@efficio/ui', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

describe('CTASection', () => {
  it('renders heading correctly', () => {
    render(<CTASection />);
    
    expect(screen.getByText(/Ready to Transform Your Productivity/i)).toBeInTheDocument();
  });

  it('renders description correctly', () => {
    render(<CTASection />);
    
    expect(screen.getByText(/Join thousands of professionals/i)).toBeInTheDocument();
  });

  it('renders Start Your Free Trial button', () => {
    render(<CTASection />);
    
    const button = screen.getByRole('button', { name: /Start Your Free Trial/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onGetStarted when button is clicked', async () => {
    const mockOnGetStarted = jest.fn();
    render(<CTASection onGetStarted={mockOnGetStarted} />);
    
    const button = screen.getByRole('button', { name: /Start Your Free Trial/i });
    await userEvent.click(button);
    
    expect(mockOnGetStarted).toHaveBeenCalledTimes(1);
  });

  it('does not throw error when button is clicked without callback', async () => {
    render(<CTASection />);
    
    const button = screen.getByRole('button', { name: /Start Your Free Trial/i });
    await userEvent.click(button);
    
    // Should not throw
    expect(button).toBeInTheDocument();
  });
});



