import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Users, 
  Building2, 
  User, 
  Calendar,
  MessageSquare,
  Megaphone,
  Shield
} from 'lucide-react';
import type { EnhancedNews } from '@/hooks/useNews';

/**
 * NewsCard Component
 * 
 * Purpose: Display individual news/announcement cards with mining-themed styling
 * Features:
 * - Shows news title, content preview, and metadata
 * - Assignment indicators (who it's assigned to)
 * - Mining-themed role badges
 * - Action buttons for viewing and managing
 */

interface NewsCardProps {
  news: EnhancedNews;
  onView: (newsId: string) => void;
  onAssign?: (newsId: string) => void;
  showAssignButton?: boolean;
  compact?: boolean;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  news,
  onView,
  onAssign,
  showAssignButton = false,
  compact = false
}) => {
  // Get appropriate icon based on assignment type
  const getAssignmentIcon = () => {
    if (news.assignment_count === 0) {
      return <MessageSquare className="h-4 w-4" />;
    }
    if (news.assignment_count > 10) {
      return <Megaphone className="h-4 w-4 text-mining-primary" />;
    }
    if (news.assignment_count > 1) {
      return <Users className="h-4 w-4 text-mining-secondary" />;
    }
    return <User className="h-4 w-4 text-mining-accent" />;
  };

  // Get assignment description
  const getAssignmentDescription = () => {
    if (news.assignment_count === 0) {
      return 'Not assigned';
    }
    if (news.assignment_count === 1) {
      return '1 assignment';
    }
    return `${news.assignment_count} assignments`;
  };

  // Truncate content for preview
  const getContentPreview = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md border-l-4 ${
      news.is_assigned_to_me 
        ? 'border-l-mining-primary bg-mining-primary/5' 
        : 'border-l-mining-secondary/50'
    } ${compact ? 'p-3' : ''}`}>
      <CardHeader className={compact ? 'pb-2' : ''}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={`font-mining-header ${compact ? 'text-lg' : 'text-xl'} mb-2`}>
              {news.title}
            </CardTitle>
            <CardDescription className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{news.formatted_time}</span>
              </div>
              <div className="flex items-center space-x-1">
                {getAssignmentIcon()}
                <span>{getAssignmentDescription()}</span>
              </div>
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            {news.is_assigned_to_me && (
              <Badge variant="default" className="bg-mining-primary text-white">
                <Shield className="h-3 w-3 mr-1" />
                Assigned
              </Badge>
            )}
            
            {news.assignment_count > 5 && (
              <Badge variant="secondary" className="bg-mining-secondary/20 text-mining-secondary">
                <Megaphone className="h-3 w-3 mr-1" />
                Broadcast
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={compact ? 'pt-0' : ''}>
        <div className="space-y-4">
          {/* Content Preview */}
          <div className="text-sm text-muted-foreground font-mining-body">
            {getContentPreview(news.content, compact ? 100 : 200)}
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-3">
              <span>By {news.created_by_name}</span>
              {news.assigned_at && (
                <span>Assigned {new Date(news.assigned_at).toLocaleDateString()}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <Building2 className="h-3 w-3" />
              <span>Mining Operations</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(news.id)}
              className="font-mining-body"
            >
              <Eye className="h-4 w-4 mr-2" />
              Read Full Article
            </Button>

            {showAssignButton && onAssign && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onAssign(news.id)}
                className="bg-mining-secondary/20 hover:bg-mining-secondary/30 text-mining-secondary font-mining-body"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Assignments
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};