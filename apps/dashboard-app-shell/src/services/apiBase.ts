// Shared API base functionality for dashboard-app-shell
// This consolidates duplicate code from userApi.ts and notificationApi.ts

// API base URL - injected by webpack DefinePlugin at build time
declare const process: {
  env: {
    API_BASE_URL?: string;
  };
};

export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';

// Shared token getter function - initialized once for all services
let getAccessToken: (() => Promise<string | undefined>) | null = null;
let isInitialized = false;

// Initialize API with Auth0 token getter (shared across all services)
export const initializeApi = (tokenGetter: () => Promise<string | undefined>) => {
  getAccessToken = tokenGetter;
  isInitialized = true;
};

// Check if API is ready
export const isApiReady = () => isInitialized && getAccessToken !== null;

// Helper function to get headers with authorization
export const getHeaders = async (): Promise<HeadersInit> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (!getAccessToken) {
    throw new Error('Authentication not initialized. Please refresh the page.');
  }

  try {
    const token = await getAccessToken();
    if (token && token.trim()) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      throw new Error('Failed to retrieve access token. Please login again.');
    }
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw error;
  }

  return headers;
};

// Helper to handle API responses
export const handleResponse = async <T>(response: Response): Promise<T> => {
  const result = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new Error(result.message || result.error || `API request failed: ${response.status}`);
  }

  // Extract data from response if it's wrapped
  const data = result.data !== undefined ? result.data : result;
  return data;
};

