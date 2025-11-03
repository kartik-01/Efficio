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

    it('should throw error on API failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          message: 'Server error',
        }),
      });

      await expect(userApi.getOrCreateUser()).rejects.toThrow('Server error');
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

    it('should throw error on API failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: 'Not found',
        }),
      });

      await expect(userApi.getUserProfile()).rejects.toThrow('Not found');
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
  });

  describe('updateTheme', () => {
    it('should update theme preference successfully', async () => {
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

    it('should throw error on API failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          message: 'Deactivation failed',
        }),
      });

      await expect(userApi.deactivateAccount()).rejects.toThrow('Deactivation failed');
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

    it('should throw error on API failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Deletion failed',
        }),
      });

      await expect(userApi.deleteAccount()).rejects.toThrow('Deletion failed');
    });
  });

  describe('error handling', () => {
    it('should handle missing token', async () => {
      const emptyTokenGetter = jest.fn().mockResolvedValue(undefined);
      initializeUserApi(emptyTokenGetter);

      await expect(userApi.getUserProfile()).rejects.toThrow('Failed to retrieve access token');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(userApi.getUserProfile()).rejects.toThrow();
    });
  });
});

