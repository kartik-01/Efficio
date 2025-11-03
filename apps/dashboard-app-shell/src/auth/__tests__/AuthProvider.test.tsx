import { render } from '@testing-library/react';
import { AuthProvider } from '../AuthProvider';
import { Auth0Provider } from '@auth0/auth0-react';

// Mock @auth0/auth0-react
jest.mock('@auth0/auth0-react', () => ({
  Auth0Provider: ({ children, ...props }: any) => (
    <div data-testid="auth0-provider" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
}));

describe('AuthProvider', () => {
  beforeEach(() => {
    // Mock window.location.origin
    delete (window as any).location;
    (window as any).location = {
      origin: 'http://localhost:3000',
    };
  });

  it('renders Auth0Provider with correct domain and clientId', () => {
    const { container } = render(
      <AuthProvider>
        <div>Test Child</div>
      </AuthProvider>
    );

    const provider = container.querySelector('[data-testid="auth0-provider"]');
    expect(provider).toBeInTheDocument();
    
    const props = JSON.parse(provider?.getAttribute('data-props') || '{}');
    expect(props.domain).toBe('dev-dkdxpljfvflt1jgs.us.auth0.com');
    expect(props.clientId).toBe('lzbVOYeSERkab4468jFAYWUABT4VvjwM');
  });

  it('renders children', () => {
    const { getByText } = render(
      <AuthProvider>
        <div>Test Child</div>
      </AuthProvider>
    );

    expect(getByText('Test Child')).toBeInTheDocument();
  });

  it('sets redirect_uri to current origin', () => {
    const { container } = render(
      <AuthProvider>
        <div>Test</div>
      </AuthProvider>
    );

    const provider = container.querySelector('[data-testid="auth0-provider"]');
    const props = JSON.parse(provider?.getAttribute('data-props') || '{}');
    // window.location.origin can vary in test environment
    expect(props.authorizationParams.redirect_uri).toBeDefined();
    expect(props.authorizationParams.redirect_uri).toBe(window.location.origin);
  });

  it('uses localStorage for cache', () => {
    const { container } = render(
      <AuthProvider>
        <div>Test</div>
      </AuthProvider>
    );

    const provider = container.querySelector('[data-testid="auth0-provider"]');
    const props = JSON.parse(provider?.getAttribute('data-props') || '{}');
    expect(props.cacheLocation).toBe('localstorage');
  });
});

