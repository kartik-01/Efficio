import { renderHook, act, waitFor } from '@testing-library/react';
import { useTheme } from '../useTheme';
import { userApi, initializeUserApi, isUserApiReady } from '../../services/userApi';

// Mock userApi
jest.mock('../../services/userApi');

const mockUserApi = userApi as jest.Mocked<typeof userApi>;
const mockInitializeUserApi = initializeUserApi as jest.MockedFunction<typeof initializeUserApi>;
const mockIsUserApiReady = isUserApiReady as jest.MockedFunction<typeof isUserApiReady>;

describe('useTheme', () => {
  const mockTokenGetter = jest.fn().mockResolvedValue('mock-token');
  const mockUserProfile = {
    _id: '123',
    auth0Id: 'auth0|123',
    email: 'test@example.com',
    name: 'Test User',
    preferences: {
      theme: 'dark' as const,
      notifications: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.classList.remove('dark');
    mockIsUserApiReady.mockReturnValue(true);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with light theme by default', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('light');
    expect(result.current.userProfile).toBeNull();
  });

  it('should apply light theme to document', () => {
    renderHook(() => useTheme());

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should apply dark theme to document when theme is dark', async () => {
    mockUserApi.updateTheme.mockResolvedValueOnce({ ...mockUserProfile, preferences: { theme: 'dark' } });
    
    const { result } = renderHook(() => useTheme());

    await act(async () => {
      await result.current.updateTheme('dark');
    });

    await waitFor(() => {
      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('should load theme from user profile', async () => {
    mockUserApi.getUserProfile.mockResolvedValueOnce(mockUserProfile);

    const { result } = renderHook(() => useTheme());

    await act(async () => {
      await result.current.loadTheme();
    });

    await waitFor(() => {
      expect(result.current.userProfile).toEqual(mockUserProfile);
      expect(result.current.theme).toBe('dark');
    });
  });

  it('should update theme and save to profile', async () => {
    const updatedProfile = { ...mockUserProfile, preferences: { theme: 'auto' as const } };
    mockUserApi.updateTheme.mockResolvedValueOnce(updatedProfile);

    const { result } = renderHook(() => useTheme());

    await act(async () => {
      await result.current.updateTheme('auto');
    });

    await waitFor(() => {
      expect(result.current.theme).toBe('auto');
    });
    expect(mockUserApi.updateTheme).toHaveBeenCalledWith('auto');
  });

  it('should handle auto theme based on time of day', () => {
    const { result } = renderHook(() => useTheme());

    // Test daytime (6 AM - 8 PM)
    jest.setSystemTime(new Date('2025-01-15T12:00:00')); // Noon
    act(() => {
      result.current.applyTheme('auto');
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Test nighttime (after 8 PM)
    jest.setSystemTime(new Date('2025-01-15T21:00:00')); // 9 PM
    act(() => {
      result.current.applyTheme('auto');
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Test early morning (before 6 AM)
    jest.setSystemTime(new Date('2025-01-15T03:00:00')); // 3 AM
    act(() => {
      result.current.applyTheme('auto');
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should set up interval for auto theme updates', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    mockUserApi.updateTheme.mockResolvedValueOnce({ ...mockUserProfile, preferences: { theme: 'auto' } });
    
    const { result } = renderHook(() => useTheme());

    await act(async () => {
      await result.current.updateTheme('auto');
    });

    await waitFor(() => {
      expect(setIntervalSpy).toHaveBeenCalled();
    });
    
    setIntervalSpy.mockRestore();
  });

  it('should not load theme if API is not ready', async () => {
    mockIsUserApiReady.mockReturnValue(false);

    const { result } = renderHook(() => useTheme());

    await act(async () => {
      await result.current.loadTheme();
    });

    expect(mockUserApi.getUserProfile).not.toHaveBeenCalled();
  });

  it('should handle errors when loading theme', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockUserApi.getUserProfile.mockRejectedValueOnce(new Error('Failed to load'));

    const { result } = renderHook(() => useTheme());

    await act(async () => {
      await result.current.loadTheme();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load theme:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('should handle errors when updating theme', async () => {
    mockUserApi.updateTheme.mockRejectedValueOnce(new Error('Update failed'));

    const { result } = renderHook(() => useTheme());

    await act(async () => {
      try {
        await result.current.updateTheme('dark');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Update failed');
      }
    });
  });

  it('should use default light theme when user profile has no theme preference', async () => {
    const profileWithoutTheme = {
      ...mockUserProfile,
      preferences: {},
    };
    mockUserApi.getUserProfile.mockResolvedValueOnce(profileWithoutTheme);

    const { result } = renderHook(() => useTheme());

    await act(async () => {
      await result.current.loadTheme();
    });

    await waitFor(() => {
      expect(result.current.theme).toBe('light');
    });
  });

  it('should prevent multiple simultaneous loadTheme calls', async () => {
    mockUserApi.getUserProfile.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockUserProfile), 100))
    );

    const { result } = renderHook(() => useTheme());

    // Call loadTheme multiple times quickly
    await act(async () => {
      result.current.loadTheme();
      result.current.loadTheme();
      result.current.loadTheme();
    });

    await waitFor(() => {
      expect(mockUserApi.getUserProfile).toHaveBeenCalledTimes(1);
    });
  });
});

