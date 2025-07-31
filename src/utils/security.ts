/**
 * Security Enhancement Utilities
 * 
 * Provides comprehensive security measures including CSP, input sanitization,
 * file validation, and protection against common web vulnerabilities.
 */

import { ValidationError } from './errorHandler';

// Content Security Policy configuration
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'connect-src': ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
  'media-src': ["'self'", 'blob:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
};

// Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.app', '.deb', '.pkg', '.dmg', '.rpm', '.msi', '.run', '.bin',
  '.sh', '.ps1', '.psm1', '.psd1', '.ps1xml', '.psc1', '.psc2',
  '.msh', '.msh1', '.msh2', '.mshxml', '.msh1xml', '.msh2xml'
];

// Dangerous MIME types
const DANGEROUS_MIME_TYPES = [
  'application/x-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-msdos-windows',
  'application/x-download',
  'application/bat',
  'application/x-bat',
  'application/com',
  'application/x-com',
  'application/exe',
  'application/x-exe',
  'application/x-winexe',
  'application/msdos-windows',
  'application/x-msdos-program',
  'text/javascript',
  'application/javascript',
  'application/x-javascript'
];

// Maximum file sizes by type (in bytes)
const MAX_FILE_SIZES = {
  'image/*': 10 * 1024 * 1024, // 10MB for images
  'video/*': 100 * 1024 * 1024, // 100MB for videos
  'audio/*': 50 * 1024 * 1024, // 50MB for audio
  'application/pdf': 25 * 1024 * 1024, // 25MB for PDFs
  'text/*': 5 * 1024 * 1024, // 5MB for text files
  'default': 50 * 1024 * 1024 // 50MB default
};

/**
 * Comprehensive file security validation
 */
export function validateFileSecurityStrict(file: File): void {
  // Check file name
  const fileName = file.name.toLowerCase();
  
  // Check for dangerous extensions
  const hasDangerousExtension = DANGEROUS_EXTENSIONS.some(ext => 
    fileName.endsWith(ext.toLowerCase())
  );
  
  if (hasDangerousExtension) {
    throw new ValidationError(
      'file', 
      'This file type is not allowed for security reasons'
    );
  }

  // Check MIME type
  if (DANGEROUS_MIME_TYPES.includes(file.type.toLowerCase())) {
    throw new ValidationError(
      'file', 
      'This file type is not allowed for security reasons'
    );
  }

  // Check for MIME type spoofing (extension doesn't match MIME type)
  if (!validateMimeTypeConsistency(fileName, file.type)) {
    throw new ValidationError(
      'file', 
      'File extension does not match file type'
    );
  }

  // Check file size based on type
  const maxSize = getMaxFileSizeForType(file.type);
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    throw new ValidationError(
      'file', 
      `File size exceeds ${maxSizeMB}MB limit for this file type`
    );
  }

  // Check for null bytes in filename (path traversal attempt)
  if (fileName.includes('\0')) {
    throw new ValidationError(
      'file', 
      'Invalid file name'
    );
  }

  // Check for path traversal attempts
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    throw new ValidationError(
      'file', 
      'Invalid file name'
    );
  }

  // Check for excessively long filenames
  if (fileName.length > 255) {
    throw new ValidationError(
      'file', 
      'File name is too long'
    );
  }

  // Check for hidden files (starting with dot)
  if (fileName.startsWith('.')) {
    throw new ValidationError(
      'file', 
      'Hidden files are not allowed'
    );
  }
}

/**
 * Validate MIME type consistency with file extension
 */
function validateMimeTypeConsistency(fileName: string, mimeType: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return false;

  const mimeTypeMap: Record<string, string[]> = {
    'jpg': ['image/jpeg'],
    'jpeg': ['image/jpeg'],
    'png': ['image/png'],
    'gif': ['image/gif'],
    'webp': ['image/webp'],
    'pdf': ['application/pdf'],
    'txt': ['text/plain'],
    'csv': ['text/csv', 'application/csv'],
    'json': ['application/json'],
    'doc': ['application/msword'],
    'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'xls': ['application/vnd.ms-excel'],
    'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    'ppt': ['application/vnd.ms-powerpoint'],
    'pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    'zip': ['application/zip'],
    'rar': ['application/x-rar-compressed'],
    '7z': ['application/x-7z-compressed']
  };

  const allowedMimeTypes = mimeTypeMap[extension];
  return allowedMimeTypes ? allowedMimeTypes.includes(mimeType) : false;
}

/**
 * Get maximum file size for a given MIME type
 */
function getMaxFileSizeForType(mimeType: string): number {
  const type = mimeType.split('/')[0] + '/*';
  return MAX_FILE_SIZES[type] || MAX_FILE_SIZES.default;
}

/**
 * Sanitize file name for safe storage
 */
export function sanitizeFileNameSecure(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_') // Replace unsafe chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 100); // Limit length
}

/**
 * Generate secure random file name
 */
export function generateSecureFileName(originalName: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  const timestamp = Date.now();
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  const randomString = Array.from(randomBytes, byte => 
    byte.toString(16).padStart(2, '0')
  ).join('');
  
  return `${timestamp}_${randomString}.${extension}`;
}

/**
 * Rate limiting for file operations
 */
class RateLimiter {
  private requests = new Map<string, number[]>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - validRequests.length);
  }

  getResetTime(identifier: string): number {
    const requests = this.requests.get(identifier) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    return oldestRequest + this.windowMs;
  }
}

// Global rate limiters
export const uploadRateLimiter = new RateLimiter(5, 60000); // 5 uploads per minute
export const downloadRateLimiter = new RateLimiter(20, 60000); // 20 downloads per minute
export const deleteRateLimiter = new RateLimiter(10, 60000); // 10 deletes per minute

/**
 * Check if user can perform file operation
 */
export function checkFileOperationPermission(
  operation: 'upload' | 'download' | 'delete',
  userId: string
): void {
  let rateLimiter: RateLimiter;
  
  switch (operation) {
    case 'upload':
      rateLimiter = uploadRateLimiter;
      break;
    case 'download':
      rateLimiter = downloadRateLimiter;
      break;
    case 'delete':
      rateLimiter = deleteRateLimiter;
      break;
    default:
      throw new ValidationError('operation', 'Invalid operation');
  }

  if (!rateLimiter.isAllowed(userId)) {
    const resetTime = rateLimiter.getResetTime(userId);
    const resetDate = new Date(resetTime);
    throw new ValidationError(
      'rateLimit', 
      `Too many ${operation} requests. Try again after ${resetDate.toLocaleTimeString()}`
    );
  }
}

/**
 * Validate user permissions for file access
 */
export function validateFileAccess(
  fileOwnerId: string,
  currentUserId: string,
  userRole: string,
  isAssigned: boolean = false
): boolean {
  // Admin can access all files
  if (userRole === 'admin') {
    return true;
  }

  // Owner can access their own files
  if (fileOwnerId === currentUserId) {
    return true;
  }

  // User can access assigned files
  if (isAssigned) {
    return true;
  }

  return false;
}

/**
 * Generate Content Security Policy header
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_CONFIG)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

/**
 * Secure headers configuration
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': generateCSPHeader()
};

/**
 * Validate and sanitize URL parameters
 */
export function sanitizeUrlParams(params: URLSearchParams): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of params.entries()) {
    // Only allow alphanumeric keys
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
      continue;
    }
    
    // Sanitize value
    const sanitizedValue = value
      .replace(/[<>'"&]/g, '') // Remove potentially dangerous chars
      .substring(0, 100); // Limit length
    
    if (sanitizedValue) {
      sanitized[key] = sanitizedValue;
    }
  }
  
  return sanitized;
}

/**
 * Validate JWT token format (basic check)
 */
export function validateJWTFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Check if each part is valid base64
  try {
    parts.forEach(part => {
      if (part.length === 0) throw new Error('Empty part');
      // Basic base64 check
      if (!/^[A-Za-z0-9_-]+$/.test(part)) throw new Error('Invalid base64');
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Secure session storage
 */
export class SecureStorage {
  private static encrypt(data: string): string {
    // In a real implementation, use proper encryption
    // For now, just base64 encode (NOT secure, just for demo)
    return btoa(data);
  }

  private static decrypt(data: string): string {
    try {
      return atob(data);
    } catch {
      return '';
    }
  }

  static setItem(key: string, value: string): void {
    try {
      const encrypted = this.encrypt(value);
      sessionStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to store secure item:', error);
    }
  }

  static getItem(key: string): string | null {
    try {
      const encrypted = sessionStorage.getItem(key);
      if (!encrypted) return null;
      return this.decrypt(encrypted);
    } catch (error) {
      console.error('Failed to retrieve secure item:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  static clear(): void {
    sessionStorage.clear();
  }
}

/**
 * Audit logging for security events
 */
export interface SecurityEvent {
  type: 'file_upload' | 'file_download' | 'file_delete' | 'login' | 'logout' | 'permission_denied';
  userId: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

class SecurityAuditLogger {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000;

  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    };

    this.events.push(fullEvent);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(fullEvent);
    } else {
      console.log('🔒 Security Event:', fullEvent);
    }
  }

  private getClientIP(): string {
    // In a real implementation, get from server
    return 'unknown';
  }

  private sendToLoggingService(event: SecurityEvent): void {
    // Implementation would send to your logging service
    // e.g., Sentry, LogRocket, custom endpoint
  }

  getEvents(): SecurityEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

export const securityAuditLogger = new SecurityAuditLogger();

/**
 * File content scanning (basic implementation)
 */
export async function scanFileContent(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      // Basic malware signature detection
      const malwareSignatures = [
        'eval(',
        'document.write',
        '<script',
        'javascript:',
        'vbscript:',
        'onload=',
        'onerror=',
        'onclick='
      ];
      
      const isSuspicious = malwareSignatures.some(signature => 
        content.toLowerCase().includes(signature.toLowerCase())
      );
      
      resolve(!isSuspicious);
    };
    
    reader.onerror = () => resolve(false);
    
    // Only scan text files and small files
    if (file.type.startsWith('text/') && file.size < 1024 * 1024) {
      reader.readAsText(file);
    } else {
      resolve(true); // Skip scanning for non-text files
    }
  });
}