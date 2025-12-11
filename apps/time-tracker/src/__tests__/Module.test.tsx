// Mock Auth0 before any imports that might use it
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn().mockReturnValue({
    getAccessTokenSilently: jest.fn().mockResolvedValue('mock-token'),
    user: { sub: 'user123' },
  }),
}));

import TimeTrackerModule from '../Module';
import { TimeTrackerApp } from '../RemoteApp';

describe('Module', () => {
  it('exports TimeTrackerApp as default', () => {
    expect(TimeTrackerModule).toBe(TimeTrackerApp);
  });
});
