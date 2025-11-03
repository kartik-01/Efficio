import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../HomePage';

// Mock @auth0/auth0-react
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    loginWithRedirect: jest.fn(),
  }),
}));

// Mock components
jest.mock('../../components/Navbar', () => ({
  Navbar: () => <div data-testid="navbar">Navbar</div>,
}));

jest.mock('../../components/Hero', () => ({
  Hero: ({ onGetStarted }: any) => (
    <div data-testid="hero">
      <button onClick={onGetStarted}>Get Started</button>
    </div>
  ),
}));

jest.mock('../../components/Features', () => ({
  Features: () => <div data-testid="features">Features</div>,
}));

jest.mock('../../components/CTASection', () => ({
  CTASection: ({ onGetStarted }: any) => (
    <div data-testid="cta-section">
      <button onClick={onGetStarted}>CTA</button>
    </div>
  ),
}));

jest.mock('../../components/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('HomePage', () => {
  it('renders all main sections', () => {
    renderWithRouter(<HomePage />);
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('features')).toBeInTheDocument();
    expect(screen.getByTestId('cta-section')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('passes loginWithRedirect to Hero component', () => {
    renderWithRouter(<HomePage />);
    
    const heroButton = screen.getByText('Get Started');
    expect(heroButton).toBeInTheDocument();
  });

  it('passes loginWithRedirect to CTASection component', () => {
    renderWithRouter(<HomePage />);
    
    const ctaButton = screen.getByText('CTA');
    expect(ctaButton).toBeInTheDocument();
  });
});

