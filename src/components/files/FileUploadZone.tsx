import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useFileUpload, type FileUploadProgress } from '@/hooks/useFileUpload';

/**
 * FileUploadZone Component
 * 
 * Purpose: Drag-and-drop file upload interface
 * Features:
 * - Drag and drop support
 * - Multiple file selection
 * - Upload progress tracking
 * - File validation
 * - Upload queue management
 */

interface FileUploadZoneProps {
  onUploadComplete?: (files: any[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  disabled?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  acceptedFileTypes,
  disabled = false
}) => {
  const { uploads, isUploading, uploadFiles, removeUpload, validateFile } = useFileUpload();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadOptions, setUploadOptions] = useState({
    description: '',
    tags: [] as string[],
    accessLevel: 'private' as 'private' | 'client' | 'public'
  });

  // Handle file drop/selection
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (disabled) return;

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => 
        `${file.name}: ${errors.map((e: any) => e.message).join(', ')}`
      );
      onUploadError?.(errors.join('\n'));
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    acceptedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    });

    if (invalidFiles.length > 0) {
      onUploadError?.(invalidFiles.join('\n'));
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles].slice(0, maxFiles));
    }
  }, [disabled, maxFiles, onUploadError, validateFile]);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || isUploading,
    maxFiles,
    accept: acceptedFileTypes ? {
      'application/*': acceptedFileTypes.filter(type => type.startsWith('application/')),
      'image/*': acceptedFileTypes.filter(type => type.startsWith('image/')),
      'text/*': acceptedFileTypes.filter(type => type.startsWith('text/'))
    } : undefined
  });

  // Remove selected file
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Start upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      console.log('❌ No files selected for upload');
      return;
    }

    console.log('🚀 Starting upload of', selectedFiles.length, 'files');

    try {
      const uploadedFiles = await uploadFiles(selectedFiles, uploadOptions);
      
      console.log('✅ Upload completed successfully:', uploadedFiles);
      
      setSelectedFiles([]);
      onUploadComplete?.(uploadedFiles);
    } catch (error) {
      console.error('❌ Upload failed:', error);
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get upload status icon
  const getStatusIcon = (status: FileUploadProgress['status']) => {
    switch (status) {
      case 'pending':
        return <File className="h-4 w-4 text-muted-foreground" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <Card className={`border-2 border-dashed transition-colors ${
        isDragActive 
          ? 'border-primary bg-primary/5' 
          : disabled 
            ? 'border-muted bg-muted/20' 
            : 'border-muted-foreground/25 hover:border-primary/50'
      }`}>
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`text-center cursor-pointer ${
              disabled ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`mx-auto h-12 w-12 mb-4 ${
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            }`} />
            
            {isDragActive ? (
              <p className="text-lg font-medium text-primary">
                Drop files here to upload
              </p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Maximum {maxFiles} files, up to 100MB each
                </p>
                <Button variant="outline" disabled={disabled || isUploading}>
                  Select Files
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Selected Files ({selectedFiles.length})</h3>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSelectedFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={handleUpload}
                disabled={isUploading || selectedFiles.length === 0}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Upload Progress</h3>
            <div className="space-y-3">
              {uploads.map((upload) => (
                <div key={upload.fileId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(upload.status)}
                      <span className="text-sm font-medium">{upload.fileName}</span>
                      <Badge variant="outline" className="text-xs">
                        {upload.status}
                      </Badge>
                    </div>
                    {upload.status === 'error' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUpload(upload.fileId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {upload.status === 'uploading' || upload.status === 'processing' ? (
                    <Progress value={upload.progress} className="h-2" />
                  ) : null}
                  
                  {upload.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {upload.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};