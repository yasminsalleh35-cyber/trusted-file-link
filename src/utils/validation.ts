/**
 * Comprehensive Input Validation Utilities
 * 
 * Provides robust validation for all user inputs, file operations,
 * and data integrity checks throughout the application.
 */

import { ValidationError } from './errorHandler';

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Password strength regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// File name validation (no path traversal, special chars)
const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9._-]+$/;

// SQL injection patterns to detect
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  /(--|\/\*|\*\/|;|'|"|`)/,
  /(\bOR\b|\bAND\b).*[=<>]/i
];

// XSS patterns to detect
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
];

/**
 * Email validation
 */
export function validateEmail(email: string): void {
  if (!email) {
    throw new ValidationError('email', 'Email is required');
  }
  
  if (typeof email !== 'string') {
    throw new ValidationError('email', 'Email must be a string');
  }
  
  if (email.length > 254) {
    throw new ValidationError('email', 'Email is too long (max 254 characters)');
  }
  
  if (!EMAIL_REGEX.test(email)) {
    throw new ValidationError('email', 'Invalid email format');
  }
}

/**
 * Password validation
 */
export function validatePassword(password: string): void {
  if (!password) {
    throw new ValidationError('password', 'Password is required');
  }
  
  if (typeof password !== 'string') {
    throw new ValidationError('password', 'Password must be a string');
  }
  
  if (password.length < 8) {
    throw new ValidationError('password', 'Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    throw new ValidationError('password', 'Password is too long (max 128 characters)');
  }
  
  if (!PASSWORD_REGEX.test(password)) {
    throw new ValidationError(
      'password', 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    );
  }
}

/**
 * Name validation (for user names, client names, etc.)
 */
export function validateName(name: string, fieldName = 'name'): void {
  if (!name) {
    throw new ValidationError(fieldName, `${fieldName} is required`);
  }
  
  if (typeof name !== 'string') {
    throw new ValidationError(fieldName, `${fieldName} must be a string`);
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    throw new ValidationError(fieldName, `${fieldName} must be at least 2 characters long`);
  }
  
  if (trimmedName.length > 100) {
    throw new ValidationError(fieldName, `${fieldName} is too long (max 100 characters)`);
  }
  
  // Check for potentially malicious content
  if (containsXSS(trimmedName)) {
    throw new ValidationError(fieldName, `${fieldName} contains invalid characters`);
  }
}

/**
 * File name validation
 */
export function validateFileName(fileName: string): void {
  if (!fileName) {
    throw new ValidationError('fileName', 'File name is required');
  }
  
  if (typeof fileName !== 'string') {
    throw new ValidationError('fileName', 'File name must be a string');
  }
  
  if (fileName.length > 255) {
    throw new ValidationError('fileName', 'File name is too long (max 255 characters)');
  }
  
  // Check for path traversal attempts
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    throw new ValidationError('fileName', 'File name contains invalid path characters');
  }
  
  // Check for null bytes
  if (fileName.includes('\0')) {
    throw new ValidationError('fileName', 'File name contains null bytes');
  }
  
  // Check for control characters
  if (/[\x00-\x1f\x7f-\x9f]/.test(fileName)) {
    throw new ValidationError('fileName', 'File name contains control characters');
  }
}

/**
 * File size validation
 */
export function validateFileSize(size: number, maxSize = 100 * 1024 * 1024): void {
  if (typeof size !== 'number' || isNaN(size)) {
    throw new ValidationError('fileSize', 'File size must be a valid number');
  }
  
  if (size <= 0) {
    throw new ValidationError('fileSize', 'File size must be greater than 0');
  }
  
  if (size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    throw new ValidationError('fileSize', `File size exceeds ${maxSizeMB}MB limit`);
  }
}

/**
 * MIME type validation
 */
export function validateMimeType(mimeType: string, allowedTypes?: string[]): void {
  if (!mimeType) {
    throw new ValidationError('mimeType', 'MIME type is required');
  }
  
  if (typeof mimeType !== 'string') {
    throw new ValidationError('mimeType', 'MIME type must be a string');
  }
  
  // Basic MIME type format validation
  if (!/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$/.test(mimeType)) {
    throw new ValidationError('mimeType', 'Invalid MIME type format');
  }
  
  if (allowedTypes && !allowedTypes.includes(mimeType)) {
    throw new ValidationError('mimeType', `MIME type '${mimeType}' is not allowed`);
  }
}

/**
 * UUID validation
 */
export function validateUUID(uuid: string, fieldName = 'id'): void {
  if (!uuid) {
    throw new ValidationError(fieldName, `${fieldName} is required`);
  }
  
  if (typeof uuid !== 'string') {
    throw new ValidationError(fieldName, `${fieldName} must be a string`);
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(uuid)) {
    throw new ValidationError(fieldName, `Invalid ${fieldName} format`);
  }
}

/**
 * Text content validation (descriptions, notes, etc.)
 */
export function validateTextContent(text: string, fieldName = 'text', maxLength = 1000): void {
  if (text && typeof text !== 'string') {
    throw new ValidationError(fieldName, `${fieldName} must be a string`);
  }
  
  if (text && text.length > maxLength) {
    throw new ValidationError(fieldName, `${fieldName} is too long (max ${maxLength} characters)`);
  }
  
  if (text && containsXSS(text)) {
    throw new ValidationError(fieldName, `${fieldName} contains invalid content`);
  }
  
  if (text && containsSQLInjection(text)) {
    throw new ValidationError(fieldName, `${fieldName} contains invalid content`);
  }
}

/**
 * Role validation
 */
export function validateRole(role: string): void {
  const validRoles = ['admin', 'client', 'user'];
  
  if (!role) {
    throw new ValidationError('role', 'Role is required');
  }
  
  if (!validRoles.includes(role)) {
    throw new ValidationError('role', `Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }
}

/**
 * Array validation
 */
export function validateArray(arr: any, fieldName = 'array', maxLength = 100): void {
  if (!Array.isArray(arr)) {
    throw new ValidationError(fieldName, `${fieldName} must be an array`);
  }
  
  if (arr.length > maxLength) {
    throw new ValidationError(fieldName, `${fieldName} has too many items (max ${maxLength})`);
  }
}

/**
 * Check for SQL injection patterns
 */
export function containsSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Check for XSS patterns
 */
export function containsXSS(input: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
    .replace(/\0/g, '') // Remove null bytes
    .substring(0, 1000); // Limit length
}

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate file upload data
 */
export interface FileUploadData {
  name: string;
  size: number;
  type: string;
  description?: string;
  tags?: string[];
}

export function validateFileUploadData(data: FileUploadData): void {
  validateFileName(data.name);
  validateFileSize(data.size);
  validateMimeType(data.type);
  
  if (data.description) {
    validateTextContent(data.description, 'description', 500);
  }
  
  if (data.tags) {
    validateArray(data.tags, 'tags', 10);
    data.tags.forEach((tag, index) => {
      if (typeof tag !== 'string') {
        throw new ValidationError('tags', `Tag ${index + 1} must be a string`);
      }
      if (tag.length > 50) {
        throw new ValidationError('tags', `Tag ${index + 1} is too long (max 50 characters)`);
      }
    });
  }
}

/**
 * Validate user registration data
 */
export interface UserRegistrationData {
  email: string;
  password: string;
  fullName: string;
  role: string;
  clientId?: string;
}

export function validateUserRegistrationData(data: UserRegistrationData): void {
  validateEmail(data.email);
  validatePassword(data.password);
  validateName(data.fullName, 'fullName');
  validateRole(data.role);
  
  if (data.clientId) {
    validateUUID(data.clientId, 'clientId');
  }
}

/**
 * Validate client creation data
 */
export interface ClientCreationData {
  name: string;
  description?: string;
  contactEmail?: string;
}

export function validateClientCreationData(data: ClientCreationData): void {
  validateName(data.name, 'clientName');
  
  if (data.description) {
    validateTextContent(data.description, 'description', 500);
  }
  
  if (data.contactEmail) {
    validateEmail(data.contactEmail);
  }
}

/**
 * Rate limiting validation
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxRequests = 10, windowMs = 60000): void {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return;
  }
  
  if (record.count >= maxRequests) {
    throw new ValidationError('rateLimit', 'Too many requests. Please try again later.');
  }
  
  record.count++;
}

/**
 * Comprehensive input sanitization
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return sanitizeString(input);
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeString(key)] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}