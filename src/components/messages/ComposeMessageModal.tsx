import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Send, 
  X, 
  User, 
  Building2, 
  Shield,
  Loader2
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

/**
 * ComposeMessageModal Component
 * 
 * Purpose: Modal for composing and sending messages
 * Features:
 * - Recipient selection based on user role
 * - Message type validation
 * - Subject and content input
 * - Real-time validation
 * - Mining-themed styling
 */

type MessageType = Database['public']['Enums']['message_type'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface ComposeMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: {
    recipientId: string;
    subject?: string;
    content: string;
    messageType: MessageType;
  }) => Promise<{ success: boolean; error?: string }>;
  preselectedRecipient?: {
    id: string;
    name: string;
    role: string;
  };
}

export const ComposeMessageModal: React.FC<ComposeMessageModalProps> = ({
  isOpen,
  onClose,
  onSend,
  preselectedRecipient
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [recipients, setRecipients] = useState<Profile[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingRecipients, setIsFetchingRecipients] = useState(false);

  // Get role-specific styling and labels
  const getRoleConfig = (role: string) => {
    const configs = {
      admin: {
        label: 'Mining HQ',
        icon: <Shield className="h-4 w-4" />,
        badgeClass: 'bg-admin/10 text-admin border-admin/20',
        description: 'Headquarters Administrator'
      },
      client: {
        label: 'Site Manager',
        icon: <Building2 className="h-4 w-4" />,
        badgeClass: 'bg-client/10 text-client border-client/20',
        description: 'Mining Site Manager'
      },
      user: {
        label: 'Miner',
        icon: <User className="h-4 w-4" />,
        badgeClass: 'bg-user/10 text-user border-user/20',
        description: 'Mining Worker'
      }
    };
    return configs[role as keyof typeof configs] || configs.user;
  };

  // Determine valid message types based on user role
  const getValidMessageTypes = (): { value: MessageType; label: string; description: string }[] => {
    if (!user) return [];

    switch (user.role) {
      case 'admin':
        return [
          { value: 'admin_to_client', label: 'To Site Manager', description: 'Send to mining site managers' },
          { value: 'admin_to_user', label: 'To Miner', description: 'Send to mining workers' }
        ];
      case 'client':
        return [
          { value: 'client_to_user', label: 'To Miner', description: 'Send to your mining crew' },
          { value: 'user_to_admin', label: 'To Mining HQ', description: 'Send to headquarters' }
        ];
      case 'user':
        return [
          { value: 'user_to_admin', label: 'To Mining HQ', description: 'Send to headquarters' },
          { value: 'client_to_user', label: 'To Site Manager', description: 'Send to your site manager' }
        ];
      default:
        return [];
    }
  };

  // Fetch available recipients based on user role
  const fetchRecipients = async () => {
    if (!user) return;

    try {
      setIsFetchingRecipients(true);
      let query = supabase.from('profiles').select('*');

      // Filter recipients based on user role with RLS-safe constraints
      switch (user.role) {
        case 'admin':
          // Admin can message clients and users (no client restriction)
          query = query.in('role', ['client', 'user']);
          break;
        case 'client':
          // Client can message admins or users within their own client only
          // Use OR with grouped AND to keep it to their organization
          query = query.or(
            `role.eq.admin,and(role.eq.user,client_id.eq.${user.client_id || '00000000-0000-0000-0000-000000000000'})`
          );
          break;
        case 'user':
          // User can message admins or their own client (site manager)
          query = query.or(
            `role.eq.admin,and(role.eq.client,client_id.eq.${user.client_id || '00000000-0000-0000-0000-000000000000'})`
          );
          break;
      }

      // Exclude self
      query = query.neq('id', user.id);

      const { data, error } = await query.order('full_name');

      if (error) throw error;

      setRecipients(data || []);
    } catch (error) {
      console.error('Error fetching recipients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recipients',
        variant: 'destructive'
      });
    } finally {
      setIsFetchingRecipients(false);
    }
  };

  // Determine message type based on recipient with robust fallbacks
  const getMessageType = (recipientRole: string): MessageType | null => {
    if (!user) return null;

    const senderRole = String(user.role || '').toLowerCase();
    const recRole = String(recipientRole || '').toLowerCase();

    const typeMap: Record<string, Record<string, MessageType>> = {
      admin: { client: 'admin_to_client', user: 'admin_to_user' },
      client: { user: 'client_to_user', admin: 'user_to_admin' },
      user: { admin: 'user_to_admin', client: 'client_to_user' }
    };

    const mapped = typeMap[senderRole]?.[recRole];
    if (mapped) return mapped;

    // Fallback inference if roles are unexpected
    if (senderRole === 'client' && recRole === 'admin') return 'user_to_admin';
    if (senderRole === 'user' && recRole === 'client') return 'client_to_user';

    // Last resort: choose first valid type for the sender
    const options = getValidMessageTypes();
    return (options[0]?.value as MessageType) || null;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRecipient || !content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please select a recipient and enter a message',
        variant: 'destructive'
      });
      return;
    }

    const recipient = recipients.find(r => r.id === selectedRecipient);
    if (!recipient) {
      toast({
        title: 'Error',
        description: 'Invalid recipient selected',
        variant: 'destructive'
      });
      return;
    }

    const messageType = getMessageType(recipient.role);
    if (!messageType) {
      toast({
        title: 'Error',
        description: 'Invalid message type for selected recipient',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const result = await onSend({
        recipientId: selectedRecipient,
        subject: subject.trim() || undefined,
        content: content.trim(),
        messageType
      });

      if (result.success) {
        toast({
          title: 'Message Sent',
          description: 'Your message has been sent successfully',
        });
        handleClose();
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setSelectedRecipient('');
    setSubject('');
    setContent('');
    onClose();
  };

  // Initialize preselected recipient
  useEffect(() => {
    if (preselectedRecipient) {
      setSelectedRecipient(preselectedRecipient.id);
    }
  }, [preselectedRecipient]);

  // Fetch recipients when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRecipients();
    }
  }, [isOpen]);

  const validMessageTypes = getValidMessageTypes();
  const selectedRecipientData = recipients.find(r => r.id === selectedRecipient);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 font-mining-header">
            <Send className="h-5 w-5 text-mining-primary" />
            <span>Compose Site Communication</span>
          </DialogTitle>
          <DialogDescription>
            Send a direct message to team members based on your role permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient Selection */}
          <div className="space-y-2">
            <Label htmlFor="recipient" className="font-mining-body">
              Send To
            </Label>
            {isFetchingRecipients ? (
              <div className="flex items-center space-x-2 p-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading recipients...</span>
              </div>
            ) : (
              <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient..." />
                </SelectTrigger>
                <SelectContent>
                  {recipients.map((recipient) => {
                    const roleConfig = getRoleConfig(recipient.role);
                    return (
                      <SelectItem key={recipient.id} value={recipient.id}>
                        <div className="flex items-center space-x-2">
                          {roleConfig.icon}
                          <span>{recipient.full_name}</span>
                          <Badge variant="outline" className={roleConfig.badgeClass}>
                            {roleConfig.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
            
            {selectedRecipientData && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Message type:</span>
                <Badge variant="outline" className="text-mining-primary border-mining-primary/20">
                  {validMessageTypes.find(t => t.value === getMessageType(selectedRecipientData.role))?.label}
                </Badge>
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="font-mining-body">
              Subject <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter message subject..."
              className="font-mining-body"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="font-mining-body">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your message..."
              rows={6}
              className="font-mining-body resize-none"
              required
            />
            <div className="text-xs text-muted-foreground text-right">
              {content.length}/1000 characters
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedRecipient || !content.trim()}
              className="bg-mining-primary hover:bg-mining-primary/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Message
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};