/**
 * Error Boundary Components
 * 
 * Provides error boundaries to catch and handle React errors gracefully,
 * preventing the entire application from crashing.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { errorLogger } from '@/utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error to our error logging system
    errorLogger.log(error, 'ErrorBoundary', undefined);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const { error, errorInfo } = this.state;
    const errorReport = {
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In a real app, you would send this to your error reporting service
    console.log('Error Report:', errorReport);
    
    // For now, copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
    alert('Error report copied to clipboard. Please send this to support.');
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  An unexpected error occurred. The application encountered a problem and needs to recover.
                </AlertDescription>
              </Alert>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="space-y-2">
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium">
                      Error Details (Development)
                    </summary>
                    <div className="mt-2 p-3 bg-muted rounded text-xs font-mono overflow-auto max-h-32">
                      <div className="text-destructive font-bold">
                        {this.state.error.name}: {this.state.error.message}
                      </div>
                      <pre className="mt-2 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  </details>
                </div>
              )}

              <div className="flex flex-col space-y-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={this.handleReportBug}
                  className="w-full text-xs"
                >
                  <Bug className="mr-2 h-3 w-3" />
                  Report Bug
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different parts of the app

interface FileOperationErrorBoundaryProps {
  children: ReactNode;
  operation: string;
}

export const FileOperationErrorBoundary: React.FC<FileOperationErrorBoundaryProps> = ({
  children,
  operation
}) => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error(`File operation error in ${operation}:`, error, errorInfo);
  };

  const fallback = (
    <Alert variant="destructive" className="m-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <div>
            <strong>File Operation Failed</strong>
          </div>
          <p className="text-sm">
            The {operation} operation encountered an error. Please try refreshing the page.
          </p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Refresh Page
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );

  return (
    <ErrorBoundary fallback={fallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  componentName: string;
  fallbackMessage?: string;
}

export const ComponentErrorBoundary: React.FC<ComponentErrorBoundaryProps> = ({
  children,
  componentName,
  fallbackMessage
}) => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error(`Component error in ${componentName}:`, error, errorInfo);
  };

  const fallback = (
    <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
      <div className="flex items-center space-x-2 text-destructive mb-2">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-medium">Component Error</span>
      </div>
      <p className="text-sm text-muted-foreground">
        {fallbackMessage || `The ${componentName} component failed to load.`}
      </p>
      <Button 
        size="sm" 
        variant="outline" 
        className="mt-2"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="mr-2 h-3 w-3" />
        Reload
      </Button>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};

// Hook for handling async errors in components
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error('Async error:', error);
    errorLogger.log(error, context);
    
    // You could also trigger a toast notification here
    // toast({
    //   title: "Error",
    //   description: getUserFriendlyMessage(error),
    //   variant: "destructive",
    // });
  };

  return { handleError };
};