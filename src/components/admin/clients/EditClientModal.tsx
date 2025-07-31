import React, { useState, useEffect } from 'react';
import { Client, UpdateClientData } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Building2, Mail, Phone, MapPin, Loader2, Edit } from 'lucide-react';

interface EditClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  onClientUpdated: (clientData: UpdateClientData) => Promise<{ success: boolean; error?: string }>;
}

/**
 * EditClientModal Component
 * 
 * Purpose: Modal form for editing existing clients
 * Features:
 * - Pre-populated form with current client data
 * - Form validation
 * - Loading states
 * - Error handling
 * - Success feedback
 */
export const EditClientModal: React.FC<EditClientModalProps> = ({
  open,
  onOpenChange,
  client,
  onClientUpdated
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Omit<UpdateClientData, 'id' | 'status'>>({
    company_name: '',
    contact_email: '',
    contact_phone: '',
    address: ''
  });

  // Form errors
  const [errors, setErrors] = useState<Partial<Omit<UpdateClientData, 'id' | 'status'>>>({});

  // Initialize form data when client changes
  useEffect(() => {
    if (client) {
      setFormData({
        company_name: client.company_name,
        contact_email: client.contact_email,
        contact_phone: client.contact_phone || '',
        address: client.address || ''
        // status field removed temporarily
      });
      setErrors({});
    }
  }, [client]);

  // Handle input changes
  const handleInputChange = (field: keyof Omit<UpdateClientData, 'id' | 'status'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Omit<UpdateClientData, 'id' | 'status'>> = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await onClientUpdated({
        id: client.id,
        ...formData
      });
      
      if (result.success) {
        toast({
          title: "Client Updated",
          description: `${formData.company_name} has been successfully updated.`,
        });
        
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update client. Please try again.",
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
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit className="h-5 w-5 mr-2" />
            Edit Client
          </DialogTitle>
          <DialogDescription>
            Update the client information. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company_name">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="company_name"
                placeholder="Enter company name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                className={`pl-10 ${errors.company_name ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.company_name && (
              <p className="text-sm text-destructive">{errors.company_name}</p>
            )}
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contact_email">
              Contact Email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="contact_email"
                type="email"
                placeholder="contact@company.com"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                className={`pl-10 ${errors.contact_email ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.contact_email && (
              <p className="text-sm text-destructive">{errors.contact_email}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="contact_phone"
                placeholder="+1 (555) 123-4567"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                className={`pl-10 ${errors.contact_phone ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.contact_phone && (
              <p className="text-sm text-destructive">{errors.contact_phone}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="address"
                placeholder="Enter company address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="pl-10 min-h-[80px]"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Status field temporarily removed - will be added back after database migration */}

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
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Client
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};