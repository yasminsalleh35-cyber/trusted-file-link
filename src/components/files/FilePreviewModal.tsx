import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Eye
} from 'lucide-react';
import type { ManagedFile } from '@/hooks/useFileManagement';

/**
 * FilePreviewModal Component
 * 
 * Purpose: Display file previews in a modal dialog
 * Supports:
 * - PDF files (using iframe)
 * - Image files (jpg, png, gif, etc.)
 * - Text files (txt, md, json, etc.)
 * - Code files (js, ts, css, html, etc.)
 */

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: ManagedFile | null;
  onDownload: (file: ManagedFile) => void;
  onPreview?: (file: ManagedFile) => Promise<string>;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  onDownload,
  onPreview
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  // Reset state when file changes
  useEffect(() => {
    if (file && isOpen) {
      setIsLoading(true);
      setError(null);
      setPreviewUrl(null);
      setTextContent(null);
      setZoom(100);
      setRotation(0);
      loadPreview();
    }
  }, [file, isOpen]);

  // Load preview based on file type
  const loadPreview = async () => {
    if (!file) return;

    try {
      setIsLoading(true);
      setError(null);

      // For images and PDFs, get the signed URL
      if (canPreviewAsUrl(file.file_type)) {
        if (onPreview) {
          const url = await onPreview(file);
          setPreviewUrl(url);
        } else {
          throw new Error('Preview function not available');
        }
      } 
      // For text files, fetch the content using the signed URL
      else if (canPreviewAsText(file.file_type)) {
        if (onPreview) {
          const url = await onPreview(file);
          const response = await fetch(url);
          if (response.ok) {
            const content = await response.text();
            setTextContent(content);
          } else {
            throw new Error('Failed to load file content');
          }
        } else {
          throw new Error('Preview function not available');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if file can be previewed as URL (iframe/img)
  const canPreviewAsUrl = (mimeType: string | undefined | null): boolean => {
    if (!mimeType) return false;
    return (
      mimeType.startsWith('image/') ||
      mimeType === 'application/pdf'
    );
  };

  // Check if file can be previewed as text
  const canPreviewAsText = (mimeType: string | undefined | null): boolean => {
    if (!mimeType) return false;
    return (
      mimeType.startsWith('text/') ||
      mimeType === 'application/json' ||
      mimeType === 'application/xml' ||
      mimeType.includes('javascript') ||
      mimeType.includes('typescript') ||
      mimeType.includes('css') ||
      mimeType.includes('html')
    );
  };

  // Check if file can be previewed at all
  const canPreview = (mimeType: string | undefined | null): boolean => {
    return canPreviewAsUrl(mimeType) || canPreviewAsText(mimeType);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type icon
  const getFileTypeIcon = (mimeType: string | undefined | null) => {
    if (!mimeType) return <FileText className="h-4 w-4" />;
    
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-4 w-4" />;
    } else {
      return <FileText className="h-4 w-4" />;
    }
  };

  // Handle zoom
  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      if (direction === 'in') {
        return Math.min(prev + 25, 200);
      } else {
        return Math.max(prev - 25, 25);
      }
    });
  };

  // Handle rotation
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Render preview content
  const renderPreviewContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Skeleton className="h-8 w-8 mx-auto rounded" />
            <Skeleton className="h-4 w-32 mx-auto" />
            <p className="text-sm text-muted-foreground">Loading preview...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (!file || !canPreview(file.file_type)) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center mx-auto">
              {getFileTypeIcon(file?.file_type)}
            </div>
            <div>
              <h3 className="font-medium">Preview not available</h3>
              <p className="text-sm text-muted-foreground">
                This file type cannot be previewed in the browser
              </p>
            </div>
            <Button onClick={() => file && onDownload(file)}>
              <Download className="mr-2 h-4 w-4" />
              Download to view
            </Button>
          </div>
        </div>
      );
    }

    // Image preview
    if (file.file_type?.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center min-h-96 bg-muted/20 rounded-lg">
          <img
            src={previewUrl || ''}
            alt={file.original_filename}
            className="max-w-full max-h-96 object-contain"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease'
            }}
            onError={() => setError('Failed to load image')}
          />
        </div>
      );
    }

    // PDF preview
    if (file.file_type === 'application/pdf') {
      return (
        <div className="h-96 bg-muted/20 rounded-lg">
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">PDF Preview</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click below to view or download the PDF file
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={() => window.open(previewUrl, '_blank')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View PDF
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => onDownload(file)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  PDF will open in a new browser tab
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Text preview
    if (textContent !== null) {
      return (
        <div className="bg-muted/20 rounded-lg p-4 max-h-96 overflow-auto">
          <pre className="text-sm whitespace-pre-wrap font-mono">
            {textContent}
          </pre>
        </div>
      );
    }

    return null;
  };

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            {getFileTypeIcon(file.file_type)}
            <DialogTitle className="truncate">{file.original_filename}</DialogTitle>
          </div>
          <DialogDescription>
            <div className="flex items-center space-x-4 text-sm">
              <span>{formatFileSize(file.file_size)}</span>
              <Badge variant="outline">{file.file_type}</Badge>
              <span>Uploaded by {file.uploaded_by_name}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Preview Controls */}
        {canPreview(file.file_type) && !isLoading && !error && (
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom('out')}
                disabled={zoom <= 25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-16 text-center">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom('in')}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              {file.file_type?.startsWith('image/') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(file)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}

        {/* Preview Content */}
        <div className="flex-1 overflow-auto">
          {renderPreviewContent()}
        </div>

        {/* File Details */}
        {file.description && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{file.description}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};