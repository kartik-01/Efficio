import { render, screen } from '@testing-library/react';
import { AnalyticsApp } from '../RemoteApp';

// Mock ExecutiveSummary
jest.mock('../pages/ExecutiveSummary', () => ({
  ExecutiveSummary: ({ getAccessToken }: { getAccessToken?: () => Promise<string | undefined> }) => (
    <div data-testid="executive-summary">
      Executive Summary
      {getAccessToken && <span data-testid="has-access-token">Has Access Token</span>}
    </div>
  ),
}));

describe('AnalyticsApp', () => {
  it('renders the analytics dashboard header', () => {
    render(<AnalyticsApp />);
    
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Track your productivity across all your projects and tasks/i)).toBeInTheDocument();
  });

  it('renders ExecutiveSummary component', () => {
    render(<AnalyticsApp />);
    
    expect(screen.getByTestId('executive-summary')).toBeInTheDocument();
  });

  it('passes getAccessToken prop to ExecutiveSummary when provided', () => {
    const mockGetAccessToken = jest.fn().mockResolvedValue('mock-token');
    
    render(<AnalyticsApp getAccessToken={mockGetAccessToken} />);
    
    expect(screen.getByTestId('has-access-token')).toBeInTheDocument();
  });

  it('does not pass getAccessToken to ExecutiveSummary when not provided', () => {
    render(<AnalyticsApp />);
    
    expect(screen.queryByTestId('has-access-token')).not.toBeInTheDocument();
  });

  it('has correct CSS classes for layout', () => {
    const { container } = render(<AnalyticsApp />);
    const mainDiv = container.firstChild as HTMLElement;
    
    expect(mainDiv).toHaveClass('flex', 'flex-col', 'gap-6');
  });
});

