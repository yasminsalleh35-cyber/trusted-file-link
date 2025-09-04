import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Lock, User, Building2, Shield, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { validatePassword } from '@/utils/validation';

/**
 * RegistrationForm Component
 * 
 * Purpose: Handle user registration for different roles
 * Features:
 * - Email/password registration
 * - Role selection (admin, client, user)
 * - Client assignment for users
 * - Form validation
 * - Loading states
 * - Error handling
 */

interface RegistrationFormProps {
  onRegistrationSuccess: () => void;
  onBackToLogin: () => void;
  allowedRoles?: ('admin' | 'client' | 'user')[];
  defaultRole?: 'admin' | 'client' | 'user';
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ 
  onRegistrationSuccess, 
  onBackToLogin,
  allowedRoles = ['client', 'user'], // Default: no admin registration
  defaultRole = 'user'
}) => {
  const { signUp } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: defaultRole,
    companyName: '', // For client registration
    clientId: '', // For user registration (which client they belong to)
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Available clients for user registration (fetched from database)
  const [availableClients, setAvailableClients] = useState<Array<{id: string, company_name: string}>>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Fetch available clients from database
  useEffect(() => {
    const fetchClients = async () => {
      if (allowedRoles.includes('user')) {
        setLoadingClients(true);
        try {
          const { data: clients, error } = await supabase
            .from('clients')
            .select('id, company_name')
            .order('company_name');

          if (error) {
            console.error('Error fetching clients:', error);
            setError('Failed to load available companies');
          } else if (clients) {
            // Remove duplicates based on company_name (case-insensitive)
            const uniqueClients = clients.reduce((acc: Array<{id: string, company_name: string}>, current) => {
              const existingClient = acc.find(client => 
                client.company_name.toLowerCase() === current.company_name.toLowerCase()
              );
              
              if (!existingClient) {
                acc.push(current);
              }
              
              return acc;
            }, []);

            setAvailableClients(uniqueClients);
          }
        } catch (err) {
          console.error('Exception fetching clients:', err);
          setError('Failed to load available companies');
        } finally {
          setLoadingClients(false);
        }
      }
    };

    fetchClients();
  }, [allowedRoles]);

  // Role configuration
  const roleConfig = {
    admin: {
      title: 'Administrator Registration',
      description: 'Create a new mining headquarters administrator account',
      icon: <Shield className="h-6 w-6 text-admin" />,
      buttonClass: 'bg-admin hover:bg-admin/90',
      accentColor: 'border-l-4 border-l-admin'
    },
    client: {
      title: 'Client Registration',
      description: 'Register your mining company and create a site manager account',
      icon: <Building2 className="h-6 w-6 text-client" />,
      buttonClass: 'bg-client hover:bg-client/90',
      accentColor: 'border-l-4 border-l-client'
    },
    user: {
      title: 'User Registration',
      description: 'Join an existing mining company as a worker',
      icon: <User className="h-6 w-6 text-user" />,
      buttonClass: 'bg-user hover:bg-user/90',
      accentColor: 'border-l-4 border-l-user'
    }
  };

  const config = roleConfig[formData.role];

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    // Prevent setting invalid client IDs
    if (field === 'clientId' && (value === 'loading' || value === 'no-companies')) {
      return; // Don't update the form data with these values
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user types
  };

  // Form validation
  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      throw new Error('Please fill in all required fields');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      throw new Error('Please enter a valid email address');
    }

    // Password validation (strong policy)
    try {
      validatePassword(formData.password);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : 'Invalid password');
    }

    if (formData.password !== formData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Role-specific validation
    if (formData.role === 'client' && !formData.companyName) {
      throw new Error('Company name is required for client registration');
    }

    if (formData.role === 'user' && (!formData.clientId || formData.clientId === 'loading' || formData.clientId === 'no-companies')) {
      throw new Error('Please select which company you want to join');
    }

    if (!agreeToTerms) {
      throw new Error('Please agree to the terms and conditions');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Validate form
      validateForm();

      // Prepare registration data
      const registrationData = {
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: formData.role,
        client_id: formData.role === 'user' ? formData.clientId : undefined,
        company_name: formData.role === 'client' ? formData.companyName : undefined
      };

      console.log('🔍 Registering user:', registrationData);

      // Call registration function
      const result = await signUp(registrationData);

      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      // Show success modal instead of auto-redirect
      alert('Registration was successful.');
      
      // Clear form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        role: defaultRole,
        companyName: '',
        clientId: '',
      });
      setAgreeToTerms(false);

      // Redirect to sign-in page after user clicks OK on alert
      onRegistrationSuccess();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
            {/* Role Selection (if multiple roles allowed) */}
            {allowedRoles.length > 1 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Account Type</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: 'admin' | 'client' | 'user') => handleInputChange('role', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedRoles.includes('admin') && (
                      <SelectItem value="admin">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-admin" />
                          <span>System Administrator</span>
                        </div>
                      </SelectItem>
                    )}
                    {allowedRoles.includes('client') && (
                      <SelectItem value="client">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-client" />
                          <span>Client Organization</span>
                        </div>
                      </SelectItem>
                    )}
                    {allowedRoles.includes('user') && (
                      <SelectItem value="user">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-user" />
                          <span>Team Member</span>
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Company Name (for clients) */}
            {formData.role === 'client' && (
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium">
                  Company Name *
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Enter your company name"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            )}

            {/* Client Selection (for users) */}
            {formData.role === 'user' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Your Company *</Label>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(value) => handleInputChange('clientId', value)}
                  disabled={isLoading || loadingClients}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      loadingClients 
                        ? "Loading companies..." 
                        : availableClients.length === 0 
                          ? "No companies available" 
                          : "Choose your company"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingClients ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading companies...</span>
                        </div>
                      </SelectItem>
                    ) : availableClients.length === 0 ? (
                      <SelectItem value="no-companies" disabled>
                        No companies available
                      </SelectItem>
                    ) : (
                      availableClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{client.company_name}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {availableClients.length === 0 && !loadingClients && (
                  <p className="text-sm text-muted-foreground">
                    No companies are currently available for registration. Please contact an administrator.
                  </p>
                )}
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password (min 8 characters)"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/20">
                <Checkbox 
                  id="terms-agree"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                />
                <Label htmlFor="terms-agree" className="text-sm cursor-pointer">
                  I agree to the Terms of Service and Privacy Policy
                </Label>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

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
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>

            {/* Back to Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBackToLogin}
              disabled={isLoading}
            >
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};