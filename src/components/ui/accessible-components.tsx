/**
 * Accessible Components
 * 
 * Provides accessible UI components with proper ARIA attributes,
 * keyboard navigation, and screen reader support.
 */

import React, { forwardRef, useId, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  Upload, 
  Download,
  Eye,
  Trash2,
  Search,
  X,
  Share
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    variant = 'default', 
    size = 'default', 
    isLoading = false, 
    loadingText,
    icon,
    children, 
    ariaLabel,
    ariaDescribedBy,
    className,
    disabled,
    ...props 
  }, ref) => {
    const buttonId = useId();
    
    return (
      <Button
        ref={ref}
        id={buttonId}
        variant={variant}
        size={size}
        className={className}
        disabled={isLoading || disabled}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-describedby={ariaDescribedBy}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <div 
              className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"
              aria-hidden="true"
            />
            <span className="sr-only">Loading</span>
            {loadingText || 'Loading...'}
          </>
        ) : (
          <>
            {icon && <span className="mr-2" aria-hidden="true">{icon}</span>}
            {children}
          </>
        )}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  showRequiredIndicator?: boolean;
  showLabel?: boolean;
  icon?: React.ReactNode;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    required = false,
    showRequiredIndicator = true,
    showLabel = true,
    icon,
    className,
    id,
    ...props 
  }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = useId();
    const helperId = useId();
    
    return (
      <div className="space-y-2">
        {showLabel && (
          <Label 
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium",
              error && "text-destructive"
            )}
          >
            {label}
            {required && showRequiredIndicator && (
              <span className="text-destructive ml-1" aria-label="required">*</span>
            )}
          </Label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <Input
            ref={ref}
            id={inputId}
            className={cn(
              className,
              error && "border-destructive focus:border-destructive",
              icon && "pl-10"
            )}
            aria-invalid={!!error}
            aria-describedby={[
              error ? errorId : undefined,
              helperText ? helperId : undefined
            ].filter(Boolean).join(' ') || undefined}
            aria-required={required}
            {...props}
          />
        </div>
        
        {error && (
          <div 
            id={errorId}
            className="flex items-center text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
            {error}
          </div>
        )}
        
        {helperText && !error && (
          <div 
            id={helperId}
            className="text-sm text-muted-foreground"
          >
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

interface AccessibleFileUploadProps {
  onFileSelect: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
  error?: string;
  helperText?: string;
}

export const AccessibleFileUpload: React.FC<AccessibleFileUploadProps> = ({
  onFileSelect,
  accept,
  multiple = false,
  maxSize,
  disabled = false,
  error,
  helperText
}) => {
  const inputId = useId();
  const errorId = useId();
  const helperId = useId();
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!disabled && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const formatMaxSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb}MB`;
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          isDragOver && !disabled && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-destructive",
          !disabled && "hover:border-primary/50 cursor-pointer"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        aria-label={`Upload ${multiple ? 'files' : 'file'}. ${accept ? `Accepted formats: ${accept}` : ''} ${maxSize ? `Maximum size: ${formatMaxSize(maxSize)}` : ''}`}
        aria-describedby={[
          error ? errorId : undefined,
          helperText ? helperId : undefined
        ].filter(Boolean).join(' ') || undefined}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-describedby={[
            error ? errorId : undefined,
            helperText ? helperId : undefined
          ].filter(Boolean).join(' ') || undefined}
        />
        
        <div className="text-center">
          <Upload 
            className={cn(
              "mx-auto h-12 w-12 mb-4",
              disabled ? "text-muted-foreground" : "text-primary"
            )} 
            aria-hidden="true"
          />
          <div className="text-lg font-medium mb-2">
            {isDragOver ? 'Drop files here' : 'Choose files or drag and drop'}
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            {accept && (
              <div>Accepted formats: {accept}</div>
            )}
            {maxSize && (
              <div>Maximum size: {formatMaxSize(maxSize)}</div>
            )}
            {multiple && (
              <div>You can select multiple files</div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div 
          id={errorId}
          className="flex items-center text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div 
          id={helperId}
          className="text-sm text-muted-foreground"
        >
          {helperText}
        </div>
      )}
    </div>
  );
};

interface AccessibleSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  resultsCount?: number;
}

export const AccessibleSearch: React.FC<AccessibleSearchProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  onClear,
  disabled = false,
  ariaLabel = "Search",
  resultsCount
}) => {
  const inputId = useId();
  const resultsId = useId();

  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" 
          aria-hidden="true"
        />
        <Input
          id={inputId}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10"
          aria-label={ariaLabel}
          aria-describedby={resultsCount !== undefined ? resultsId : undefined}
          role="searchbox"
          aria-expanded={value.length > 0}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={handleClear}
            disabled={disabled}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {resultsCount !== undefined && value && (
        <div 
          id={resultsId}
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          {resultsCount === 0 
            ? "No results found" 
            : `${resultsCount} result${resultsCount === 1 ? '' : 's'} found`
          }
        </div>
      )}
    </div>
  );
};

interface AccessibleAlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

export const AccessibleAlert: React.FC<AccessibleAlertProps> = ({
  type,
  title,
  message,
  onClose,
  className
}) => {
  const alertId = useId();
  
  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle
  };
  
  const Icon = icons[type];
  
  const variants = {
    info: "border-blue-200 bg-blue-50 text-blue-800",
    success: "border-green-200 bg-green-50 text-green-800",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
    error: "border-red-200 bg-red-50 text-red-800"
  };

  return (
    <div
      id={alertId}
      className={cn(
        "border rounded-lg p-4",
        variants[type],
        className
      )}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start">
        <Icon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="font-medium">{title}</h3>
          {message && (
            <p className="mt-1 text-sm opacity-90">{message}</p>
          )}
        </div>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-3 -mr-1 -mt-1 h-8 w-8 p-0 hover:bg-black/10"
            onClick={onClose}
            aria-label="Close alert"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

interface AccessibleFileActionButtonsProps {
  file: {
    id: string;
    name: string;
    mime_type: string;
  };
  onDownload: () => void;
  onPreview?: () => void;
  onAssign?: () => void;
  onDelete?: () => void;
  canPreview?: boolean;
  canAssign?: boolean;
  canDelete?: boolean;
  isLoading?: {
    download?: boolean;
    preview?: boolean;
    assign?: boolean;
    delete?: boolean;
  };
  layout?: 'horizontal' | 'vertical' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
}

export const AccessibleFileActionButtons: React.FC<AccessibleFileActionButtonsProps> = ({
  file,
  onDownload,
  onPreview,
  onAssign,
  onDelete,
  canPreview = false,
  canAssign = false,
  canDelete = false,
  isLoading = {},
  layout = 'horizontal',
  size = 'sm'
}) => {
  const buttonSize = size === 'lg' ? 'default' : size;
  const iconSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  // Dropdown layout for mobile/compact spaces
  if (layout === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={buttonSize}
            className="h-8 w-8 p-0"
            aria-label={`Actions for ${file.name}`}
          >
            <span className="sr-only">Open menu</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onDownload} disabled={isLoading.download}>
            <Download className="mr-2 h-4 w-4" />
            {isLoading.download ? 'Downloading...' : 'Download'}
          </DropdownMenuItem>
          
          {canPreview && onPreview && (
            <DropdownMenuItem onClick={onPreview} disabled={isLoading.preview}>
              <Eye className="mr-2 h-4 w-4" />
              {isLoading.preview ? 'Loading...' : 'Preview'}
            </DropdownMenuItem>
          )}
          
          {canAssign && onAssign && (
            <DropdownMenuItem onClick={onAssign} disabled={isLoading.assign}>
              <Share className="mr-2 h-4 w-4" />
              {isLoading.assign ? 'Assigning...' : 'Assign'}
            </DropdownMenuItem>
          )}
          
          {canDelete && onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDelete} 
                disabled={isLoading.delete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isLoading.delete ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Vertical layout
  if (layout === 'vertical') {
    return (
      <div className="flex flex-col space-y-2" role="group" aria-label={`Actions for ${file.name}`}>
        <AccessibleButton
          variant="outline"
          size={buttonSize}
          onClick={onDownload}
          isLoading={isLoading.download}
          loadingText="Downloading..."
          icon={<Download className={iconSize} />}
          ariaLabel={`Download ${file.name}`}
          className="w-full justify-start"
        >
          Download
        </AccessibleButton>
        
        {canPreview && onPreview && (
          <AccessibleButton
            variant="outline"
            size={buttonSize}
            onClick={onPreview}
            isLoading={isLoading.preview}
            loadingText="Loading..."
            icon={<Eye className={iconSize} />}
            ariaLabel={`Preview ${file.name}`}
            className="w-full justify-start"
          >
            Preview
          </AccessibleButton>
        )}
        
        {canAssign && onAssign && (
          <AccessibleButton
            variant="default"
            size={buttonSize}
            onClick={onAssign}
            isLoading={isLoading.assign}
            loadingText="Assigning..."
            icon={<Share className={iconSize} />}
            ariaLabel={`Assign ${file.name}`}
            className="w-full justify-start bg-primary hover:bg-primary/90"
          >
            Assign
          </AccessibleButton>
        )}
        
        {canDelete && onDelete && (
          <AccessibleButton
            variant="destructive"
            size={buttonSize}
            onClick={onDelete}
            isLoading={isLoading.delete}
            loadingText="Deleting..."
            icon={<Trash2 className={iconSize} />}
            ariaLabel={`Delete ${file.name}`}
            className="w-full justify-start"
          >
            Delete
          </AccessibleButton>
        )}
      </div>
    );
  }

  // Horizontal layout (default) - Improved with better spacing and hierarchy
  return (
    <div className="flex items-center gap-2" role="group" aria-label={`Actions for ${file.name}`}>
      {/* Primary Action - Download */}
      <AccessibleButton
        variant="outline"
        size={buttonSize}
        onClick={onDownload}
        isLoading={isLoading.download}
        loadingText="Downloading..."
        icon={<Download className={iconSize} />}
        ariaLabel={`Download ${file.name}`}
        className="flex-shrink-0"
      >
        <span className="hidden sm:inline">Download</span>
      </AccessibleButton>
      
      {/* Secondary Actions */}
      <div className="flex items-center gap-1">
        {canPreview && onPreview && (
          <AccessibleButton
            variant="ghost"
            size={buttonSize}
            onClick={onPreview}
            isLoading={isLoading.preview}
            loadingText="Loading..."
            icon={<Eye className={iconSize} />}
            ariaLabel={`Preview ${file.name}`}
            className="flex-shrink-0"
          >
            <span className="hidden md:inline">Preview</span>
          </AccessibleButton>
        )}
        
        {canAssign && onAssign && (
          <AccessibleButton
            variant="default"
            size={buttonSize}
            onClick={onAssign}
            isLoading={isLoading.assign}
            loadingText="Assigning..."
            icon={<Share className={iconSize} />}
            ariaLabel={`Assign ${file.name}`}
            className="flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <span className="hidden sm:inline">Assign</span>
          </AccessibleButton>
        )}
        
        {canDelete && onDelete && (
          <AccessibleButton
            variant="ghost"
            size={buttonSize}
            onClick={onDelete}
            isLoading={isLoading.delete}
            loadingText="Deleting..."
            icon={<Trash2 className={iconSize} />}
            ariaLabel={`Delete ${file.name}`}
            className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <span className="hidden lg:inline">Delete</span>
          </AccessibleButton>
        )}
      </div>
    </div>
  );
};

// Skip to content link for keyboard navigation
export const SkipToContent: React.FC = () => {
  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
        "bg-primary text-primary-foreground px-4 py-2 rounded-md",
        "z-50 font-medium"
      )}
    >
      Skip to main content
    </a>
  );
};

// Announce live region updates to screen readers
export const LiveRegion: React.FC<{
  message: string;
  priority?: 'polite' | 'assertive';
}> = ({ message, priority = 'polite' }) => {
  return (
    <div
      className="sr-only"
      aria-live={priority}
      aria-atomic="true"
    >
      {message}
    </div>
  );
};