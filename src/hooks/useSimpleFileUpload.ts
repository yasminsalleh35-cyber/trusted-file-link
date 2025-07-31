import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  validateFile, 
  sanitizeFileName, 
  safeAsync, 
  FileOperationError,
  errorLogger 
} from '@/utils/errorHandler';
import { 
  validateFileUploadData, 
  validateUUID, 
  sanitizeInput 
} from '@/utils/validation';
import { 
  validateFileSecurityStrict, 
  generateSecureFileName, 
  checkFileOperationPermission,
  scanFileContent,
  securityAuditLogger 
} from '@/utils/security';

/**
 * Simple File Upload Hook
 * 
 * Matches the existing database schema exactly:
 * - filename (display name)
 * - original_filename (original name)
 * - file_type (MIME type)
 * - file_size (bytes)
 * - storage_path (Supabase storage path)
 * - uploaded_by (user ID)
 */

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  file_path: string;
  uploaded_by: string;
  uploaded_at: string;
}

export const useSimpleFileUpload = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    if (!user) {
      throw new FileOperationError('AUTH_REQUIRED', 'User not authenticated');
    }

    // Comprehensive validation and security checks
    validateFile(file);
    validateFileSecurityStrict(file);
    validateFileUploadData({
      name: file.name,
      size: file.size,
      type: file.type
    });
    validateUUID(user.id, 'userId');
    
    // Check rate limiting
    checkFileOperationPermission('upload', user.id);
    
    // Scan file content for malware
    const isFileSafe = await scanFileContent(file);
    if (!isFileSafe) {
      throw new FileOperationError('MALWARE_DETECTED', 'File contains suspicious content');
    }

    console.log('🚀 Starting file upload:', file.name);
    
    // Generate secure file path
    const secureFileName = generateSecureFileName(file.name);
    const storagePath = `uploads/${user.id}/${secureFileName}`;

    console.log('📁 Storage path:', storagePath);

    // Add to progress tracking
    const progressItem: UploadProgress = {
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    };
    setUploadProgress(prev => [...prev, progressItem]);

    try {
      // Step 1: Upload to Supabase Storage
      console.log('📤 Uploading to storage...');
      const { data: storageData, error: storageError } = await supabase.storage
        .from('files')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) {
        console.error('❌ Storage upload failed:', storageError);
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      console.log('✅ Storage upload successful');

      // Update progress
      setUploadProgress(prev => 
        prev.map(p => 
          p.fileName === file.name 
            ? { ...p, progress: 50 }
            : p
        )
      );

      // Step 2: Create database record
      console.log('💾 Creating database record...');
      const { data: fileData, error: dbError } = await supabase
        .from('files')
        .insert({
          filename: file.name,
          original_filename: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: storagePath,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database insert failed:', dbError);
        // Clean up storage file
        await supabase.storage.from('files').remove([storagePath]);
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      console.log('✅ Database record created:', fileData);

      // Update progress to completed
      setUploadProgress(prev => 
        prev.map(p => 
          p.fileName === file.name 
            ? { ...p, progress: 100, status: 'completed' as const }
            : p
        )
      );

      // Log successful upload
      securityAuditLogger.log({
        type: 'file_upload',
        userId: user.id,
        details: {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          fileId: fileData.id
        }
      });

      return fileData as UploadedFile;

    } catch (error) {
      console.error('❌ Upload failed:', error);
      
      // Update progress to error
      setUploadProgress(prev => 
        prev.map(p => 
          p.fileName === file.name 
            ? { ...p, status: 'error' as const, error: error instanceof Error ? error.message : 'Upload failed' }
            : p
        )
      );

      throw error;
    }
  };

  const uploadFiles = async (files: File[]): Promise<UploadedFile[]> => {
    setIsUploading(true);
    const results: UploadedFile[] = [];
    const errors: string[] = [];

    try {
      for (const file of files) {
        try {
          const result = await uploadFile(file);
          results.push(result);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          errors.push(`${file.name}: ${errorMessage}`);
        }
      }

      if (errors.length > 0) {
        console.warn('Some files failed to upload:', errors);
      }

      return results;

    } finally {
      setIsUploading(false);
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress([]);
      }, 3000);
    }
  };

  const clearProgress = () => {
    setUploadProgress([]);
  };

  return {
    uploadFile,
    uploadFiles,
    isUploading,
    uploadProgress,
    clearProgress
  };
};