import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { validateFileSecurityStrict, generateSecureFileName, scanFileContent } from '@/utils/security';
import { validateFileUploadData } from '@/utils/validation';
import { performanceTimer, useCachedFileOperations } from '@/utils/performance';
import { errorLogger } from '@/utils/errorHandler';

/**
 * useFileUpload Hook
 * 
 * Purpose: Handle file uploads to Supabase Storage and database
 * Features:
 * - File upload to Supabase Storage
 * - Database record creation
 * - Progress tracking
 * - Error handling
 * - File validation
 */

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export const useFileUpload = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { clearFileCache } = useCachedFileOperations();

  // Enhanced file validation with security checks
  const validateFile = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    try {
      // Basic validation
      validateFileUploadData({
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Security validation
      validateFileSecurityStrict(file);

      // Content scanning for malicious content
      await scanFileContent(file);

      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'File validation failed';
      errorLogger.log(error instanceof Error ? error : new Error(errorMessage), 'FileUpload');
      return { valid: false, error: errorMessage };
    }

    return { valid: true };
  };

  // Generate unique file name
  const generateFileName = (originalName: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${random}.${extension}`;
  };

  // Upload single file
  const uploadFile = async (
    file: File,
    options: {
      description?: string;
      tags?: string[];
      accessLevel?: 'private' | 'client' | 'public';
    } = {}
  ): Promise<UploadedFile> => {
    console.log('🚀 Starting file upload:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    if (!user) {
      console.error('❌ User not authenticated');
      throw new Error('User not authenticated');
    }

    console.log('✅ User authenticated:', user.id, user.email);

    // Start performance monitoring
    performanceTimer.start(`upload-${file.name}`);

    // Enhanced validation with security checks
    const validation = await validateFile(file);
    if (!validation.valid) {
      console.error('❌ File validation failed:', validation.error);
      performanceTimer.end(`upload-${file.name}`);
      throw new Error(validation.error);
    }

    console.log('✅ File validation passed');

    const fileId = crypto.randomUUID();
    const fileName = generateSecureFileName(file.name);
    const filePath = `uploads/${user.id}/${fileName}`;

    console.log('📁 Generated file path:', filePath);

    // Add to uploads tracking
    const uploadProgress: FileUploadProgress = {
      fileId,
      fileName: file.name,
      progress: 0,
      status: 'pending'
    };

    setUploads(prev => [...prev, uploadProgress]);

    try {
      // Update status to uploading
      setUploads(prev => prev.map(upload => 
        upload.fileId === fileId 
          ? { ...upload, status: 'uploading' as const }
          : upload
      ));

      console.log('📤 Uploading to Supabase Storage...');

      // Upload file to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) {
        console.error('❌ Storage upload failed:', storageError);
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      console.log('✅ Storage upload successful:', storageData);

      // Update progress
      setUploads(prev => prev.map(upload => 
        upload.fileId === fileId 
          ? { ...upload, progress: 50, status: 'processing' as const }
          : upload
      ));

      console.log('💾 Creating database record...');

      // Create database record
      const { data: fileData, error: dbError } = await supabase
        .from('files')
        .insert({
          id: fileId,
          filename: fileName,
          original_filename: file.name,
          storage_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id,
          description: options.description || null
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database insert failed:', dbError);
        // Clean up storage if database insert fails
        await supabase.storage.from('files').remove([filePath]);
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      console.log('✅ Database record created:', fileData);

      // Update progress to completed
      setUploads(prev => prev.map(upload => 
        upload.fileId === fileId 
          ? { ...upload, progress: 100, status: 'completed' as const }
          : upload
      ));

      // Remove from uploads after a delay
      setTimeout(() => {
        setUploads(prev => prev.filter(upload => upload.fileId !== fileId));
      }, 3000);

      // Clear file cache and end performance monitoring
      clearFileCache();
      performanceTimer.end(`upload-${file.name}`);

      return {
        id: fileData.id,
        name: fileData.name,
        originalName: fileData.original_name,
        filePath: fileData.file_path,
        fileSize: fileData.file_size,
        mimeType: fileData.mime_type,
        uploadedAt: fileData.uploaded_at
      };

    } catch (error) {
      // End performance monitoring on error
      performanceTimer.end(`upload-${file.name}`);
      // Update status to error
      setUploads(prev => prev.map(upload => 
        upload.fileId === fileId 
          ? { 
              ...upload, 
              status: 'error' as const, 
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : upload
      ));

      throw error;
    }
  };

  // Upload multiple files
  const uploadFiles = async (
    files: File[],
    options: {
      description?: string;
      tags?: string[];
      accessLevel?: 'private' | 'client' | 'public';
    } = {}
  ): Promise<UploadedFile[]> => {
    setIsUploading(true);
    
    try {
      const uploadPromises = files.map(file => uploadFile(file, options));
      const results = await Promise.allSettled(uploadPromises);
      
      const successful: UploadedFile[] = [];
      const failed: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failed.push(`${files[index].name}: ${result.reason.message}`);
        }
      });

      if (failed.length > 0) {
        console.warn('Some files failed to upload:', failed);
      }

      return successful;
    } finally {
      setIsUploading(false);
    }
  };

  // Clear upload progress
  const clearUploads = () => {
    setUploads([]);
  };

  // Remove specific upload from tracking
  const removeUpload = (fileId: string) => {
    setUploads(prev => prev.filter(upload => upload.fileId !== fileId));
  };

  return {
    uploads,
    isUploading,
    uploadFile,
    uploadFiles,
    clearUploads,
    removeUpload,
    validateFile
  };
};