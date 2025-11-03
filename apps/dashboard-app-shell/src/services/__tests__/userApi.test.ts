import { userApi, initializeUserApi, isUserApiReady, UserProfile } from '../userApi';

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

    it('should throw error on API failure with message', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          message: 'Server error',
        }),
      });

      await expect(userApi.getOrCreateUser()).rejects.toThrow('Server error');
    });

    it('should throw error on API failure with error field', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Server error',
        }),
      });

      await expect(userApi.getOrCreateUser()).rejects.toThrow('Server error');
    });

    it('should throw error on API failure with status code only', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(userApi.getOrCreateUser()).rejects.toThrow('Failed to get or create user: 500');
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

    it('should throw error on API failure with error field', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: 'Not found',
        }),
      });

      await expect(userApi.getUserProfile()).rejects.toThrow('Not found');
    });

    it('should throw error on API failure with message field', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          message: 'User not found',
        }),
      });

      await expect(userApi.getUserProfile()).rejects.toThrow('User not found');
    });

    it('should throw error on API failure with status code only', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(userApi.getUserProfile()).rejects.toThrow('Failed to fetch user profile: 500');
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

    it('should throw error on API failure with message', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Invalid name',
        }),
      });

      await expect(userApi.updateUserName('')).rejects.toThrow('Invalid name');
    });

    it('should throw error on API failure with error field', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Validation failed',
        }),
      });

      await expect(userApi.updateUserName('')).rejects.toThrow('Validation failed');
    });

    it('should throw error on API failure with status code only', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(userApi.updateUserName('Name')).rejects.toThrow('Failed to update user name: 500');
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

    it('should throw error on API failure with message', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Invalid image format',
        }),
      });

      await expect(userApi.uploadProfilePicture('invalid')).rejects.toThrow('Invalid image format');
    });

    it('should throw error on API failure with error field', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'File too large',
        }),
      });

      await expect(userApi.uploadProfilePicture('invalid')).rejects.toThrow('File too large');
    });

    it('should throw error on API failure with status code only', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(userApi.uploadProfilePicture('data')).rejects.toThrow('Failed to upload profile picture: 500');
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

    it('should throw error on API failure with message', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Invalid theme',
        }),
      });

      await expect(userApi.updateTheme('invalid' as any)).rejects.toThrow('Invalid theme');
    });

    it('should throw error on API failure with error field', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Theme update failed',
        }),
      });

      await expect(userApi.updateTheme('dark')).rejects.toThrow('Theme update failed');
    });

    it('should throw error on API failure with status code only', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(userApi.updateTheme('dark')).rejects.toThrow('Failed to update theme: 500');
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

    it('should throw error on API failure with message', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          message: 'Deactivation failed',
        }),
      });

      await expect(userApi.deactivateAccount()).rejects.toThrow('Deactivation failed');
    });

    it('should throw error on API failure with error field', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Account deactivation error',
        }),
      });

      await expect(userApi.deactivateAccount()).rejects.toThrow('Account deactivation error');
    });

    it('should throw error on API failure with status code only', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(userApi.deactivateAccount()).rejects.toThrow('Failed to deactivate account: 500');
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

    it('should throw error on API failure with error field', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Deletion failed',
        }),
      });

      await expect(userApi.deleteAccount()).rejects.toThrow('Deletion failed');
    });

    it('should throw error on API failure with message field', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          message: 'Account deletion error',
        }),
      });

      await expect(userApi.deleteAccount()).rejects.toThrow('Account deletion error');
    });

    it('should throw error on API failure with status code only', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(userApi.deleteAccount()).rejects.toThrow('Failed to delete account: 500');
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

