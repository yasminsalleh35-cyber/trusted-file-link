import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Reply,
  Trash2,
  Clock,
  User,
  Shield,
  Building2,
  HardHat,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { EnhancedMessage } from '@/hooks/useMessages';

/**
 * MessageDetailModal Component
 * 
 * Purpose: Full message detail view with actions
 * Features:
 * - Complete message display
 * - Sender/recipient information
 * - Message metadata
 * - Action buttons (reply, delete)
 * - Mining-themed styling
 */

interface MessageDetailModalProps {
  message: EnhancedMessage | null;
  isOpen: boolean;
  onClose: () => void;
  onReply?: (message: EnhancedMessage) => void;
  onDelete?: (messageId: string) => void;
  isLoading?: boolean;
}

export const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
  message,
  isOpen,
  onClose,
  onReply,
  onDelete,
  isLoading = false
}) => {
  const { user } = useAuth();

  if (!message) return null;

  // Get role-specific styling and icons
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
        icon: <HardHat className="h-4 w-4" />,
        badgeClass: 'bg-user/10 text-user border-user/20',
        description: 'Mining Worker'
      }
    };
    return configs[role as keyof typeof configs] || configs.user;
  };

  const isReceived = message.recipient_id === user?.id;
  const isSent = message.sender_id === user?.id;
  const senderConfig = getRoleConfig(message.sender_role);
  const recipientConfig = getRoleConfig(message.recipient_role);

  // Format full date
  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get message type display
  const getMessageTypeDisplay = (messageType: string) => {
    const types = {
      admin_to_client: 'HQ → Site Manager',
      admin_to_user: 'HQ → Miner',
      client_to_user: 'Site Manager → Miner',
      user_to_admin: 'Miner → HQ'
    };
    return types[messageType as keyof typeof types] || messageType;
  };

  // Handle reply
  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 font-mining-header">
            <MessageSquare className="h-5 w-5 text-mining-primary" />
            <span>Site Communication</span>
            {message.is_unread && isReceived && (
              <Badge className="bg-mining-primary text-white">
                New
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Message Header */}
          <div className="space-y-4">
            {/* From/To Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sender */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">From</label>
                <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                  {senderConfig.icon}
                  <div className="flex-1">
                    <div className="font-medium font-mining-body">{message.sender_name}</div>
                    <div className="text-sm text-muted-foreground">{senderConfig.description}</div>
                  </div>
                  <Badge variant="outline" className={senderConfig.badgeClass}>
                    {senderConfig.label}
                  </Badge>
                </div>
              </div>

              {/* Recipient */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">To</label>
                <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                  {recipientConfig.icon}
                  <div className="flex-1">
                    <div className="font-medium font-mining-body">{message.recipient_name}</div>
                    <div className="text-sm text-muted-foreground">{recipientConfig.description}</div>
                  </div>
                  <Badge variant="outline" className={recipientConfig.badgeClass}>
                    {recipientConfig.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Message Metadata */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatFullDate(message.created_at || '')}</span>
                </div>
                <Badge variant="secondary">
                  {getMessageTypeDisplay(message.message_type)}
                </Badge>
              </div>
              
              {message.read_at && (
                <div className="text-sm text-muted-foreground">
                  Read: {formatFullDate(message.read_at)}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Subject */}
          {message.subject && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Subject</label>
              <h2 className="text-lg font-semibold font-mining-header">{message.subject}</h2>
            </div>
          )}

          {/* Message Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Message</label>
            <div className="p-4 bg-background border rounded-lg">
              <div className="whitespace-pre-wrap font-mining-body text-sm leading-relaxed">
                {message.content}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex space-x-2">
              {isReceived && onReply && (
                <Button
                  onClick={handleReply}
                  disabled={isLoading}
                  className="bg-mining-primary hover:bg-mining-primary/90"
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </Button>
              )}
              
              {onDelete && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>

            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};