import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  MessageSquare, 
  Download,
  Eye,
  Clock,
  Bell,
  User
} from 'lucide-react';

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
  userData: {
    name: string;
    email: string;
    clientName: string;
    assignedFiles: number;
    unreadMessages: number;
  };
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ 
  onNavigate, 
  userData 
}) => {
  // Mock data - will be replaced with real user-specific data from Supabase
  const recentFiles = [
    { 
      id: 1, 
      name: 'Employee_Handbook_2024.pdf', 
      size: '3.2 MB', 
      assignedAt: '1 day ago', 
      status: 'new',
      assignedBy: 'Admin'
    },
    { 
      id: 2, 
      name: 'Project_Brief.docx', 
      size: '1.1 MB', 
      assignedAt: '3 days ago', 
      status: 'viewed',
      assignedBy: 'Client Admin'
    },
    { 
      id: 3, 
      name: 'Training_Materials.zip', 
      size: '15.8 MB', 
      assignedAt: '1 week ago', 
      status: 'downloaded',
      assignedBy: 'Admin'
    },
  ];

  const recentMessages = [
    { 
      id: 1, 
      from: 'Admin', 
      subject: 'New training materials available', 
      time: '2 hours ago', 
      unread: true 
    },
    { 
      id: 2, 
      from: 'Client Admin', 
      subject: 'Project update and next steps', 
      time: '1 day ago', 
      unread: true 
    },
    { 
      id: 3, 
      from: 'Admin', 
      subject: 'System maintenance notice', 
      time: '3 days ago', 
      unread: false 
    },
  ];

  const StatusBadge = ({ status }: { status: string }) => {
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-user/10 to-user/5 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-user/20 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-user" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-user">
              Welcome, {userData.name}
            </h1>
            <p className="text-muted-foreground">
              {userData.clientName} • {userData.email}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Access your assigned files and stay updated with messages
            </p>
          </div>
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
            <div className="text-2xl font-bold">{userData.assignedFiles}</div>
            <p className="text-xs text-muted-foreground">Files available to you</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-user" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">New messages for you</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Clock className="h-4 w-4 text-user" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2h</div>
            <p className="text-xs text-muted-foreground">ago</p>
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
              {recentFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-user" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.size} • Assigned by {file.assignedBy}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file.assignedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={file.status} />
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" onClick={() => onNavigate('/user/files')}>
                View All My Files
              </Button>
            </div>
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
              {recentMessages.map((message) => (
                <div key={message.id} className={`p-3 rounded-lg border transition-colors hover:bg-muted/50 ${
                  message.unread ? 'border-user/30 bg-user/5' : ''
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">{message.from}</p>
                        {message.unread && (
                          <div className="h-2 w-2 bg-user rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-foreground mt-1">
                        {message.subject}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {message.time}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" onClick={() => onNavigate('/user/messages')}>
                View All Messages
              </Button>
            </div>
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
      {userData.unreadMessages > 0 && (
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
                You have {userData.unreadMessages} unread message{userData.unreadMessages > 1 ? 's' : ''}
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