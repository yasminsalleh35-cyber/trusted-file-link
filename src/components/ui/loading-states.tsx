/**
 * Loading States and User Feedback Components
 * 
 * Provides consistent loading indicators, progress bars, and user feedback
 * throughout the application.
 */

import React from 'react';
import { Loader2, Upload, Download, Eye, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={cn('animate-spin', sizeClasses[size], className)} 
    />
  );
};

interface LoadingButtonProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  loadingText,
  children,
  icon,
  variant = 'default',
  size = 'default',
  className,
  disabled,
  onClick
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={isLoading || disabled}
      onClick={onClick}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText || 'Loading...'}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </Button>
  );
};

interface FileOperationButtonProps {
  operation: 'upload' | 'download' | 'preview' | 'delete';
  isLoading: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export const FileOperationButton: React.FC<FileOperationButtonProps> = ({
  operation,
  isLoading,
  onClick,
  disabled,
  size = 'sm',
  variant = 'outline',
  className
}) => {
  const config = {
    upload: {
      icon: <Upload className="h-4 w-4" />,
      text: 'Upload',
      loadingText: 'Uploading...'
    },
    download: {
      icon: <Download className="h-4 w-4" />,
      text: 'Download',
      loadingText: 'Downloading...'
    },
    preview: {
      icon: <Eye className="h-4 w-4" />,
      text: 'Preview',
      loadingText: 'Loading...'
    },
    delete: {
      icon: <Trash2 className="h-4 w-4" />,
      text: 'Delete',
      loadingText: 'Deleting...',
      variant: 'destructive' as const
    }
  };

  const { icon, text, loadingText, variant: defaultVariant } = config[operation];

  return (
    <LoadingButton
      isLoading={isLoading}
      loadingText={loadingText}
      icon={icon}
      variant={defaultVariant || variant}
      size={size}
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      {text}
    </LoadingButton>
  );
};

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  className
}) => {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={cn('space-y-2', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm">
          {label && <span>{label}</span>}
          {showPercentage && <span>{percentage}%</span>}
        </div>
      )}
      <Progress value={percentage} className="h-2" />
    </div>
  );
};

interface FileUploadProgressProps {
  files: Array<{
    name: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
  }>;
  className?: string;
}

export const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  files,
  className
}) => {
  if (files.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {files.map((file, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate flex-1 mr-2">{file.name}</span>
            <div className="flex items-center space-x-2">
              {file.status === 'uploading' && (
                <LoadingSpinner size="sm" />
              )}
              {file.status === 'completed' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {file.status === 'error' && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {file.progress}%
              </span>
            </div>
          </div>
          <Progress 
            value={file.progress} 
            className={cn(
              'h-1',
              file.status === 'error' && 'bg-red-100',
              file.status === 'completed' && 'bg-green-100'
            )}
          />
          {file.status === 'error' && file.error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {file.error}
              </AlertDescription>
            </Alert>
          )}
        </div>
      ))}
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  children,
  className
}) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-2">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {icon && (
        <div className="mb-4 p-3 bg-muted rounded-full">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4 max-w-md">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

interface OperationFeedbackProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline';
  }>;
  className?: string;
}

export const OperationFeedback: React.FC<OperationFeedbackProps> = ({
  type,
  title,
  message,
  actions,
  className
}) => {
  const variants = {
    success: 'default',
    error: 'destructive',
    warning: 'default',
    info: 'default'
  } as const;

  const icons = {
    success: <CheckCircle className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />,
    info: <AlertCircle className="h-4 w-4" />
  };

  return (
    <Alert variant={variants[type]} className={className}>
      {icons[type]}
      <AlertDescription>
        <div className="space-y-2">
          <div>
            <strong>{title}</strong>
            {message && <p className="text-sm mt-1">{message}</p>}
          </div>
          {actions && actions.length > 0 && (
            <div className="flex space-x-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.variant || 'outline'}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};