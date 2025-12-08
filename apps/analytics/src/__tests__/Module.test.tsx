import Module from '../Module';
import { AnalyticsApp } from '../RemoteApp';

describe('Module', () => {
  it('exports AnalyticsApp as default', () => {
    // Module should export AnalyticsApp as default
    expect(Module).toBe(AnalyticsApp);
  });

  it('default export is a React component', () => {
    expect(typeof Module).toBe('function');
  });
});

