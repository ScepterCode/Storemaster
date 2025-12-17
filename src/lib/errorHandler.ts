/**
 * Error Handler Utility
 * Provides consistent error handling and classification across the application
 */

export interface ErrorContext {
  operation: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  organizationId?: string;
}

export type ErrorType = 'network' | 'validation' | 'auth' | 'storage' | 'unknown';

export class AppError extends Error {
  type: ErrorType;
  context: ErrorContext;
  originalError?: Error;
  userMessage: string;

  constructor(
    message: string,
    type: ErrorType,
    context: ErrorContext,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.context = context;
    this.originalError = originalError;
    this.userMessage = this.generateUserMessage();
    
    // Maintains proper stack trace for where our error was thrown
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, AppError);
    }
  }

  private generateUserMessage(): string {
    const { operation, entityType } = this.context;
    
    switch (this.type) {
      case 'network':
        return `Unable to ${operation} ${entityType}. Please check your internet connection and try again.`;
      case 'validation':
        return `Invalid ${entityType} data. Please check your input and try again.`;
      case 'auth':
        return `Authentication required. Please log in and try again.`;
      case 'storage':
        return `Failed to save ${entityType} locally. Please try again.`;
      default:
        return `Failed to ${operation} ${entityType}. Please try again.`;
    }
  }
}

export interface ErrorHandler {
  handleError(error: unknown, context: ErrorContext): AppError;
  isNetworkError(error: unknown): boolean;
  isValidationError(error: unknown): boolean;
  isAuthError(error: unknown): boolean;
  isStorageError(error: unknown): boolean;
  getUserMessage(error: AppError): string;
}

/**
 * Check if an error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('offline') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('enotfound')
  );
}

/**
 * Check if an error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  return (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('required') ||
    errorMessage.includes('must be') ||
    errorMessage.includes('cannot be empty') ||
    errorMessage.includes('format')
  );
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  return (
    errorMessage.includes('auth') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('unauthenticated') ||
    errorMessage.includes('token') ||
    errorMessage.includes('session') ||
    errorMessage.includes('login') ||
    errorMessage.includes('permission')
  );
}

/**
 * Check if an error is a storage error
 */
export function isStorageError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  return (
    errorMessage.includes('storage') ||
    errorMessage.includes('localstorage') ||
    errorMessage.includes('quota') ||
    errorMessage.includes('disk') ||
    errorMessage.includes('failed to save') ||
    errorMessage.includes('failed to store')
  );
}

/**
 * Classify error type based on error characteristics
 */
function classifyError(error: unknown): ErrorType {
  if (isAuthError(error)) return 'auth';
  if (isNetworkError(error)) return 'network';
  if (isValidationError(error)) return 'validation';
  if (isStorageError(error)) return 'storage';
  return 'unknown';
}

/**
 * Handle an error by wrapping it with context and classification
 */
export function handleError(error: unknown, context: ErrorContext): AppError {
  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }
  
  const errorType = classifyError(error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  const originalError = error instanceof Error ? error : undefined;
  
  return new AppError(errorMessage, errorType, context, originalError);
}

/**
 * Get user-friendly message from an AppError
 */
export function getUserMessage(error: AppError): string {
  return error.userMessage;
}

/**
 * Log error with context for debugging
 */
export function logError(error: AppError): void {
  console.error('Application Error:', {
    type: error.type,
    message: error.message,
    context: error.context,
    userMessage: error.userMessage,
    originalError: error.originalError,
    stack: error.stack,
  });
}

/**
 * Create a validation error
 */
export function createValidationError(
  message: string,
  context: ErrorContext
): AppError {
  return new AppError(message, 'validation', context);
}

/**
 * Create a network error
 */
export function createNetworkError(
  message: string,
  context: ErrorContext,
  originalError?: Error
): AppError {
  return new AppError(message, 'network', context, originalError);
}

/**
 * Create an auth error
 */
export function createAuthError(
  message: string,
  context: ErrorContext
): AppError {
  return new AppError(message, 'auth', context);
}

/**
 * Handle authentication error with redirect
 * This function should be called from hooks when an auth error is caught
 */
export function handleAuthError(error: AppError, redirectToLogin?: () => void): void {
  logError(error);
  
  // If a redirect function is provided, use it to navigate to login
  if (redirectToLogin) {
    redirectToLogin();
  } else if (typeof window !== 'undefined') {
    // Fallback: redirect using window.location
    window.location.href = '/login';
  }
}

/**
 * Create a storage error
 */
export function createStorageError(
  message: string,
  context: ErrorContext,
  originalError?: Error
): AppError {
  return new AppError(message, 'storage', context, originalError);
}

/**
 * Type guard to validate user ID
 * Throws an auth error if userId is not provided
 */
export function validateUserId(
  userId: string | undefined | null,
  context: ErrorContext
): asserts userId is string {
  if (!userId || userId.trim().length === 0) {
    throw createAuthError(
      'User ID is required for this operation',
      context
    );
  }
}

/**
 * Check if a user ID is valid (non-empty string)
 */
export function isValidUserId(userId: unknown): userId is string {
  return typeof userId === 'string' && userId.trim().length > 0;
}

// Export as default object for convenience
const errorHandler: ErrorHandler = {
  handleError,
  isNetworkError,
  isValidationError,
  isAuthError,
  isStorageError,
  getUserMessage,
};

export default errorHandler;
