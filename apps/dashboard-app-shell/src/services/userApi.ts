import { API_BASE_URL, getHeaders, initializeApi, isApiReady } from './apiBase';

// Re-export for backward compatibility
export const initializeUserApi = initializeApi;
export const isUserApiReady = isApiReady;

export interface UserProfile {
  _id: string;
  auth0Id: string;
  email?: string;
  name?: string;
  picture?: string;
  customPicture?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    notifications?: boolean;
  };
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const userApi = {
  // Get or create user (used on login, returns reactivated flag)
  async getOrCreateUser(): Promise<{ user: UserProfile; reactivated: boolean }> {
    const headers = await getHeaders();
    
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || `Failed to get or create user: ${response.status}`);
    }
    
    return {
      user: result.data,
      reactivated: result.reactivated || false,
    };
  },

  // Get user profile
  async getUserProfile(): Promise<UserProfile> {
    const headers = await getHeaders();
    
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || `Failed to fetch user profile: ${response.status}`);
    }
    
    return result.data;
  },

  // Update user name
  async updateUserName(name: string): Promise<UserProfile> {
    const headers = await getHeaders();
    
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || `Failed to update user name: ${response.status}`);
    }
    
    return result.data;
  },

  // Upload profile picture
  async uploadProfilePicture(imageBase64: string): Promise<{ customPicture: string }> {
    const headers = await getHeaders();
    
    const response = await fetch(`${API_BASE_URL}/users/profile/picture`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ imageBase64 }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || `Failed to upload profile picture: ${response.status}`);
    }
    
    return result.data;
  },

  // Update theme preference
  async updateTheme(theme: 'light' | 'dark' | 'auto'): Promise<UserProfile> {
    const headers = await getHeaders();
    
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ preferences: { theme } }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || `Failed to update theme: ${response.status}`);
    }
    
    return result.data;
  },

  // Deactivate account (keep data)
  async deactivateAccount(): Promise<void> {
    const headers = await getHeaders();
    
    const response = await fetch(`${API_BASE_URL}/users/deactivate`, {
      method: 'POST',
      headers,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || `Failed to deactivate account: ${response.status}`);
    }
  },

  // Delete account (permanently delete user and their tasks)
  async deleteAccount(): Promise<void> {
    const headers = await getHeaders();
    
    const response = await fetch(`${API_BASE_URL}/users/account`, {
      method: 'DELETE',
      headers,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || `Failed to delete account: ${response.status}`);
    }
  },
};
