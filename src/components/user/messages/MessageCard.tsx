import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Eye,
  Clock,
  User
} from 'lucide-react';
import type { UserMessage } from '@/hooks/useUserData';

/**
 * MessageCard Component
 * 
 * Purpose: Display individual message information with actions for users
 * Features:
 * - Message details display
 * - Unread indicators
 * - View actions
 * - Sender information
 */

interface MessageCardProps {
  message: UserMessage;
  onView: (messageId: string) => void;
  isLoading?: boolean;
}

export const MessageCard: React.FC<MessageCardProps> = ({
  message,
  onView,
  isLoading = false
}) => {
  // Get role badge styling
  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-admin/10 text-admin border-admin/20',
      client: 'bg-client/10 text-client border-client/20',
      user: 'bg-user/10 text-user border-user/20'
    };
    
    return (
      <Badge variant="outline" className={styles[role as keyof typeof styles] || 'bg-muted'}>
        {role}
      </Badge>
    );
  };

  return (
    <Card className={`hover:shadow-md transition-all ${
      message.unread 
        ? 'border-user/30 bg-user/5 shadow-sm' 
        : 'hover:bg-muted/50'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Message Icon */}
            <div className={`p-2 rounded-full ${
              message.unread ? 'bg-user/20' : 'bg-muted/50'
            }`}>
              <MessageSquare className={`h-4 w-4 ${
                message.unread ? 'text-user' : 'text-muted-foreground'
              }`} />
            </div>

            {/* Message Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className={`text-sm font-medium ${
                    message.unread ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {message.from}
                  </span>
                </div>
                {getRoleBadge(message.fromRole)}
                {message.unread && (
                  <div className="h-2 w-2 bg-user rounded-full" title="Unread message" />
                )}
              </div>

              <h3 className={`font-medium text-sm mb-1 ${
                message.unread ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {message.subject}
              </h3>

              {message.content && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {message.content}
                </p>
              )}

              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{message.time}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end space-y-2 ml-4">
            <Button
              size="sm"
              variant={message.unread ? "default" : "outline"}
              onClick={() => onView(message.id)}
              disabled={isLoading}
              className={message.unread ? "bg-user hover:bg-user/90" : ""}
            >
              <Eye className="h-4 w-4 mr-1" />
              {message.unread ? 'Read' : 'View'}
            </Button>
          </div>
        </div>

        {/* Unread Indicator */}
        {message.unread && (
          <div className="mt-3 p-2 bg-user/10 rounded-lg border border-user/20">
            <p className="text-xs text-user font-medium">
              💬 New message - Click to read
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};