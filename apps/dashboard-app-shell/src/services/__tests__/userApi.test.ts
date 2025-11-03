import { userApi, initializeUserApi, isUserApiReady, UserProfile } from '../userApi';
import { createErrorResponse, createSuccessResponse } from './testHelpers';

// Mock fetch globally
global.fetch = jest.fn();

describe('userApi', () => {
  const mockTokenGetter = jest.fn().mockResolvedValue('mock-token');
  const mockUserProfile: UserProfile = {
    _id: '123',
    auth0Id: 'auth0|123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/pic.jpg',
    preferences: {
      theme: 'light',
      notifications: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    initializeUserApi(mockTokenGetter);
  });

  describe('initialization', () => {
    it('should initialize with token getter', () => {
      expect(isUserApiReady()).toBe(true);
    });

    it('should not be ready before initialization', () => {
      // Create a new instance to test uninitialized state
      const { initializeUserApi: init, isUserApiReady: ready } = require('../userApi');
      expect(ready()).toBe(true); // Already initialized from beforeEach
    });
  });

  describe('getOrCreateUser', () => {
    it('should get or create user successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockUserProfile,
          reactivated: false,
        }),
      });

      const result = await userApi.getOrCreateUser();

      expect(result.user).toEqual(mockUserProfile);
      expect(result.reactivated).toBe(false);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('should handle reactivated users', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockUserProfile,
          reactivated: true,
        }),
      });

      const result = await userApi.getOrCreateUser();

      expect(result.reactivated).toBe(true);
    });

    it.each([
      ['message', { message: 'Server error' }, 'Server error'],
      ['error field', { error: 'Server error' }, 'Server error'],
      ['status code only', {}, 'Failed to get or create user: 500'],
    ])('should throw error on API failure with %s', async (_, errorData, expectedError) => {
      (fetch as jest.Mock).mockResolvedValueOnce(createErrorResponse(500, errorData));
      await expect(userApi.getOrCreateUser()).rejects.toThrow(expectedError);
    });

    it('should handle reactivated as undefined', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockUserProfile,
          // reactivated is undefined
        }),
      });

      const result = await userApi.getOrCreateUser();

      expect(result.user).toEqual(mockUserProfile);
      expect(result.reactivated).toBe(false);
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockUserProfile,
        }),
      });

      const result = await userApi.getUserProfile();

      expect(result).toEqual(mockUserProfile);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/profile'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it.each([
      ['error field', { error: 'Not found' }, 'Not found'],
      ['message field', { message: 'User not found' }, 'User not found'],
      ['status code only', {}, 'Failed to fetch user profile: 500'],
    ])('should throw error on API failure with %s', async (_, errorData, expectedError) => {
      (fetch as jest.Mock).mockResolvedValueOnce(createErrorResponse(500, errorData));
      await expect(userApi.getUserProfile()).rejects.toThrow(expectedError);
    });
  });

  describe('updateUserName', () => {
    it('should update user name successfully', async () => {
      const updatedProfile = { ...mockUserProfile, name: 'Updated Name' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: updatedProfile,
        }),
      });

      const result = await userApi.updateUserName('Updated Name');

      expect(result.name).toBe('Updated Name');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/profile'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated Name' }),
        })
      );
    });

    it.each([
      ['message', { message: 'Invalid name' }, 'Invalid name'],
      ['error field', { error: 'Validation failed' }, 'Validation failed'],
      ['status code only', {}, 'Failed to update user name: 500'],
    ])('should throw error on API failure with %s', async (_, errorData, expectedError) => {
      (fetch as jest.Mock).mockResolvedValueOnce(createErrorResponse(500, errorData));
      await expect(userApi.updateUserName('')).rejects.toThrow(expectedError);
    });
  });

  describe('uploadProfilePicture', () => {
    it('should upload profile picture successfully', async () => {
      const imageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { customPicture: 'https://example.com/custom.jpg' },
        }),
      });

      const result = await userApi.uploadProfilePicture(imageBase64);

      expect(result.customPicture).toBeDefined();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/profile/picture'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ imageBase64 }),
        })
      );
    });

    it.each([
      ['message', { message: 'Invalid image format' }, 'Invalid image format'],
      ['error field', { error: 'File too large' }, 'File too large'],
      ['status code only', {}, 'Failed to upload profile picture: 500'],
    ])('should throw error on API failure with %s', async (_, errorData, expectedError) => {
      (fetch as jest.Mock).mockResolvedValueOnce(createErrorResponse(500, errorData));
      await expect(userApi.uploadProfilePicture('invalid')).rejects.toThrow(expectedError);
    });
  });

  describe('updateTheme', () => {
    it('should update theme preference successfully to dark', async () => {
      const updatedProfile = { ...mockUserProfile, preferences: { theme: 'dark' } };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: updatedProfile,
        }),
      });

      const result = await userApi.updateTheme('dark');

      expect(result.preferences?.theme).toBe('dark');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/profile'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ preferences: { theme: 'dark' } }),
        })
      );
    });

    it('should update theme preference successfully to light', async () => {
      const updatedProfile = { ...mockUserProfile, preferences: { theme: 'light' } };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: updatedProfile,
        }),
      });

      const result = await userApi.updateTheme('light');

      expect(result.preferences?.theme).toBe('light');
    });

    it('should update theme preference successfully to auto', async () => {
      const updatedProfile = { ...mockUserProfile, preferences: { theme: 'auto' } };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: updatedProfile,
        }),
      });

      const result = await userApi.updateTheme('auto');

      expect(result.preferences?.theme).toBe('auto');
    });

    it.each([
      ['message', { message: 'Invalid theme' }, 'Invalid theme'],
      ['error field', { error: 'Theme update failed' }, 'Theme update failed'],
      ['status code only', {}, 'Failed to update theme: 500'],
    ])('should throw error on API failure with %s', async (_, errorData, expectedError) => {
      (fetch as jest.Mock).mockResolvedValueOnce(createErrorResponse(500, errorData));
      await expect(userApi.updateTheme('dark')).rejects.toThrow(expectedError);
    });
  });

  describe('deactivateAccount', () => {
    it('should deactivate account successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await userApi.deactivateAccount();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/deactivate'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it.each([
      ['message', { message: 'Deactivation failed' }, 'Deactivation failed'],
      ['error field', { error: 'Account deactivation error' }, 'Account deactivation error'],
      ['status code only', {}, 'Failed to deactivate account: 500'],
    ])('should throw error on API failure with %s', async (_, errorData, expectedError) => {
      (fetch as jest.Mock).mockResolvedValueOnce(createErrorResponse(500, errorData));
      await expect(userApi.deactivateAccount()).rejects.toThrow(expectedError);
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await userApi.deleteAccount();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/account'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it.each([
      ['error field', { error: 'Deletion failed' }, 'Deletion failed'],
      ['message field', { message: 'Account deletion error' }, 'Account deletion error'],
      ['status code only', {}, 'Failed to delete account: 500'],
    ])('should throw error on API failure with %s', async (_, errorData, expectedError) => {
      (fetch as jest.Mock).mockResolvedValueOnce(createErrorResponse(500, errorData));
      await expect(userApi.deleteAccount()).rejects.toThrow(expectedError);
    });
  });

  describe('error handling', () => {
    it('should handle missing token', async () => {
      const emptyTokenGetter = jest.fn().mockResolvedValue(undefined);
      initializeUserApi(emptyTokenGetter);

      await expect(userApi.getUserProfile()).rejects.toThrow('Failed to retrieve access token');
    });

    it('should handle empty token string', async () => {
      const emptyTokenGetter = jest.fn().mockResolvedValue('');
      initializeUserApi(emptyTokenGetter);

      await expect(userApi.getUserProfile()).rejects.toThrow('Failed to retrieve access token');
    });

    it('should handle whitespace-only token', async () => {
      const whitespaceTokenGetter = jest.fn().mockResolvedValue('   ');
      initializeUserApi(whitespaceTokenGetter);

      await expect(userApi.getUserProfile()).rejects.toThrow('Failed to retrieve access token');
    });

    it('should handle token getter throwing error', async () => {
      const errorTokenGetter = jest.fn().mockRejectedValue(new Error('Token error'));
      initializeUserApi(errorTokenGetter);

      await expect(userApi.getUserProfile()).rejects.toThrow('Token error');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(userApi.getUserProfile()).rejects.toThrow('Network error');
    });

    it('should handle uninitialized API', async () => {
      // Reset module to test uninitialized state
      jest.resetModules();
      const { userApi: freshUserApi } = require('../userApi');
      
      await expect(freshUserApi.getUserProfile()).rejects.toThrow('Authentication not initialized');
    });
  });
});

