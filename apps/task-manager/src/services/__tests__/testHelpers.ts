/**
 * Shared test utilities for task-manager API service tests
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
 * Sets up common beforeEach for API tests
 */
export const setupApiTest = (initializeFn: (tokenGetter: () => Promise<string | undefined>) => void) => {
  const mockTokenGetter = jest.fn().mockResolvedValue('mock-token');
  
  beforeEach(() => {
    jest.clearAllMocks();
    initializeFn(mockTokenGetter);
    (global.fetch as jest.Mock).mockClear();
  });
  
  return mockTokenGetter;
};

