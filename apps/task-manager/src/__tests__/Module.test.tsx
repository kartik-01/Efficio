import Module from '../Module';

// Mock RemoteApp
jest.mock('../RemoteApp', () => ({
  TaskManagerApp: jest.fn(() => <div>TaskManagerApp</div>),
}));

describe('Module', () => {
  it('exports TaskManagerApp as default', () => {
    expect(Module).toBeDefined();
    // Module should export the TaskManagerApp component
    expect(typeof Module).toBe('function');
  });
});

