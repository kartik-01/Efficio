import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotFound } from '../NotFound';

// Mock @efficio/ui
jest.mock('@efficio/ui', () => require('../../components/__tests__/mocks.tsx').efficioUIMocks);

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
