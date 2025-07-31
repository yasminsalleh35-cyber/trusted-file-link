import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AccessibleFileActionButtons } from '@/components/ui/accessible-components';
import { DeleteFileDialog } from '@/components/ui/confirmation-dialog';
import { ComponentErrorBoundary } from '@/components/ui/error-boundary';
import {
  Clock,
  User,
  HardDrive
} from 'lucide-react';
import type { ManagedFile } from '@/hooks/useFileManagement';

/**
 * FileCard Component
 * 
 * Purpose: Display file information with management actions
 * Features:
 * - File details display
 * - Download and preview actions
 * - Assignment management
 * - Delete functionality
 * - Access statistics
 */

interface FileCardProps {
  file: ManagedFile;
  onDownload: (file: ManagedFile) => void;
  onPreview: (file: ManagedFile) => void;
  onAssign: (file: ManagedFile) => void;
  onDelete: (fileId: string) => void;
  canManage?: boolean;
  isLoading?: boolean;
  viewMode?: 'grid' | 'list';
  isSelected?: boolean;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onDownload,
  onPreview,
  onAssign,
  onDelete,
  canManage = false,
  isLoading = false,
  viewMode = 'grid',
  isSelected = false
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string | undefined | null) => {
    if (!mimeType) return '📄'; // Default icon for unknown types
    
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType.includes('pdf')) {
      return '📄';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return '📝';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return '📊';
    } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
      return '📽️';
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) {
      return '🗜️';
    } else {
      return '📁';
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-admin/10 text-admin border-admin/20';
      case 'client':
        return 'bg-client/10 text-client border-client/20';
      case 'user':
        return 'bg-user/10 text-user border-user/20';
      default:
        return 'bg-muted';
    }
  };

  // Check if file can be previewed
  const canPreview = (mimeType: string | undefined | null) => {
    if (!mimeType) return false;
    return mimeType.startsWith('image/') || 
           mimeType === 'application/pdf' ||
           mimeType.startsWith('text/');
  };

  // Handle delete confirmation
  const handleDelete = () => {
    onDelete(file.id);
    setShowDeleteDialog(false);
  };

  // List view component
  if (viewMode === 'list') {
    return (
      <ComponentErrorBoundary componentName="FileCard">
        <Card className={`hover:shadow-md transition-all ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                {/* File Icon */}
                <div className="text-xl">
                  {getFileIcon(file.file_type)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">
                    {file.original_filename}
                  </h3>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>{formatDate(file.created_at)}</span>
                    <span>{file.uploaded_by_name || 'Unknown User'}</span>
                    <Badge variant="outline" className="text-xs">
                      {file.uploaded_by_role}
                    </Badge>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>{file.assignment_count || 0} assignments</span>
                  <span>{file.access_count || 0} downloads</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center ml-4">
                <AccessibleFileActionButtons
                  file={{
                    id: file.id,
                    name: file.original_filename,
                    mimeType: file.file_type || ''
                  }}
                  onDownload={() => onDownload(file)}
                  onPreview={() => onPreview(file)}
                  onAssign={canManage ? () => onAssign(file) : undefined}
                  onDelete={canManage ? () => setShowDeleteDialog(true) : undefined}
                  canPreview={canPreview(file.file_type)}
                  canAssign={canManage}
                  canDelete={canManage}
                  layout="dropdown"
                  size="sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <DeleteFileDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          fileName={file.original_filename}
        />
      </ComponentErrorBoundary>
    );
  }

  // Grid view component (default)
  return (
    <ComponentErrorBoundary componentName="FileCard">
      <Card className={`hover:shadow-md transition-all ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* File Icon */}
              <div className="text-2xl">
                {getFileIcon(file.file_type)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate mb-1">
                  {file.original_filename}
                </h3>
                
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                  <HardDrive className="h-3 w-3" />
                  <span>{formatFileSize(file.file_size)}</span>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(file.created_at)}</span>
                </div>

                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {file.uploaded_by_name || 'Unknown User'}
                    </span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getRoleBadgeColor(file.uploaded_by_role || 'unknown')}`}
                  >
                    {file.uploaded_by_role}
                  </Badge>
                </div>

                {/* File Stats */}
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>{file.assignment_count || 0} assignments</span>
                  <span>{file.access_count || 0} downloads</span>
                  {file.last_accessed && (
                    <span>Last accessed {formatDate(file.last_accessed)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end space-y-2 ml-4">
              <AccessibleFileActionButtons
                file={{
                  id: file.id,
                  name: file.original_filename,
                  mimeType: file.file_type || ''
                }}
                onDownload={() => onDownload(file)}
                onPreview={() => onPreview(file)}
                onAssign={canManage ? () => onAssign(file) : undefined}
                onDelete={canManage ? () => setShowDeleteDialog(true) : undefined}
                canPreview={canPreview(file.file_type)}
                canAssign={canManage}
                canDelete={canManage}
                layout="vertical"
                size="sm"
              />
            </div>
          </div>

          {/* File Description */}
          {file.description && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                {file.description}
              </p>
            </div>
          )}

          {/* File Tags */}
          {file.tags && file.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {file.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteFileDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        fileName={file.original_filename}
      />
    </ComponentErrorBoundary>
  );
};