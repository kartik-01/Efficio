/**
 * Shared test utilities for API service tests
 */

/**
 * Creates a mock error response for fetch API
 */
export const createErrorResponse = (
  status: number,
  errorData: { message?: string; error?: string } | Record<string, never> = {}
): Response => {
  return {
    ok: false,
    status,
    json: async () => errorData,
  } as Response;
};

/**
 * Creates a mock success response for fetch API
 */
export const createSuccessResponse = <T>(data: T): Response => {
  return {
    ok: true,
    json: async () => ({ data }),
  } as Response;
};

/**
 * Test error handling scenarios for API methods
 * Tests all three error variants: message, error field, and status code only
 */
export const testApiErrorHandling = async (
  apiCall: () => Promise<any>,
  errorScenarios: {
    message?: string;
    error?: string;
    statusCodeOnly?: string;
    status?: number;
  }
) => {
  const { message, error, statusCodeOnly, status = 500 } = errorScenarios;

  if (message) {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createErrorResponse(status, { message }));
    await expect(apiCall()).rejects.toThrow(message);
  }

  if (error) {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createErrorResponse(status, { error }));
    await expect(apiCall()).rejects.toThrow(error);
  }

  if (statusCodeOnly) {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createErrorResponse(status, {}));
    await expect(apiCall()).rejects.toThrow(statusCodeOnly);
  }
};

/**
 * Sets up common beforeEach for API tests
 */
export const setupApiTest = (initializeFn: (tokenGetter: () => Promise<string | undefined>) => void) => {
  const mockTokenGetter = jest.fn().mockResolvedValue('mock-token');
  
  beforeEach(() => {
    jest.clearAllMocks();
    initializeFn(mockTokenGetter);
  });
  
  return mockTokenGetter;
};

