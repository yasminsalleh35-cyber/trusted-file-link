import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Lock, Building2, Shield, User, Users } from 'lucide-react';

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
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  // Form state management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'admin' | 'client' | 'user'>('admin');
  const [isHuman, setIsHuman] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Role-specific configuration for UI customization
  const roleConfig = {
    admin: {
      title: 'Admin Portal',
      description: 'Manage clients, users, and system settings',
      icon: <Shield className="h-6 w-6 text-admin" />,
      buttonClass: 'bg-admin hover:bg-admin/90',
      accentColor: 'border-l-4 border-l-admin'
    },
    client: {
      title: 'Client Portal',
      description: 'Manage your team and access your files',
      icon: <Building2 className="h-6 w-6 text-client" />,
      buttonClass: 'bg-client hover:bg-client/90',
      accentColor: 'border-l-4 border-l-client'
    },
    user: {
      title: 'User Portal',
      description: 'Access your assigned files and messages',
      icon: <User className="h-6 w-6 text-user" />,
      buttonClass: 'bg-user hover:bg-user/90',
      accentColor: 'border-l-4 border-l-user'
    }
  };

  const config = roleConfig[userType];

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Basic validation
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Human verification check
      if (!isHuman) {
        throw new Error('Please verify that you are human');
      }

      // TODO: Integrate with Supabase authentication
      // For now, simulate authentication logic
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful login - replace with actual Supabase auth
      onLogin({
        email,
        role: userType,
        clientId: userType !== 'admin' ? 'mock-client-id' : undefined
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
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
              <Select value={userType} onValueChange={(value: 'admin' | 'client' | 'user') => setUserType(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-admin" />
                      <span>Admin - Full System Access</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="client">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-client" />
                      <span>Client - Team Management</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-user" />
                      <span>User - File Access</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

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
            <Button
              type="submit"
              className={`w-full ${config.buttonClass}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Need help? Contact your administrator
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};