import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, File, CheckCircle, XCircle } from 'lucide-react';
import { useSimpleFileUpload } from '@/hooks/useSimpleFileUpload';
import { createFilesBucket, testStorageBucket } from '@/utils/createStorageBucket';
import { AccessibleFileUpload, AccessibleButton } from '@/components/ui/accessible-components';
import { FileUploadProgress, LoadingOverlay } from '@/components/ui/loading-states';
import { ComponentErrorBoundary } from '@/components/ui/error-boundary';

/**
 * Simple File Upload Component
 * 
 * Clean, simple file upload that matches the existing database schema
 */

interface SimpleFileUploadProps {
  onUploadComplete?: (files: any[]) => void;
  onUploadError?: (error: string) => void;
}

export const SimpleFileUpload: React.FC<SimpleFileUploadProps> = ({
  onUploadComplete,
  onUploadError
}) => {
  const { uploadFiles, isUploading, uploadProgress } = useSimpleFileUpload();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showUploadZone, setShowUploadZone] = useState(false);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  // Setup storage bucket
  const handleSetupStorage = async () => {
    console.log('🔧 Setting up storage...');
    
    const bucketExists = await testStorageBucket();
    if (bucketExists) {
      console.log('✅ Storage is ready!');
      alert('✅ Storage is ready! You can now upload files.');
      return;
    }

    const created = await createFilesBucket();
    if (created) {
      console.log('✅ Storage setup complete!');
      alert('✅ Storage setup complete! You can now upload files.');
    } else {
      console.log('❌ Storage setup failed. Check console for instructions.');
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    try {
      console.log('🚀 Starting upload of', selectedFiles.length, 'files');
      
      const uploadedFiles = await uploadFiles(selectedFiles);
      
      console.log('✅ Upload completed:', uploadedFiles);
      
      setSelectedFiles([]);
      setShowUploadZone(false);
      
      onUploadComplete?.(uploadedFiles);
      
      if (uploadedFiles.length > 0) {
        alert(`✅ Successfully uploaded ${uploadedFiles.length} file(s)!`);
      }
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
      alert(`❌ Upload failed: ${errorMessage}`);
    }
  };

  return (
    <ComponentErrorBoundary componentName="SimpleFileUpload">
      <LoadingOverlay isLoading={isUploading} message="Uploading files...">
        <div className="space-y-4">
          {/* Control Buttons */}
          <div className="flex gap-2">
            <AccessibleButton 
              onClick={() => setShowUploadZone(!showUploadZone)}
              variant="default"
              ariaLabel={showUploadZone ? 'Hide file upload area' : 'Show file upload area'}
            >
              <Upload className="h-4 w-4 mr-2" />
              {showUploadZone ? 'Hide Upload' : 'Upload Files'}
            </AccessibleButton>
            
            <AccessibleButton 
              onClick={handleSetupStorage}
              variant="outline"
              ariaLabel="Setup storage bucket for file uploads"
            >
              🔧 Setup Storage
            </AccessibleButton>
          </div>

          {/* Upload Zone */}
          {showUploadZone && (
            <Card>
              <CardContent className="p-6">
                {/* Accessible File Upload */}
                <AccessibleFileUpload
                  onFileSelect={(files) => setSelectedFiles(Array.from(files))}
                  accept="*/*"
                  multiple={true}
                  maxSize={100 * 1024 * 1024}
                  disabled={isUploading}
                  ariaLabel="Upload files by dragging and dropping or clicking to select"
                  helpText="Maximum file size: 100MB. Multiple files supported."
                />

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Selected Files:</h4>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <File className="h-4 w-4" />
                      <span className="flex-1">{file.name}</span>
                      <span className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
                
                <AccessibleButton
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="mt-4 w-full"
                  isLoading={isUploading}
                  loadingText="Uploading files..."
                  ariaLabel={`Upload ${selectedFiles.length} selected file${selectedFiles.length !== 1 ? 's' : ''}`}
                >
                  Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                </AccessibleButton>
              </div>
            )}

                {/* Upload Progress */}
                <FileUploadProgress 
                  files={uploadProgress.map(p => ({
                    name: p.fileName,
                    progress: p.progress,
                    status: p.status,
                    error: p.error
                  }))}
                  className="mt-4"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </LoadingOverlay>
    </ComponentErrorBoundary>
  );
};