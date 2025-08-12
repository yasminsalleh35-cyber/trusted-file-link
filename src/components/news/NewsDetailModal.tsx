import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  User, 
  Users, 
  Building2, 
  Shield, 
  Megaphone,
  X,
  Eye,
  Clock
} from 'lucide-react';
import type { EnhancedNews } from '@/hooks/useNews';

/**
 * NewsDetailModal Component
 * 
 * Purpose: Full-screen modal for reading complete news articles
 * Features:
 * - Full news content display
 * - Assignment information
 * - Mining-themed styling
 * - Responsive design
 * - Action buttons for management
 */

interface NewsDetailModalProps {
  news: EnhancedNews | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign?: (newsId: string) => void;
  showAssignButton?: boolean;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  news,
  isOpen,
  onClose,
  onAssign,
  showAssignButton = false
}) => {
  if (!news) return null;

  // Get assignment type description
  const getAssignmentTypeDescription = () => {
    if (news.assignment_count === 0) {
      return {
        icon: <Eye className="h-4 w-4" />,
        text: 'Not assigned to anyone',
        color: 'text-muted-foreground'
      };
    }
    if (news.assignment_count > 10) {
      return {
        icon: <Megaphone className="h-4 w-4" />,
        text: 'Company-wide broadcast',
        color: 'text-mining-primary'
      };
    }
    if (news.assignment_count > 1) {
      return {
        icon: <Users className="h-4 w-4" />,
        text: `Assigned to ${news.assignment_count} recipients`,
        color: 'text-mining-secondary'
      };
    }
    return {
      icon: <User className="h-4 w-4" />,
      text: 'Assigned to 1 recipient',
      color: 'text-mining-accent'
    };
  };

  const assignmentInfo = getAssignmentTypeDescription();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-mining-secondary/20">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <DialogTitle className="text-2xl font-mining-header text-mining-primary mb-2">
                {news.title}
              </DialogTitle>
              <DialogDescription className="text-base">
                Official company announcement from Mining HQ
              </DialogDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              {news.is_assigned_to_me && (
                <Badge variant="default" className="bg-mining-primary text-white">
                  <Shield className="h-3 w-3 mr-1" />
                  Assigned to You
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[60vh] px-6">
            <div className="space-y-6 py-4">
              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-mining-secondary/5 rounded-lg border border-mining-secondary/20">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-mining-secondary" />
                  <div>
                    <div className="text-sm font-medium">Published</div>
                    <div className="text-xs text-muted-foreground">{news.formatted_time}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-mining-secondary" />
                  <div>
                    <div className="text-sm font-medium">Author</div>
                    <div className="text-xs text-muted-foreground">{news.created_by_name}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {assignmentInfo.icon}
                  <div>
                    <div className="text-sm font-medium">Distribution</div>
                    <div className={`text-xs ${assignmentInfo.color}`}>
                      {assignmentInfo.text}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment Status */}
              {news.is_assigned_to_me && news.assigned_at && (
                <div className="flex items-center space-x-2 p-3 bg-mining-primary/10 rounded-lg border border-mining-primary/20">
                  <Clock className="h-4 w-4 text-mining-primary" />
                  <span className="text-sm font-medium text-mining-primary">
                    Assigned to you on {new Date(news.assigned_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}

              <Separator />

              {/* Main Content */}
              <div className="prose prose-sm max-w-none">
                <div className="text-base leading-relaxed font-mining-body whitespace-pre-wrap">
                  {news.content}
                </div>
              </div>

              {/* Footer Info */}
              <Separator />
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span>Mining Operations Department</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span>Article ID: {news.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 border-t border-mining-secondary/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {news.assignment_count > 0 && (
                <span>This announcement has been distributed to {news.assignment_count} recipient{news.assignment_count > 1 ? 's' : ''}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {showAssignButton && onAssign && (
                <Button
                  variant="secondary"
                  onClick={() => onAssign(news.id)}
                  className="bg-mining-secondary/20 hover:bg-mining-secondary/30 text-mining-secondary"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Assignments
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={onClose}
                className="font-mining-body"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};