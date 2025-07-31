/**
 * Confirmation Dialog Components
 * 
 * Provides consistent confirmation dialogs for destructive actions
 * and important operations throughout the application.
 */

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { AlertTriangle, Trash2, Upload, Download, UserX } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default';
  icon?: React.ReactNode;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirmation action failed:', error);
      // Error handling is done by the parent component
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface DeleteFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  fileName: string;
  fileCount?: number;
}

export const DeleteFileDialog: React.FC<DeleteFileDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  fileCount = 1
}) => {
  const isMultiple = fileCount > 1;
  
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={isMultiple ? `Delete ${fileCount} Files` : 'Delete File'}
      description={
        isMultiple
          ? `Are you sure you want to delete ${fileCount} files? This action cannot be undone.`
          : `Are you sure you want to delete "${fileName}"? This action cannot be undone.`
      }
      confirmText="Delete"
      variant="destructive"
      icon={<Trash2 className="h-5 w-5 text-destructive" />}
    />
  );
};

interface RemoveUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userName: string;
  userRole: string;
}

export const RemoveUserDialog: React.FC<RemoveUserDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  userRole
}) => {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Remove User"
      description={`Are you sure you want to remove ${userName} (${userRole}) from the team? They will lose access to all assigned files.`}
      confirmText="Remove User"
      variant="destructive"
      icon={<UserX className="h-5 w-5 text-destructive" />}
    />
  );
};

interface BulkOperationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  operation: 'delete' | 'assign' | 'download';
  itemCount: number;
  itemType: string;
}

export const BulkOperationDialog: React.FC<BulkOperationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  operation,
  itemCount,
  itemType
}) => {
  const config = {
    delete: {
      title: `Delete ${itemCount} ${itemType}${itemCount > 1 ? 's' : ''}`,
      description: `Are you sure you want to delete ${itemCount} ${itemType}${itemCount > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete All',
      variant: 'destructive' as const,
      icon: <Trash2 className="h-5 w-5 text-destructive" />
    },
    assign: {
      title: `Assign ${itemCount} ${itemType}${itemCount > 1 ? 's' : ''}`,
      description: `Are you sure you want to assign ${itemCount} ${itemType}${itemCount > 1 ? 's' : ''} to the selected users/clients?`,
      confirmText: 'Assign All',
      variant: 'default' as const,
      icon: <Upload className="h-5 w-5 text-primary" />
    },
    download: {
      title: `Download ${itemCount} ${itemType}${itemCount > 1 ? 's' : ''}`,
      description: `This will download ${itemCount} ${itemType}${itemCount > 1 ? 's' : ''} to your device. Continue?`,
      confirmText: 'Download All',
      variant: 'default' as const,
      icon: <Download className="h-5 w-5 text-primary" />
    }
  };

  const { title, description, confirmText, variant, icon } = config[operation];

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmText={confirmText}
      variant={variant}
      icon={icon}
    />
  );
};

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  onDiscard: () => void;
  message?: string;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  message = "You have unsaved changes. What would you like to do?"
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave();
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    onDiscard();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="space-x-2">
          <Button
            variant="outline"
            onClick={handleDiscard}
            disabled={isSaving}
          >
            Discard Changes
          </Button>
          <AlertDialogCancel disabled={isSaving}>
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Hook for managing confirmation dialogs
export const useConfirmationDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => Promise<void> | void;
    confirmText?: string;
    variant?: 'destructive' | 'default';
    icon?: React.ReactNode;
  } | null>(null);

  const showConfirmation = (newConfig: typeof config) => {
    setConfig(newConfig);
    setIsOpen(true);
  };

  const hideConfirmation = () => {
    setIsOpen(false);
    setConfig(null);
  };

  const ConfirmationDialogComponent = config ? (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={hideConfirmation}
      onConfirm={config.onConfirm}
      title={config.title}
      description={config.description}
      confirmText={config.confirmText}
      variant={config.variant}
      icon={config.icon}
    />
  ) : null;

  return {
    showConfirmation,
    hideConfirmation,
    ConfirmationDialog: ConfirmationDialogComponent
  };
};