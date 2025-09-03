import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * AddTeamMemberModal Component
 * 
 * Purpose: Modal for adding new team members to client's team
 * Features:
 * - Form validation
 * - Password generation
 * - Error handling
 * - Loading states
 */

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (memberData: {
    email: string;
    full_name: string;
    password: string;
  }) => Promise<void>;
}

export const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember
}) => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate strong random password that meets policy
  const generatePassword = () => {
    const length = 14; // default length
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const specials = '!@#$%^&*()-_=+[]{};:,.<>?';
    const all = upper + lower + digits + specials;

    // Helper to get cryptographically strong random int
    const rand = (max: number) => {
      if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return array[0] % max;
      }
      return Math.floor(Math.random() * max);
    };

    // Ensure at least one from each set
    const pick = (set: string) => set[rand(set.length)];
    let passwordChars = [
      pick(upper),
      pick(lower),
      pick(digits),
      pick(specials)
    ];

    // Fill the rest
    for (let i = passwordChars.length; i < length; i++) {
      passwordChars.push(all[rand(all.length)]);
    }

    // Shuffle to avoid predictable positions
    for (let i = passwordChars.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
    }

    const password = passwordChars.join('');
    setFormData(prev => ({ ...prev, password }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.email || !formData.full_name || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    // Strong password validation to meet system policy
    const password = formData.password;
    const hasMinLen = password.length >= 12;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()\-_=+\[\]{};:,\.<>\?]/.test(password);
    if (!(hasMinLen && hasUpper && hasLower && hasDigit && hasSpecial)) {
      setError('Password must be at least 12 chars and include uppercase, lowercase, number, and special character');
      return;
    }

    setIsLoading(true);

    try {
      await onAddMember(formData);
      
      // Reset form
      setFormData({
        email: '',
        full_name: '',
        password: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding team member:', error);
      setError(error instanceof Error ? error.message : 'Failed to add team member');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        email: '',
        full_name: '',
        password: ''
      });
      setError(null);
      onClose();
    }
  };

  // Generate password on modal open
  React.useEffect(() => {
    if (isOpen && !formData.password) {
      generatePassword();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add a new member to your team. They will receive login credentials via email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Enter full name"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Temporary Password</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type="text"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Generated password"
                disabled={isLoading}
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={generatePassword}
                disabled={isLoading}
              >
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Must be at least 12 characters and include uppercase, lowercase, number, and special character. The user will be asked to change this password on first login.
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
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-client hover:bg-client/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};