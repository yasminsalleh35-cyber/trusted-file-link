import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Download,
  Plus,
  Clock,
  CheckCircle
} from 'lucide-react';

/**
 * ClientDashboard Component
 * 
 * Purpose: Main dashboard view for Client users
 * Features:
 * - Overview of client's team and resources
 * - Quick access to files assigned to the client
 * - Team member management
 * - Recent activity within the client's scope
 * - Message center for communication with admin and users
 * 
 * Access Control:
 * - Can only see their own users and assigned files
 * - Can manage users under their client account
 * - Can communicate with admin and their own users
 * - Cannot see other clients' data
 */

interface ClientDashboardProps {
  onNavigate: (path: string) => void;
  clientData: {
    companyName: string;
    userCount: number;
    assignedFiles: number;
    recentMessages: number;
  };
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ 
  onNavigate, 
  clientData 
}) => {
  // Mock data - will be replaced with real client-specific data from Supabase
  const recentFiles = [
    { id: 1, name: 'Monthly_Report_Dec.pdf', size: '2.4 MB', uploadedAt: '2 days ago', status: 'new' },
    { id: 2, name: 'Team_Guidelines.docx', size: '856 KB', uploadedAt: '1 week ago', status: 'viewed' },
    { id: 3, name: 'Project_Specs.xlsx', size: '1.2 MB', uploadedAt: '2 weeks ago', status: 'downloaded' },
  ];

  const teamMembers = [
    { id: 1, name: 'John Smith', email: 'john@company.com', lastActive: '2 hours ago', status: 'online' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@company.com', lastActive: '1 day ago', status: 'offline' },
    { id: 3, name: 'Mike Davis', email: 'mike@company.com', lastActive: '3 hours ago', status: 'online' },
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-client">
            {clientData.companyName}
          </h1>
          <p className="text-muted-foreground">
            Manage your team and access your resources
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onNavigate('/client/users/add')} className="bg-client hover:bg-client/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Team Member
          </Button>
          <Button variant="outline" onClick={() => onNavigate('/client/messages/new')}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Contact Admin
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-client" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientData.userCount}</div>
            <p className="text-xs text-muted-foreground">Active users in your team</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Files</CardTitle>
            <FileText className="h-4 w-4 text-client" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientData.assignedFiles}</div>
            <p className="text-xs text-muted-foreground">Files available to your team</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-client" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientData.recentMessages}</div>
            <p className="text-xs text-muted-foreground">Unread messages</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Download className="h-4 w-4 text-client" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2 GB</div>
            <p className="text-xs text-muted-foreground">of allocated storage</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Files */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Files</CardTitle>
            <CardDescription>
              Files recently assigned to your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-client" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.size} • {file.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={file.status} />
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" onClick={() => onNavigate('/client/files')}>
                View All Files
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage your team members and their access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-client/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-client">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${
                        member.status === 'online' ? 'bg-success' : 'bg-muted-foreground'
                      }`} />
                      <span className="text-xs text-muted-foreground capitalize">
                        {member.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {member.lastActive}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" onClick={() => onNavigate('/client/team')}>
                Manage Team
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
            Common tasks for managing your team and resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => onNavigate('/client/files')}
            >
              <FileText className="h-6 w-6 mb-2 text-client" />
              <span className="text-sm">View Files</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => onNavigate('/client/team')}
            >
              <Users className="h-6 w-6 mb-2 text-client" />
              <span className="text-sm">Manage Team</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => onNavigate('/client/messages')}
            >
              <MessageSquare className="h-6 w-6 mb-2 text-client" />
              <span className="text-sm">Messages</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => onNavigate('/client/reports')}
            >
              <Clock className="h-6 w-6 mb-2 text-client" />
              <span className="text-sm">Activity</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};