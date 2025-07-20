import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Plus,
  Search,
  MoreVertical
} from 'lucide-react';

/**
 * AdminDashboard Component
 * 
 * Purpose: Main dashboard view for Admin users
 * Features:
 * - System overview with key metrics
 * - Quick actions for common admin tasks
 * - Recent activity feed
 * - Client and user management shortcuts
 * - File and message statistics
 * 
 * This component provides the central hub for administrators to:
 * - Monitor system health and usage
 * - Access management functions
 * - View recent system activity
 * - Navigate to detailed management screens
 */

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
  onRoleSwitch?: (role: 'admin' | 'client' | 'user') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onRoleSwitch }) => {
  // Mock data - will be replaced with real data from Supabase
  const stats = {
    totalClients: 12,
    totalUsers: 47,
    totalFiles: 156,
    totalMessages: 89,
    recentActivity: [
      { id: 1, action: 'New client registered', client: 'TechCorp Inc.', time: '2 hours ago' },
      { id: 2, action: 'File uploaded', file: 'Q4_Report.pdf', time: '4 hours ago' },
      { id: 3, action: 'Message sent', recipient: 'john@techcorp.com', time: '6 hours ago' },
      { id: 4, action: 'User added', user: 'jane@innovate.com', time: '1 day ago' },
    ]
  };

  const StatCard = ({ title, value, description, icon, trend }: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ReactNode;
    trend?: string;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-admin">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className="h-3 w-3 text-success mr-1" />
            <span className="text-xs text-success">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">

      {/* Header with quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your client portal system and monitor activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onNavigate('/admin/clients/new')} className="bg-admin hover:bg-admin/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
          <Button variant="outline" onClick={() => onNavigate('/admin/files/upload')}>
            <FileText className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          description="Active client companies"
          icon={<Building2 />}
          trend="+3 this month"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          description="Users across all clients"
          icon={<Users />}
          trend="+12 this month"
        />
        <StatCard
          title="Files Managed"
          value={stats.totalFiles}
          description="Total files in system"
          icon={<FileText />}
          trend="+28 this month"
        />
        <StatCard
          title="Messages Sent"
          value={stats.totalMessages}
          description="Messages this month"
          icon={<MessageSquare />}
          trend="+15% from last month"
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions across your client portal system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.client || activity.file || activity.recipient || activity.user}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" onClick={() => onNavigate('/admin/activity')}>
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('/admin/clients')}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Manage Clients
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('/admin/users')}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('/admin/files')}
            >
              <FileText className="mr-2 h-4 w-4" />
              File Management
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('/admin/messages')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Center
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('/admin/settings')}
            >
              <Search className="mr-2 h-4 w-4" />
              System Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Current system health and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Storage Usage</p>
                <p className="text-2xl font-bold">2.4 GB</p>
                <p className="text-xs text-muted-foreground">of 100 GB used</p>
              </div>
              <Badge variant="secondary" className="bg-success/10 text-success">
                Healthy
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Active Sessions</p>
                <p className="text-2xl font-bold">23</p>
                <p className="text-xs text-muted-foreground">users online</p>
              </div>
              <Badge variant="secondary" className="bg-success/10 text-success">
                Normal
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">System Load</p>
                <p className="text-2xl font-bold">Low</p>
                <p className="text-xs text-muted-foreground">optimal performance</p>
              </div>
              <Badge variant="secondary" className="bg-success/10 text-success">
                Optimal
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};