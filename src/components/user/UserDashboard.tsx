import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  MessageSquare, 
  Download,
  Eye,
  Clock,
  Bell,
  User,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { FileCard } from '@/components/user/files/FileCard';
import { MessageCard } from '@/components/user/messages/MessageCard';

/**
 * UserDashboard Component
 * 
 * Purpose: Main dashboard view for regular Users
 * Features:
 * - View files assigned specifically to the user
 * - Access to messages from admin and client
 * - Simple, focused interface for file access
 * - Notification center for updates
 * 
 * Access Control:
 * - Can only see files assigned to them personally or to their client
 * - Can message admin and their client admin
 * - Cannot see other users' data
 * - Read-only access to most system features
 */

interface UserDashboardProps {
  onNavigate: (path: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ 
  onNavigate
}) => {
  const { 
    profile,
    client,
    stats, 
    recentFiles, 
    recentMessages, 
    isLoading, 
    error, 
    refreshData,
    markMessageAsRead,
    markFileAsViewed,
    markFileAsDownloaded
  } = useUserData();

  // Handle file view
  const handleFileView = async (fileId: string) => {
    try {
      await markFileAsViewed(fileId);
      
      // Find the managed file to get the full data
      const managedFile = userData.managedFiles?.find(f => f.id === fileId);
      if (managedFile && userData.previewFile) {
        const previewUrl = await userData.previewFile(managedFile);
        // Open preview in new tab
        window.open(previewUrl, '_blank');
      }
    } catch (error) {
      console.error('Error viewing file:', error);
    }
  };

  // Handle file download
  const handleFileDownload = async (fileId: string) => {
    try {
      await markFileAsDownloaded(fileId);
      
      // Find the managed file to get the full data
      const managedFile = userData.managedFiles?.find(f => f.id === fileId);
      if (managedFile && userData.downloadFile) {
        await userData.downloadFile(managedFile);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Handle message view
  const handleMessageView = async (messageId: string) => {
    try {
      await markMessageAsRead(messageId);
      // TODO: Navigate to message detail view
      onNavigate(`/user/messages/${messageId}`);
    } catch (error) {
      console.error('Error viewing message:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-user/10 to-user/5 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-user/10 to-user/5 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-user/20 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-user" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-user">
                Welcome, {profile?.full_name || 'User'}
              </h1>
              <p className="text-muted-foreground">
                {client?.company_name || 'Company'} • {profile?.email}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Access your assigned files and stay updated with messages
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Files</CardTitle>
            <FileText className="h-4 w-4 text-user" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedFilesCount}</div>
            <p className="text-xs text-muted-foreground">Files available to you</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-user" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadMessagesCount}</div>
            <p className="text-xs text-muted-foreground">New messages for you</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Clock className="h-4 w-4 text-user" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lastActivityTime.split(' ')[0]}</div>
            <p className="text-xs text-muted-foreground">{stats.lastActivityTime.split(' ').slice(1).join(' ')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-user" />
              My Files
            </CardTitle>
            <CardDescription>
              Files assigned to you by admin or your client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFiles.length > 0 ? (
                recentFiles.slice(0, 3).map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onView={handleFileView}
                    onDownload={handleFileDownload}
                  />
                ))
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No files assigned yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Files assigned by your admin or client will appear here
                  </p>
                </div>
              )}
            </div>
            {recentFiles.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full" onClick={() => onNavigate('/user/files')}>
                  {recentFiles.length > 3 ? `View All ${recentFiles.length} Files` : 'View All My Files'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-user" />
              Messages
            </CardTitle>
            <CardDescription>
              Communications from admin and your client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMessages.length > 0 ? (
                recentMessages.slice(0, 3).map((message) => (
                  <MessageCard
                    key={message.id}
                    message={message}
                    onView={handleMessageView}
                  />
                ))
              ) : (
                <div className="text-center py-6">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Messages from your admin or client will appear here
                  </p>
                </div>
              )}
            </div>
            {recentMessages.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full" onClick={() => onNavigate('/user/messages')}>
                  {recentMessages.length > 3 ? `View All ${recentMessages.length} Messages` : 'View All Messages'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks you can perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => onNavigate('/user/files')}
            >
              <FileText className="h-6 w-6 mb-2 text-user" />
              <span className="text-sm">Browse Files</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => onNavigate('/user/messages')}
            >
              <MessageSquare className="h-6 w-6 mb-2 text-user" />
              <span className="text-sm">Check Messages</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => onNavigate('/user/profile')}
            >
              <User className="h-6 w-6 mb-2 text-user" />
              <span className="text-sm">My Profile</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      {stats.unreadMessagesCount > 0 && (
        <Card className="border-user/30">
          <CardHeader>
            <CardTitle className="flex items-center text-user">
              <Bell className="mr-2 h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-user/10 p-4 rounded-lg">
              <p className="text-sm font-medium">
                You have {stats.unreadMessagesCount} unread message{stats.unreadMessagesCount > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Check your messages to stay updated with important information
              </p>
              <Button 
                size="sm" 
                className="mt-3 bg-user hover:bg-user/90"
                onClick={() => onNavigate('/user/messages')}
              >
                Read Messages
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};