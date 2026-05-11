import { AxiosError } from 'axios';
import { toast } from './toast';

type ErrorCode = string;

interface ErrorContext {
  operation: string;
  page?: string;
}

/**
 * Extracts error message from various error response formats
 */
function extractErrorMessage(error: unknown): {
  statusCode?: number;
  errorCode?: ErrorCode;
  message?: string;
  details?: string[];
} {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Record<string, unknown>;
    const statusCode = error.response?.status;

    // Extract error code (used for mapping to user messages)
    const errorCode = data?.error as ErrorCode | undefined;

    // Extract primary message
    let message = (data?.message as string) || error.message;

    // Extract validation details (array of {msg: string})
    const details: string[] = [];
    if (Array.isArray(data?.details)) {
      details.push(
        ...(data.details as Array<{ msg?: string }>)
          .map((d) => d.msg)
          .filter(Boolean) as string[]
      );
    }

    return { statusCode, errorCode, message, details };
  }

  return {};
}

/**
 * User-friendly error messages for known error codes
 */
const ERROR_CODE_MESSAGES: Record<ErrorCode, string> = {
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password.',
  AUTH_REQUIRED: 'Please sign in to continue.',
  TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',

  // Registration errors
  SLUG_TAKEN: 'That menu URL is already taken — try a different restaurant name.',
  EMAIL_TAKEN: 'An account with that email already exists. Try signing in instead.',
  DUPLICATE_ENTRY: 'An account with these details already exists.',

  // Validation errors
  VALIDATION_ERROR: 'Please check your details and try again.',
  INVALID_INPUT: 'Please check your input and try again.',

  // Resource errors
  NOT_FOUND: 'This item was not found or may have been deleted.',
  TABLE_EXISTS: 'A table with that number already exists.',
  CATEGORY_EXISTS: 'A category with that name already exists.',

  // Server errors
  INTERNAL_SERVER_ERROR: 'Something went wrong on the server. Please try again later.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
};

/**
 * Handles API errors with user-friendly toast and console logging
 * @param error - The error object (usually from catch block)
 * @param context - Operation context (operation name, page name)
 * @param customMessage - Optional custom user message to override defaults
 */
export function handleApiError(
  error: unknown,
  context: ErrorContext,
  customMessage?: string
): void {
  const { operation, page = 'Unknown' } = context;
  const { statusCode, errorCode, message, details } = extractErrorMessage(error);

  // Determine user-friendly message
  let userMessage = customMessage;
  if (!userMessage && errorCode && errorCode in ERROR_CODE_MESSAGES) {
    userMessage = ERROR_CODE_MESSAGES[errorCode];
  }
  if (!userMessage && details && details.length > 0) {
    userMessage = details.join(', ');
  }
  if (!userMessage) {
    userMessage = customMessage || `Failed to ${operation}. Please try again.`;
  }

  // Log detailed error to console for debugging
  console.error(`[${page}] API Error in ${operation}`, {
    statusCode,
    errorCode,
    userMessage,
    serverMessage: message,
    details,
    timestamp: new Date().toISOString(),
    rawError: error,
  });

  // Show toast to user
  toast.error(userMessage);
}

/**
 * Handles success feedback
 */
export function handleSuccess(message: string, duration = 3000): void {
  toast.success(message, { duration });
}

/**
 * Handles network/connectivity errors specifically
 */
export function handleNetworkError(context: ErrorContext): void {
  console.error(`[${context.page}] Network error in ${context.operation}`, {
    timestamp: new Date().toISOString(),
  });

  toast.error('Network error. Please check your connection and try again.');
}

/**
 * Handles retry-able errors
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    if (status === undefined) {
      // Network error
      return true;
    }
    // Retry on 5xx errors and 429 (rate limit)
    return status >= 500 || status === 429;
  }
  return false;
}
