/**
 * File Schema Adapter
 * 
 * This utility provides a compatibility layer between the database schema
 * and the application's expected interface. It handles the mapping between
 * database column names and application property names.
 */

import type { Database } from '@/integrations/supabase/types';

// Database types (actual schema)
type DatabaseFileRow = Database['public']['Tables']['files']['Row'];
type DatabaseFileInsert = Database['public']['Tables']['files']['Insert'];

// Application interface (what our code expects)
export interface AppFile {
  id: string;
  filename: string;
  original_filename: string;
  storage_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  description?: string | null;
  created_at: string | null;
  uploaded_by_name?: string;
  uploaded_by_role?: string;
  assignment_count?: number;
  last_accessed?: string;
  access_count?: number;
}

export interface AppFileInsert {
  filename: string;
  original_filename: string;
  storage_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  description?: string;
}

/**
 * Convert database file row to application file interface
 */
export function mapDatabaseFileToApp(dbFile: DatabaseFileRow): AppFile {
  return {
    id: dbFile.id,
    filename: dbFile.name,
    original_filename: dbFile.original_name,
    storage_path: dbFile.file_path,
    file_size: dbFile.file_size,
    file_type: dbFile.mime_type,
    uploaded_by: dbFile.uploaded_by,
    description: dbFile.description,
    created_at: dbFile.uploaded_at,
  };
}

/**
 * Convert application file insert to database format
 */
export function mapAppFileToDatabase(appFile: AppFileInsert): DatabaseFileInsert {
  return {
    name: appFile.filename,
    original_name: appFile.original_filename,
    file_path: appFile.storage_path,
    file_size: appFile.file_size,
    mime_type: appFile.file_type,
    uploaded_by: appFile.uploaded_by,
    description: appFile.description,
  };
}

/**
 * Convert array of database files to application format
 */
export function mapDatabaseFilesToApp(dbFiles: DatabaseFileRow[]): AppFile[] {
  return dbFiles.map(mapDatabaseFileToApp);
}

/**
 * Type guard to check if an object is a valid app file
 */
export function isValidAppFile(obj: any): obj is AppFile {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.filename === 'string' &&
    typeof obj.original_filename === 'string' &&
    typeof obj.storage_path === 'string' &&
    typeof obj.file_size === 'number' &&
    typeof obj.file_type === 'string' &&
    typeof obj.uploaded_by === 'string'
  );
}

/**
 * Safe file access with fallback values
 */
export function safeFileAccess(file: any): AppFile {
  if (isValidAppFile(file)) {
    return file;
  }

  // If it's a database file, convert it
  if (file && file.name && file.original_name) {
    return mapDatabaseFileToApp(file as DatabaseFileRow);
  }

  // Fallback for invalid data
  return {
    id: file?.id || 'unknown',
    filename: file?.filename || file?.name || 'Unknown File',
    original_filename: file?.original_filename || file?.original_name || 'Unknown File',
    storage_path: file?.storage_path || file?.file_path || '',
    file_size: file?.file_size || 0,
    file_type: file?.file_type || file?.mime_type || 'application/octet-stream',
    uploaded_by: file?.uploaded_by || '',
    description: file?.description || null,
    created_at: file?.created_at || file?.uploaded_at || null,
  };
}

/**
 * Get file display name with fallback
 */
export function getFileDisplayName(file: any): string {
  return file?.original_filename || file?.original_name || file?.filename || file?.name || 'Unknown File';
}

/**
 * Get file type with fallback
 */
export function getFileType(file: any): string {
  return file?.file_type || file?.mime_type || 'application/octet-stream';
}

/**
 * Get storage path with fallback
 */
export function getStoragePath(file: any): string {
  return file?.storage_path || file?.file_path || '';
}

/**
 * Get created date with fallback
 */
export function getCreatedAt(file: any): string | null {
  return file?.created_at || file?.uploaded_at || null;
}