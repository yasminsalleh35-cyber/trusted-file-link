import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Eye,
  Clock,
  User,
  Trash2,
  Reply,
  MoreVertical,
  Shield,
  Building2,
  HardHat
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import type { EnhancedMessage } from '@/hooks/useMessages';

/**
 * EnhancedMessageCard Component
 * 
 * Purpose: Display individual message with full functionality
 * Features:
 * - Message details with sender/recipient info
 * - Unread indicators with mining theme
 * - Action buttons (view, reply, delete)
 * - Role-based styling and icons
 * - Responsive design
 */

interface EnhancedMessageCardProps {
  message: EnhancedMessage;
  onView: (messageId: string) => void;
  onReply?: (message: EnhancedMessage) => void;
  onDelete?: (messageId: string) => void;
  onMarkAsRead?: (messageId: string) => void;
  isLoading?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

export const EnhancedMessageCard: React.FC<EnhancedMessageCardProps> = ({
  message,
  onView,
  onReply,
  onDelete,
  onMarkAsRead,
  isLoading = false,
  showActions = true,
  compact = false
}) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Get role-specific styling and icons
  const getRoleConfig = (role: string) => {
    const configs = {
      admin: {
        label: 'Mining HQ',
        icon: <Shield className="h-3 w-3" />,
        badgeClass: 'bg-admin/10 text-admin border-admin/20',
        iconBg: 'bg-admin/20',
        iconColor: 'text-admin'
      },
      client: {
        label: 'Site Manager',
        icon: <Building2 className="h-3 w-3" />,
        badgeClass: 'bg-client/10 text-client border-client/20',
        iconBg: 'bg-client/20',
        iconColor: 'text-client'
      },
      user: {
        label: 'Miner',
        icon: <HardHat className="h-3 w-3" />,
        badgeClass: 'bg-user/10 text-user border-user/20',
        iconBg: 'bg-user/20',
        iconColor: 'text-user'
      }
    };
    return configs[role as keyof typeof configs] || configs.user;
  };

  const isReceived = message.recipient_id === user?.id;
  const isSent = message.sender_id === user?.id;
  const senderConfig = getRoleConfig(message.sender_role);
  const recipientConfig = getRoleConfig(message.recipient_role);

  // Determine card styling based on message status
  const getCardStyling = () => {
    if (message.is_unread && isReceived) {
      return 'border-mining-primary/30 bg-mining-primary/5 shadow-sm hover:shadow-md';
    }
    return 'hover:bg-muted/50 hover:shadow-md';
  };

  // Handle view action
  const handleView = () => {
    if (message.is_unread && isReceived && onMarkAsRead) {
      onMarkAsRead(message.id);
    }
    onView(message.id);
  };

  // Handle reply action
  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
  };

  // Handle delete action
  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
  };

  // Truncate content for preview
  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card className={`transition-all duration-200 ${getCardStyling()}`}>
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Message Icon */}
            <div className={`p-2 rounded-full ${
              message.is_unread && isReceived 
                ? 'bg-mining-primary/20' 
                : 'bg-muted/50'
            }`}>
              <MessageSquare className={`h-4 w-4 ${
                message.is_unread && isReceived 
                  ? 'text-mining-primary' 
                  : 'text-muted-foreground'
              }`} />
            </div>

            {/* Message Info */}
            <div className="flex-1 min-w-0">
              {/* Header with sender/recipient info */}
              <div className="flex items-center space-x-2 mb-1 flex-wrap">
                <div className="flex items-center space-x-1">
                  {senderConfig.icon}
                  <span className={`text-sm font-medium ${
                    message.is_unread && isReceived ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {isSent ? 'To' : 'From'}: {isSent ? message.recipient_name : message.sender_name}
                  </span>
                </div>
                
                <Badge variant="outline" className={isSent ? recipientConfig.badgeClass : senderConfig.badgeClass}>
                  {isSent ? recipientConfig.label : senderConfig.label}
                </Badge>

                {message.is_unread && isReceived && (
                  <div className="h-2 w-2 bg-mining-primary rounded-full" title="Unread message" />
                )}
              </div>

              {/* Subject */}
              {message.subject && (
                <h3 className={`font-medium text-sm mb-1 ${
                  message.is_unread && isReceived ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {message.subject}
                </h3>
              )}

              {/* Content Preview */}
              <div className="mb-2">
                <p className="text-xs text-muted-foreground line-clamp-2 font-mining-body">
                  {isExpanded ? message.content : truncateContent(message.content)}
                </p>
                {message.content.length > 120 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-mining-primary hover:underline mt-1"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>

              {/* Time and Message Type */}
              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{message.formatted_time}</span>
                </div>
                
                <Badge variant="secondary" className="text-xs">
                  {message.message_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-1 ml-2">
              {/* Primary Action Button */}
              <Button
                size="sm"
                variant={message.is_unread && isReceived ? "default" : "outline"}
                onClick={handleView}
                disabled={isLoading}
                className={message.is_unread && isReceived ? "bg-mining-primary hover:bg-mining-primary/90" : ""}
              >
                <Eye className="h-4 w-4 mr-1" />
                {message.is_unread && isReceived ? 'Read' : 'View'}
              </Button>

              {/* More Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={isLoading}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleView}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Message
                  </DropdownMenuItem>
                  
                  {isReceived && onReply && (
                    <DropdownMenuItem onClick={handleReply}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                  )}
                  
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Unread Indicator Banner */}
        {message.is_unread && isReceived && (
          <div className="mt-3 p-2 bg-mining-primary/10 rounded-lg border border-mining-primary/20">
            <p className="text-xs text-mining-primary font-medium font-mining-body">
              💬 New site communication - Click to read
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};