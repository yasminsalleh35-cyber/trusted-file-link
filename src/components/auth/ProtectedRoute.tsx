import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { clearAuthAndReload } from '@/lib/auth-utils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'client' | 'user')[];
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 * 
 * Purpose: Protects routes based on authentication and role-based access
 * Features:
 * - Redirects unauthenticated users to login
 * - Enforces role-based access control
 * - Preserves intended destination for post-login redirect
 * - Shows loading state during authentication check
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ['admin', 'client', 'user'],
  redirectTo = '/login'
}) => {
  const { user, isLoading, isAuthenticated, recoverAuthState } = useAuth();
  const location = useLocation();
  const [showRecovery, setShowRecovery] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  // Show recovery options after 10 seconds of loading
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowRecovery(true);
      }, 10000);

      return () => clearTimeout(timer);
    } else {
      setShowRecovery(false);
    }
  }, [isLoading]);

  // Handle auth recovery
  const handleRecovery = async () => {
    setIsRecovering(true);
    try {
      const result = await recoverAuthState();
      if (!result.success) {
        console.log('Recovery failed, clearing auth data');
        clearAuthAndReload();
      }
    } catch (error) {
      console.error('Recovery error:', error);
      clearAuthAndReload();
    } finally {
      setIsRecovering(false);
    }
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
          
          {showRecovery && (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-muted-foreground">
                Taking longer than expected?
              </p>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRecovery}
                  disabled={isRecovering}
                >
                  {isRecovering ? 'Recovering...' : 'Try Recovery'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearAuthAndReload}
                >
                  Clear & Reload
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (!allowedRoles.includes(user.role as 'admin' | 'client' | 'user')) {
    // Redirect to appropriate dashboard based on user's actual role
    const roleRedirects = {
      admin: '/admin/dashboard',
      client: '/client/dashboard', 
      user: '/user/dashboard'
    };
    
    return <Navigate to={roleRedirects[user.role as keyof typeof roleRedirects]} replace />;
  }

  // User is authenticated and has proper role - render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;