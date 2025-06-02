/**
 * API Utilities
 * Common functions and utilities for API operations
 */

import { ApiResponse } from '@/types';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with error handling
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise with the parsed response
 */
export async function apiFetch<T = any>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || `HTTP error! status: ${response.status}`, response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors or JSON parsing errors
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
}

/**
 * Create a standard API response
 * @param success - Whether the operation was successful
 * @param data - The response data (optional)
 * @param error - Error message (optional)
 * @returns Formatted API response
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string
): ApiResponse<T> {
  return {
    success,
    ...(data !== undefined && { data }),
    ...(error && { error }),
  };
}

/**
 * Handle async operations with error catching
 * @param operation - The async operation to perform
 * @param errorMessage - Default error message if operation fails
 * @returns Promise with result and error
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Operation failed'
): Promise<{ result: T | null; error: string | null }> {
  try {
    const result = await operation();
    return { result, error: null };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : errorMessage;
    console.error('Async operation failed:', error);
    return { result: null, error: errorMsg };
  }
}

/**
 * Validate required fields in an object
 * @param obj - Object to validate
 * @param requiredFields - Array of required field names
 * @returns Array of missing fields
 */
export function validateRequiredFields(obj: Record<string, any>, requiredFields: string[]): string[] {
  return requiredFields.filter(field => 
    obj[field] === undefined || obj[field] === null || obj[field] === ''
  );
}

/**
 * Create a debounced function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Format error message for user display
 * @param error - Error object or string
 * @returns User-friendly error message
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred. Please try again.';
} 