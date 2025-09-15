/**
 * Comprehensive Error Handling Utilities
 * 
 * This module provides robust error handling, logging, and user feedback
 * for all application operations.
 */

import { toast } from '@/hooks/use-toast';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  context?: string;
}

export class FileOperationError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'FileOperationError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
  }
}

export class ValidationError extends Error {
  public readonly field: string;
  public readonly value: any;

  constructor(field: string, message: string, value?: any) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

export class NetworkError extends Error {
  public readonly statusCode?: number;
  public readonly retryable: boolean;

  constructor(message: string, statusCode?: number, retryable = true) {
    super(message);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

/**
 * Error logging service
 */
class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: AppError[] = [];

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(error: Error | AppError, context?: string, userId?: string): void {
    const appError: AppError = {
      code: (error as any).code || 'UNKNOWN_ERROR',
      message: error.message,
      details: (error as any).details || error.stack,
      timestamp: new Date(),
      userId,
      context
    };

    this.logs.push(appError);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error logged:', appError);
    }

    // In production, you would send this to your logging service
    // Example: sendToLoggingService(appError);
  }

  getLogs(): AppError[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const errorLogger = ErrorLogger.getInstance();

/**
 * Retry mechanism for failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
  backoff = 2
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry validation errors or non-retryable network errors
      if (error instanceof ValidationError || 
          (error instanceof NetworkError && !error.retryable)) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoff, attempt - 1)));
    }
  }

  throw new FileOperationError(
    'MAX_RETRIES_EXCEEDED',
    `Operation failed after ${maxRetries} attempts: ${lastError.message}`,
    { originalError: lastError, attempts: maxRetries }
  );
}

/**
 * Safe async operation wrapper with error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context: string,
  options: {
    showToast?: boolean;
    retries?: number;
    fallback?: T;
    userId?: string;
  } = {}
): Promise<T | null> {
  const { showToast = true, retries = 0, fallback = null, userId } = options;

  try {
    if (retries > 0) {
      return await withRetry(operation, retries);
    } else {
      return await operation();
    }
  } catch (error) {
    const err = error as Error;
    
    // Log the error
    errorLogger.log(err, context, userId);

    // Show user-friendly toast message
    if (showToast) {
      const userMessage = getUserFriendlyMessage(err);
      toast({
        title: "Operation Failed",
        description: userMessage,
        variant: "destructive",
      });
    }

    // Return fallback value if provided
    if (fallback !== null) {
      return fallback;
    }

    return null;
  }
}

/**
 * Convert technical errors to user-friendly messages
 */
export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof ValidationError) {
    return `Invalid ${error.field}: ${error.message}`;
  }

  if (error instanceof NetworkError) {
    if (error.statusCode === 413) {
      return "File is too large. Please choose a smaller file.";
    }
    if (error.statusCode === 403) {
      return "You don't have permission to perform this action.";
    }
    if (error.statusCode === 404) {
      return "The requested resource was not found.";
    }
    return "Network error. Please check your connection and try again.";
  }

  if (error instanceof FileOperationError) {
    switch (error.code) {
      case 'FILE_TOO_LARGE':
        return "File is too large. Maximum size is 100MB.";
      case 'INVALID_FILE_TYPE':
        return "File type not supported. Please choose a different file.";
      case 'UPLOAD_FAILED':
        return "File upload failed. Please try again.";
      case 'DOWNLOAD_FAILED':
        return "File download failed. Please try again.";
      case 'DELETE_FAILED':
        return "File deletion failed. Please try again.";
      case 'PREVIEW_FAILED':
        return "File preview failed. You can still download the file.";
      default:
        return "File operation failed. Please try again.";
    }
  }

  // Supabase specific errors
  if (error.message.includes('JWT')) {
    return "Your session has expired. Please log in again.";
  }
  if (error.message.includes('RLS')) {
    return "You don't have permission to access this resource.";
  }
  if (error.message.includes('duplicate key')) {
    return "This item already exists.";
  }

  // Generic fallback
  return "An unexpected error occurred. Please try again.";
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): void {
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_TYPES = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    // Documents
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Code files
    'text/javascript', 'text/typescript', 'text/html', 'text/css', 'application/json',
    // Archives
    'application/zip', 'application/x-zip-compressed', 'application/x-zip', 'multipart/x-zip',
    'application/x-rar-compressed', 'application/x-7z-compressed'
  ];

  const ALLOWED_EXTENSIONS = [
    // Images
    'jpg','jpeg','png','gif','webp',
    // Documents
    'pdf','txt','csv','doc','docx','xls','xlsx','ppt','pptx','json',
    // Archives
    'zip','rar','7z'
  ];

  if (!file) {
    throw new ValidationError('file', 'No file selected');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError('file', `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`, file.size);
  }

  const fileType = (file.type || '').trim();
  const fileExt = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';

  const isAllowedByType = fileType !== '' && ALLOWED_TYPES.includes(fileType);
  const isAllowedByExtFallback = (fileType === '' || fileType === 'application/octet-stream') && ALLOWED_EXTENSIONS.includes(fileExt);

  if (!isAllowedByType && !isAllowedByExtFallback) {
    throw new ValidationError('file', `File type '${file.type}' is not supported`, file.type);
  }

  // Check for potentially dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
  const fileName = file.name.toLowerCase();
  
  if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
    throw new ValidationError('file', 'This file type is not allowed for security reasons', fileName);
  }
}

/**
 * Sanitize file name to prevent path traversal and other issues
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 255); // Limit length
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if operation should be retried based on error
 */
export function shouldRetry(error: Error, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false;
  
  // Don't retry validation errors
  if (error instanceof ValidationError) return false;
  
  // Don't retry non-retryable network errors
  if (error instanceof NetworkError && !error.retryable) return false;
  
  // Retry network timeouts and server errors
  if (error.message.includes('timeout') || 
      error.message.includes('network') ||
      error.message.includes('500') ||
      error.message.includes('502') ||
      error.message.includes('503')) {
    return true;
  }
  
  return false;
}