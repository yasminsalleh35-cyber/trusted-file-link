import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
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

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  time: string;
}

interface Profile {
  full_name: string;
  email: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onRoleSwitch }) => {
  const [stats, setStats] = React.useState({
    totalClients: 0,
    totalUsers: 0,
    totalFiles: 0,
    totalMessages: 0,
    recentActivity: [] as RecentActivity[]
  });
  const [isLoading, setIsLoading] = React.useState(true);

  // Load real data from Supabase
  React.useEffect(() => {
    const loadDashboardData = async () => {
      try {
        console.log('🔄 Loading real dashboard data from database...');
        
        // Execute all queries in parallel for better performance
        const [
          clientsResult,
          usersResult, 
          filesResult,
          messagesResult
        ] = await Promise.all([
          // 1. Count Mining Companies (clients table)
          supabase
            .from('clients')
            .select('id', { count: 'exact', head: true }),
          
          // 2. Count Total Workers (profiles with role 'user')
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'user'),
          
          // 3. Count Documents Managed (files table)
          supabase
            .from('files')
            .select('id', { count: 'exact', head: true }),
          
          // 4. Count Communications (messages table)
          supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
        ]);

        // Check for any errors in the queries
        if (clientsResult.error) {
          console.error('Error fetching clients count:', clientsResult.error);
        }
        if (usersResult.error) {
          console.error('Error fetching users count:', usersResult.error);
        }
        if (filesResult.error) {
          console.error('Error fetching files count:', filesResult.error);
        }
        if (messagesResult.error) {
          console.error('Error fetching messages count:', messagesResult.error);
        }

        // Get recent activity (last 10 actions)
        const { data: recentFiles } = await supabase
          .from('files')
          .select(`
            id,
            filename,
            created_at,
            profiles:uploaded_by (
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        const { data: recentMessages } = await supabase
          .from('messages')
          .select(`
            id,
            subject,
            created_at,
            sender:profiles!messages_sender_id_fkey (
              full_name,
              email
            ),
            recipient:profiles!messages_recipient_id_fkey (
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        // Build recent activity array
        const recentActivity = [];
        
        // Add file uploads
        if (recentFiles) {
          recentFiles.forEach((file, index) => {
            recentActivity.push({
              id: `file-${file.id}`,
              action: `Document uploaded: ${file.filename}`,
              user: (file.profiles as Profile | null)?.full_name || 'Unknown user',
              time: formatTimeAgo(file.created_at)
            });
          });
        }

        // Add messages
        if (recentMessages) {
          recentMessages.forEach((message, index) => {
            recentActivity.push({
              id: `message-${message.id}`,
              action: `Message sent: ${message.subject || 'No subject'}`,
              user: `${(message.sender as Profile | null)?.full_name || 'Unknown'} → ${(message.recipient as Profile | null)?.full_name || 'Unknown'}`,
              time: formatTimeAgo(message.created_at)
            });
          });
        }

        // Sort by most recent and limit to 4 items
        recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        const limitedActivity = recentActivity.slice(0, 4);

        // Update state with real data
        setStats({
          totalClients: clientsResult.count || 0,
          totalUsers: usersResult.count || 0,
          totalFiles: filesResult.count || 0,
          totalMessages: messagesResult.count || 0,
          recentActivity: limitedActivity.length > 0 ? limitedActivity : [
            { id: 1, action: 'No recent activity', user: 'System', time: 'N/A' }
          ]
        });

        console.log('✅ Dashboard data loaded successfully:', {
          clients: clientsResult.count,
          users: usersResult.count,
          files: filesResult.count,
          messages: messagesResult.count
        });

        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        
        // Set fallback data on error
        setStats({
          totalClients: 0,
          totalUsers: 0,
          totalFiles: 0,
          totalMessages: 0,
          recentActivity: [
            { id: 1, action: 'Error loading data', user: 'System', time: 'Just now' }
          ]
        });
        setIsLoading(false);
      }
    };

    // Helper function to format time ago
    const formatTimeAgo = (dateString: string | null) => {
      if (!dateString) return 'Unknown time';
      
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    loadDashboardData();
  }, []);

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
          <h1 className="text-3xl font-bold tracking-tight">Mining Management Dashboard</h1>
          <p className="text-muted-foreground">
            Oversee mining operations, manage companies and workers, monitor system activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onNavigate('/admin/clients/new')} className="bg-admin hover:bg-admin/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Mining Company
          </Button>
          <Button variant="outline" onClick={() => onNavigate('/admin/files/upload')}>
            <FileText className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Mining Companies"
          value={isLoading ? "..." : stats.totalClients}
          description="Active mining operations"
          icon={<Building2 />}
          trend={isLoading ? "" : "+1 this month"}
        />
        <StatCard
          title="Total Workers"
          value={isLoading ? "..." : stats.totalUsers}
          description="Workers across all sites"
          icon={<Users />}
          trend={isLoading ? "" : "+3 this month"}
        />
        <StatCard
          title="Documents Managed"
          value={isLoading ? "..." : stats.totalFiles}
          description="Total documents in system"
          icon={<FileText />}
          trend="+28 this month"
        />
        <StatCard
          title="Communications"
          value={stats.totalMessages}
          description="Messages this month"
          icon={<MessageSquare />}
          trend="+15% from last month"
        />
      </div>

      {/* Main content - Focused layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity - Full width on mobile, half on desktop */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions across your mining management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user}
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

        {/* Quick Actions - Balanced with Recent Activity */}
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
              Manage Mining Companies
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('/admin/users')}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Workers
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('/admin/files')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Document Management
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('/admin/messages')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Communication Center
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

      {/* System Health Status - Compact */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Storage Usage</p>
                <p className="text-2xl font-bold">2.4 GB</p>
                <p className="text-xs text-muted-foreground">of 100 GB used</p>
              </div>
              <Badge variant="secondary" className="bg-success/10 text-success">
                Healthy
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active Workers</p>
                <p className="text-2xl font-bold">23</p>
                <p className="text-xs text-muted-foreground">currently online</p>
              </div>
              <Badge variant="secondary" className="bg-success/10 text-success">
                Normal
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">System Load</p>
                <p className="text-2xl font-bold">Low</p>
                <p className="text-xs text-muted-foreground">optimal performance</p>
              </div>
              <Badge variant="secondary" className="bg-success/10 text-success">
                Optimal
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};