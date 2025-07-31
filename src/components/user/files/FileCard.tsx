import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye,
  Clock,
  User
} from 'lucide-react';
import type { AssignedFile } from '@/hooks/useUserData';

/**
 * FileCard Component
 * 
 * Purpose: Display individual file information with actions for users
 * Features:
 * - File details display
 * - Status indicators
 * - View/download actions
 * - Assignment information
 */

interface FileCardProps {
  file: AssignedFile;
  onView: (fileId: string) => void;
  onDownload: (fileId: string) => void;
  isLoading?: boolean;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onView,
  onDownload,
  isLoading = false
}) => {
  // Get file icon based on extension
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    // For now, use generic file icon - can be enhanced with specific icons
    return <FileText className="h-8 w-8 text-user" />;
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-warning/10 text-warning border-warning/20',
      viewed: 'bg-primary/10 text-primary border-primary/20',
      downloaded: 'bg-success/10 text-success border-success/20'
    };
    
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles]}>
        {status}
      </Badge>
    );
  };

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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {/* File Icon */}
            {getFileIcon(file.name)}

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{file.name}</h3>
              
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-muted-foreground">{file.size}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{file.assignedAt}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-2">
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Assigned by {file.assignedBy}
                  </span>
                </div>
                {getRoleBadge(file.assignedByRole)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end space-y-2 ml-4">
            {/* Status Badge */}
            {getStatusBadge(file.status)}

            {/* Action Buttons */}
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView(file.id)}
                disabled={isLoading}
                title="View file"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDownload(file.id)}
                disabled={isLoading}
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* File Status Indicator */}
        {file.status === 'new' && (
          <div className="mt-3 p-2 bg-warning/10 rounded-lg border border-warning/20">
            <p className="text-xs text-warning font-medium">
              📄 New file - Click to view or download
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};