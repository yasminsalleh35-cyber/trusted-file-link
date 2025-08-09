import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Lock, Building2, Shield, User, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AccessibleInput, AccessibleButton } from '@/components/ui/accessible-components';
import { validateEmail, validatePassword, sanitizeInput } from '@/utils/validation';
import { useErrorHandler } from '@/components/ui/error-boundary';

/**
 * LoginForm Component
 * 
 * Purpose: Handles user authentication for all three roles (Admin, Client, User)
 * Features:
 * - Email/password authentication
 * - Role-based login logic
 * - Form validation
 * - Loading states
 * - Error handling
 * 
 * Props:
 * - onLogin: Callback function when login is successful
 * - userType: 'admin' | 'client' | 'user' - determines UI styling and behavior
 */

interface LoginFormProps {
  onLogin: (userData: { email: string; role: string; clientId?: string }) => void;
  onRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onRegister }) => {
  // Get auth hook for real authentication
  const { signIn } = useAuth();
  const { handleError } = useErrorHandler();
  
  // Form state management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'admin' | 'client' | 'user'>('admin');
  const [isHuman, setIsHuman] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{email?: string; password?: string}>({});

  // Role-specific configuration for UI customization
  const roleConfig = {
    admin: {
      title: 'Mining HQ Portal',
      description: 'Oversee mining operations, manage companies and workers',
      icon: <Shield className="h-6 w-6 text-admin" />,
      buttonClass: 'bg-admin hover:bg-admin/90',
      accentColor: 'border-l-4 border-l-admin'
    },
    client: {
      title: 'Mining Site Portal',
      description: 'Manage your mining crew and operational resources',
      icon: <Building2 className="h-6 w-6 text-client" />,
      buttonClass: 'bg-client hover:bg-client/90',
      accentColor: 'border-l-4 border-l-client'
    },
    user: {
      title: 'Miner Portal',
      description: 'Access safety documents and site communications',
      icon: <User className="h-6 w-6 text-user" />,
      buttonClass: 'bg-user hover:bg-user/90',
      accentColor: 'border-l-4 border-l-user'
    }
  };

  const config = roleConfig[userType];

  // Handle user type change - just update the selected type
  const handleUserTypeChange = (value: 'admin' | 'client' | 'user') => {
    setUserType(value);
    // Don't auto-fill credentials - user enters their own
  };

  // Handle input changes with validation
  const handleEmailChange = (value: string) => {
    const sanitized = sanitizeInput(value);
    setEmail(sanitized);
    
    // Real-time validation
    try {
      validateEmail(sanitized);
      setFieldErrors(prev => ({ ...prev, email: undefined }));
    } catch (error) {
      setFieldErrors(prev => ({ ...prev, email: error instanceof Error ? error.message : 'Invalid email' }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    
    // Real-time validation
    try {
      validatePassword(value);
      setFieldErrors(prev => ({ ...prev, password: undefined }));
    } catch (error) {
      setFieldErrors(prev => ({ ...prev, password: error instanceof Error ? error.message : 'Invalid password' }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsLoading(true);

    try {
      // Comprehensive validation
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      // Validate email
      validateEmail(email);
      
      // Validate password
      validatePassword(password);

      // Human verification check
      if (!isHuman) {
        throw new Error('Please verify that you are human');
      }

      // Use real Supabase authentication with demo login validation
      const result = await signIn({
        email: sanitizeInput(email),
        password,
        selectedDemoLogin: userType
      });

      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      // The useAuth hook will automatically update the user state
      // No need to call onLogin as the auth state change will trigger re-render

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      handleError(err instanceof Error ? err : new Error(errorMessage), 'LoginForm');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 p-4">
      <Card className={`w-full max-w-md shadow-lg ${config.accentColor}`}>
        <CardHeader className="space-y-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            {config.icon}
            <CardTitle className="text-2xl font-bold">{config.title}</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            {config.description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Demo Login As Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Demo Login As</Label>
              <Select value={userType} onValueChange={handleUserTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-admin" />
                      <span>Mining HQ - Full Operations Control</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="client">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-client" />
                      <span>Mining Site - Crew Management</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-user" />
                      <span>Miner - Safety & Documents</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Input */}
            <AccessibleInput
              id="email"
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              disabled={isLoading}
              required
              error={fieldErrors.email}
              helperText="Enter your registered email address"
            />

            {/* Password Input */}
            <AccessibleInput
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              disabled={isLoading}
              required
              error={fieldErrors.password}
              helperText="Enter your account password"
            />

            {/* Human Verification */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Verify Human</Label>
              <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/20">
                <Checkbox 
                  id="human-verify"
                  checked={isHuman}
                  onCheckedChange={(checked) => setIsHuman(checked as boolean)}
                />
                <Label htmlFor="human-verify" className="text-sm cursor-pointer">
                  I'm not a robot (Demo verification)
                </Label>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <AccessibleButton
              type="submit"
              className={`w-full ${config.buttonClass}`}
              disabled={isLoading || !!fieldErrors.email || !!fieldErrors.password}
              isLoading={isLoading}
              loadingText="Signing In..."
              ariaLabel={`Sign in as ${userType}`}
            >
              Sign In
            </AccessibleButton>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Demo Mining Access:</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Mining HQ:</strong> admin@financehub.com / urL!fKNZ8GSn</p>
              <p><strong>Site Manager:</strong> testclient@example.com / urL!fKNZ8GSn</p>
              <p><strong>Miner:</strong> testuser@example.com / urL!fKNZ8GSn</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Select your mining role above and use the matching credentials
            </p>
          </div>

          {/* Registration Link */}
          {onRegister && (
            <div className="mt-4 text-center">
              <Button
                type="button"
                variant="link"
                onClick={onRegister}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Don't have an account? Register here
              </Button>
            </div>
          )}

          {/* Additional Links */}
          <div className="mt-2 text-center">
            <p className="text-sm text-muted-foreground">
              Need help? Contact Mining HQ Support
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};