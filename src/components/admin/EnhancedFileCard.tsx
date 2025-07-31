import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AccessibleFileActionButtons } from '@/components/ui/accessible-components';
import { DeleteFileDialog } from '@/components/ui/confirmation-dialog';
import { ComponentErrorBoundary } from '@/components/ui/error-boundary';
import {
  Clock,
  User,
  HardDrive,
  Download,
  Eye,
  Share,
  Trash2,
  FileText,
  Image,
  FileSpreadsheet,
  FileVideo,
  Archive,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ManagedFile } from '@/hooks/useFileManagement';

/**
 * Enhanced FileCard Component for Admin Panel
 * 
 * Purpose: Improved file card with better UI/UX for admin operations
 * Features:
 * - Better visual hierarchy
 * - Prominent assign button
 * - Flexible action layouts
 * - Mobile-responsive design
 * - Enhanced file type indicators
 */

interface EnhancedFileCardProps {
  file: ManagedFile;
  onDownload: (file: ManagedFile) => void;
  onPreview: (file: ManagedFile) => void;
  onAssign: (file: ManagedFile) => void;
  onDelete: (fileId: string) => void;
  canManage?: boolean;
  isLoading?: boolean;
  viewMode?: 'grid' | 'list' | 'compact';
  isSelected?: boolean;
  onSelect?: (fileId: string) => void;
}

export const EnhancedFileCard: React.FC<EnhancedFileCardProps> = ({
  file,
  onDownload,
  onPreview,
  onAssign,
  onDelete,
  canManage = false,
  isLoading = false,
  viewMode = 'grid',
  isSelected = false,
  onSelect
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
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  // Get enhanced file icon
  const getFileIcon = (mimeType: string | undefined | null) => {
    if (!mimeType) return <FileText className="h-8 w-8 text-muted-foreground" />;
    
    if (mimeType.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="h-8 w-8 text-blue-600" />;
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
    } else if (mimeType.includes('video')) {
      return <FileVideo className="h-8 w-8 text-purple-500" />;
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) {
      return <Archive className="h-8 w-8 text-orange-500" />;
    } else {
      return <FileText className="h-8 w-8 text-muted-foreground" />;
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'client':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'user':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  // Compact view for mobile/tight spaces
  if (viewMode === 'compact') {
    return (
      <ComponentErrorBoundary componentName="EnhancedFileCard">
        <Card className={`hover:shadow-md transition-all ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getFileIcon(file.file_type)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">
                    {file.original_filename}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>•</span>
                    <span>{formatDate(file.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Compact Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onDownload(file)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  
                  {canPreview(file.file_type) && (
                    <DropdownMenuItem onClick={() => onPreview(file)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </DropdownMenuItem>
                  )}
                  
                  {canManage && (
                    <DropdownMenuItem onClick={() => onAssign(file)}>
                      <Share className="mr-2 h-4 w-4" />
                      Assign
                    </DropdownMenuItem>
                  )}
                  
                  {canManage && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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

  // List view
  if (viewMode === 'list') {
    return (
      <ComponentErrorBoundary componentName="EnhancedFileCard">
        <Card className={`hover:shadow-md transition-all ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                {/* File Icon */}
                <div className="flex-shrink-0">
                  {getFileIcon(file.file_type)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate mb-1">
                    {file.original_filename}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <HardDrive className="h-4 w-4" />
                      <span>{formatFileSize(file.file_size)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(file.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{file.uploaded_by_name || 'Unknown User'}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getRoleBadgeColor(file.uploaded_by_role || 'unknown')}`}
                    >
                      {file.uploaded_by_role}
                    </Badge>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <div className="text-center">
                    <div className="font-medium">{file.assignment_count || 0}</div>
                    <div className="text-xs">Assignments</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{file.access_count || 0}</div>
                    <div className="text-xs">Downloads</div>
                  </div>
                </div>
              </div>

              {/* Enhanced Actions */}
              <div className="flex items-center space-x-2 ml-6">
                {/* Primary Action - Assign (for admins) */}
                {canManage && (
                  <Button
                    onClick={() => onAssign(file)}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Share className="mr-2 h-4 w-4" />
                    Assign
                  </Button>
                )}

                {/* Secondary Actions */}
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(file)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>

                  {canPreview(file.file_type) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPreview(file)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}

                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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

  // Grid view (default) - Enhanced for better admin experience
  return (
    <ComponentErrorBoundary componentName="EnhancedFileCard">
      <Card className={`hover:shadow-lg transition-all duration-200 ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
        <CardContent className="p-5">
          <div className="space-y-4">
            {/* Header with icon and title */}
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0">
                  {getFileIcon(file.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate mb-2">
                    {file.original_filename}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <HardDrive className="h-4 w-4" />
                        <span>{formatFileSize(file.file_size)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(file.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
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
                  </div>
                </div>
              </div>
            </div>

            {/* File Stats */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4 text-muted-foreground">
                <span>{file.assignment_count || 0} assignments</span>
                <span>{file.access_count || 0} downloads</span>
              </div>
              {file.last_accessed && (
                <span className="text-xs text-muted-foreground">
                  Last accessed {formatDate(file.last_accessed)}
                </span>
              )}
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-col space-y-2 pt-2 border-t">
              {/* Primary Action - Assign */}
              {canManage && (
                <Button
                  onClick={() => onAssign(file)}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  <Share className="mr-2 h-4 w-4" />
                  Assign File
                </Button>
              )}

              {/* Secondary Actions */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(file)}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>

                {canPreview(file.file_type) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPreview(file)}
                    className="flex-1"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                )}

                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* File Description */}
          {file.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {file.description}
              </p>
            </div>
          )}

          {/* File Tags */}
          {file.tags && file.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
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