import React, { useState } from 'react';
import { CreateUserData } from '@/hooks/useUsers';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Building2, Loader2, Plus } from 'lucide-react';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: (userData: CreateUserData) => Promise<{ success: boolean; error?: string }>;
}

/**
 * CreateUserModal Component
 * 
 * Purpose: Modal form for creating new users
 * Features:
 * - Form validation
 * - Client assignment dropdown
 * - Loading states
 * - Error handling
 * - Success feedback
 * - Auto-generates user ID
 */
export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  open,
  onOpenChange,
  onUserCreated
}) => {
  const { toast } = useToast();
  const { clients } = useClients();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    full_name: '',
    password: '',
    role: 'user',
    client_id: null
  });

  // Form errors
  const [errors, setErrors] = useState<Partial<CreateUserData>>({});

  // Handle input changes
  const handleInputChange = (field: keyof CreateUserData, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value as any }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<CreateUserData> = {};

    if (!formData.full_name?.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const pwd = formData.password || '';
    if (!(/[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd) && pwd.length >= 8)) {
      newErrors.password = 'Password must be at least 8 chars and include upper, lower, number, and special character';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate a unique user ID (in a real app, this would be handled by the backend)
  const generateUserId = (): string => {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await onUserCreated({
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        role: formData.role,
        client_id: formData.client_id
      });
      
      if (result.success) {
        toast({
          title: "User Created",
          description: `${formData.full_name} has been successfully created.`,
        });
        
        // Reset form
        setFormData({
          email: '',
          full_name: '',
          role: 'user',
          client_id: null
        });
        
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create user. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      setErrors({});
      setFormData({
        email: '',
        full_name: '',
        password: '',
        role: 'user',
        client_id: null
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Add a new user to the system. They will be assigned the 'user' role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="full_name"
                placeholder="Enter full name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className={`pl-10 ${errors.full_name ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Temporary Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={errors.password ? 'border-destructive' : ''}
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          {/* Client Assignment */}
          <div className="space-y-2">
            <Label htmlFor="client_id">
              Assign to Client
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select
                value={formData.client_id || 'none'}
                onValueChange={(value) => handleInputChange('client_id', value === 'none' ? null : value)}
                disabled={isLoading}
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Client (Inactive)</SelectItem>
                  {clients
                    .filter(client => client.status === 'active')
                    .map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Users assigned to a client will be marked as active
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};