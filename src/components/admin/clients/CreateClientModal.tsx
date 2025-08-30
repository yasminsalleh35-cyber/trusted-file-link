import React, { useState } from 'react';
import { CreateClientData } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Building2, Mail, Phone, MapPin, Loader2, Plus, Lock, User } from 'lucide-react';

interface CreateClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (clientData: CreateClientData) => Promise<{ success: boolean; error?: string }>;  
}

/**
 * CreateClientModal Component
 *
 * Purpose: Modal form for creating a new client (mining company)
 * Features:
 * - Form validation
 * - Loading/success/error feedback
 * - Minimal required fields: company_name, contact_email
 */
export const CreateClientModal: React.FC<CreateClientModalProps> = ({
  open,
  onOpenChange,
  onClientCreated,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateClientData>({
    company_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    status: 'active',
    create_manager: true,
    manager_full_name: '',
    manager_password: '',
  });

  const [errors, setErrors] = useState<Partial<CreateClientData>>({});

  const handleInputChange = (field: keyof CreateClientData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value as any }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateClientData> = {};

    if (!formData.company_name?.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (!formData.contact_email?.trim()) {
      newErrors.contact_email = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    if (formData.contact_phone && !/^[\d\s\-\+\(\)]+$/.test(formData.contact_phone)) {
      newErrors.contact_phone = 'Please enter a valid phone number';
    }

    // If creating a manager, require full name and a strong password
    if (formData.create_manager) {
      if (!formData.manager_full_name?.trim()) {
        newErrors.manager_full_name = 'Manager full name is required';
      }
      const pwd = formData.manager_password || '';
      if (pwd.length < 8) {
        newErrors.manager_password = 'Password must be at least 8 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload: CreateClientData = {
        company_name: formData.company_name.trim(),
        contact_email: formData.contact_email.trim(),
        contact_phone: formData.contact_phone?.trim() || null,
        address: formData.address?.trim() || null,
        status: formData.status || 'active',
        create_manager: !!formData.create_manager,
        manager_full_name: formData.create_manager ? formData.manager_full_name?.trim() : undefined,
        manager_password: formData.create_manager ? formData.manager_password : undefined,
      };

      const result = await onClientCreated(payload);
      if (result.success) {
        toast({
          title: 'Client Created',
          description: `${formData.company_name} has been successfully added.`,
        });
        // reset
        setFormData({ company_name: '', contact_email: '', contact_phone: '', address: '', status: 'active' });
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create client. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add New Client
          </DialogTitle>
          <DialogDescription>
            Create a new mining company. You can edit details later if needed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company_name">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="company_name"
                placeholder="Acme Mining Co."
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                className={`pl-10 ${errors.company_name ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.company_name && <p className="text-sm text-destructive">{errors.company_name}</p>}
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contact_email">
              Contact Email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="contact_email"
                type="email"
                placeholder="admin@acme.com"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                className={`pl-10 ${errors.contact_email ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.contact_email && <p className="text-sm text-destructive">{errors.contact_email}</p>}
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="contact_phone"
                placeholder="+1 (555) 123-4567"
                value={formData.contact_phone || ''}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                className={`pl-10 ${errors.contact_phone ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.contact_phone && <p className="text-sm text-destructive">{errors.contact_phone}</p>}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="address"
                placeholder="123 Mine Rd, Gold Town, NV 89000"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="pl-10 min-h-[80px]"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Create manager account toggle */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create_manager"
                checked={!!formData.create_manager}
                onCheckedChange={(checked) => handleInputChange('create_manager', !!checked)}
                disabled={isLoading}
              />
              <Label htmlFor="create_manager">Create a login for the primary site manager</Label>
            </div>

            {formData.create_manager && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manager_full_name">
                    Manager Full Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="manager_full_name"
                      placeholder="Jane Doe"
                      value={formData.manager_full_name || ''}
                      onChange={(e) => handleInputChange('manager_full_name', e.target.value)}
                      className={`pl-10 ${errors.manager_full_name ? 'border-destructive' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.manager_full_name && <p className="text-sm text-destructive">{errors.manager_full_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager_password">
                    Temporary Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="manager_password"
                      type="password"
                      placeholder="At least 8 characters"
                      value={formData.manager_password || ''}
                      onChange={(e) => handleInputChange('manager_password', e.target.value)}
                      className={`pl-10 ${errors.manager_password ? 'border-destructive' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.manager_password && <p className="text-sm text-destructive">{errors.manager_password}</p>}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
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
                  Add Client
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};