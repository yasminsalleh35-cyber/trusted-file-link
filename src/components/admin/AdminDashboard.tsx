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
  details: string;
  timestamp: string;
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

  const [systemMetrics, setSystemMetrics] = React.useState({
    storageUsed: 0,
    storageTotal: 100, // GB - could be configurable
    activeWorkers: 0,
    systemLoad: 'Low' as 'Low' | 'Medium' | 'High',
    storageStatus: 'Healthy' as 'Healthy' | 'Warning' | 'Critical',
    workersStatus: 'Normal' as 'Normal' | 'High' | 'Critical',
    loadStatus: 'Optimal' as 'Optimal' | 'Good' | 'Poor'
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

        // Get comprehensive recent activity (matching Activity Feed logic)
        const recentActivity = [];

        // 1. Get recent file uploads
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
          .limit(10);

        // 2. Get recent messages
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
          .limit(10);

        // 3. Get recent user registrations
        const { data: recentProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        // 4. Get recent client registrations
        const { data: recentClients } = await supabase
          .from('clients')
          .select('id, company_name, contact_email, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        // Build comprehensive activity array (matching Activity Feed format)
        
        // Add file uploads
        if (recentFiles) {
          recentFiles.forEach(file => {
            recentActivity.push({
              id: `file-${file.id}`,
              action: 'Document uploaded',
              user: (file.profiles as Profile | null)?.full_name || 'Unknown user',
              details: file.filename,
              timestamp: file.created_at,
              time: formatTimeAgo(file.created_at)
            });
          });
        }

        // Add messages
        if (recentMessages) {
          recentMessages.forEach(message => {
            const sender = message.sender as Profile | null;
            const recipient = message.recipient as Profile | null;
            recentActivity.push({
              id: `message-${message.id}`,
              action: 'Message sent',
              user: sender?.full_name || 'Unknown user',
              details: `To: ${recipient?.full_name || 'Unknown'} - Subject: ${message.subject || 'No subject'}`,
              timestamp: message.created_at,
              time: formatTimeAgo(message.created_at)
            });
          });
        }

        // Add user registrations
        if (recentProfiles) {
          recentProfiles.forEach(profile => {
            recentActivity.push({
              id: `profile-${profile.id}`,
              action: 'User account created',
              user: profile.full_name,
              details: `Role: ${profile.role}`,
              timestamp: profile.created_at,
              time: formatTimeAgo(profile.created_at)
            });
          });
        }

        // Add client registrations
        if (recentClients) {
          recentClients.forEach(client => {
            recentActivity.push({
              id: `client-${client.id}`,
              action: 'Mining company registered',
              user: 'System',
              details: `${client.company_name} (${client.contact_email})`,
              timestamp: client.created_at,
              time: formatTimeAgo(client.created_at)
            });
          });
        }

        // Sort by actual timestamp (most recent first) and limit to 4 items
        recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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

        // Load system metrics
        await loadSystemMetrics();

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

    // Load system metrics (storage, active workers, system load)
    const loadSystemMetrics = async () => {
      try {
        console.log('🔄 Loading system metrics...');

        // 1. Calculate Storage Usage from files table
        const { data: filesData, error: filesError } = await supabase
          .from('files')
          .select('file_size');

        if (filesError) {
          console.error('Error fetching file sizes:', filesError);
        }

        // Calculate total storage used (convert bytes to GB)
        const totalBytes = filesData?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;
        const storageUsedGB = totalBytes / (1024 * 1024 * 1024); // Convert to GB

        // 2. Count Active Workers (users who have been active recently)
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const { data: activeUsersData, error: activeUsersError } = await supabase
          .from('profiles')
          .select('id, updated_at')
          .eq('role', 'user')
          .gte('updated_at', twentyFourHoursAgo.toISOString());

        if (activeUsersError) {
          console.error('Error fetching active users:', activeUsersError);
        }

        const activeWorkers = activeUsersData?.length || 0;

        // 3. Calculate System Load based on recent activity
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        const [recentFilesCount, recentMessagesCount] = await Promise.all([
          supabase
            .from('files')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', oneHourAgo.toISOString()),
          supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', oneHourAgo.toISOString())
        ]);

        const recentActivity = (recentFilesCount.count || 0) + (recentMessagesCount.count || 0);

        // Determine system load based on recent activity
        let systemLoad: 'Low' | 'Medium' | 'High' = 'Low';
        let loadStatus: 'Optimal' | 'Good' | 'Poor' = 'Optimal';

        if (recentActivity > 50) {
          systemLoad = 'High';
          loadStatus = 'Poor';
        } else if (recentActivity > 20) {
          systemLoad = 'Medium';
          loadStatus = 'Good';
        }

        // Determine storage status
        const storagePercentage = (storageUsedGB / 100) * 100; // Assuming 100GB total
        let storageStatus: 'Healthy' | 'Warning' | 'Critical' = 'Healthy';

        if (storagePercentage > 90) {
          storageStatus = 'Critical';
        } else if (storagePercentage > 75) {
          storageStatus = 'Warning';
        }

        // Determine workers status
        let workersStatus: 'Normal' | 'High' | 'Critical' = 'Normal';
        if (activeWorkers > 100) {
          workersStatus = 'Critical';
        } else if (activeWorkers > 50) {
          workersStatus = 'High';
        }

        setSystemMetrics({
          storageUsed: Math.round(storageUsedGB * 100) / 100, // Round to 2 decimal places
          storageTotal: 100, // GB - could be configurable
          activeWorkers,
          systemLoad,
          storageStatus,
          workersStatus,
          loadStatus
        });

        console.log('✅ System metrics loaded:', {
          storageUsed: storageUsedGB,
          activeWorkers,
          systemLoad,
          recentActivity
        });

      } catch (error) {
        console.error('❌ Error loading system metrics:', error);
        
        // Set fallback metrics on error
        setSystemMetrics({
          storageUsed: 0,
          storageTotal: 100,
          activeWorkers: 0,
          systemLoad: 'Low',
          storageStatus: 'Healthy',
          workersStatus: 'Normal',
          loadStatus: 'Optimal'
        });
      }
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
        {/* <div className="flex gap-2">
          <Button onClick={() => onNavigate('/admin/clients/new')} className="bg-admin hover:bg-admin/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Mining Company
          </Button>
          <Button variant="outline" onClick={() => onNavigate('/admin/files/upload')}>
            <FileText className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div> */}
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground mb-1">
                      <span className="font-medium">{activity.user}</span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.details}
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
              Manage Clients.
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
                <p className="text-2xl font-bold">
                  {isLoading ? "..." : `${systemMetrics.storageUsed} GB`}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {systemMetrics.storageTotal} GB used
                </p>
              </div>
              <Badge 
                variant="secondary" 
                className={
                  systemMetrics.storageStatus === 'Critical' 
                    ? "bg-destructive/10 text-destructive"
                    : systemMetrics.storageStatus === 'Warning'
                    ? "bg-warning/10 text-warning"
                    : "bg-success/10 text-success"
                }
              >
                {systemMetrics.storageStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active Workers</p>
                <p className="text-2xl font-bold">
                  {isLoading ? "..." : systemMetrics.activeWorkers}
                </p>
                <p className="text-xs text-muted-foreground">active in last 24h</p>
              </div>
              <Badge 
                variant="secondary" 
                className={
                  systemMetrics.workersStatus === 'Critical' 
                    ? "bg-destructive/10 text-destructive"
                    : systemMetrics.workersStatus === 'High'
                    ? "bg-warning/10 text-warning"
                    : "bg-success/10 text-success"
                }
              >
                {systemMetrics.workersStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">System Load</p>
                <p className="text-2xl font-bold">
                  {isLoading ? "..." : systemMetrics.systemLoad}
                </p>
                <p className="text-xs text-muted-foreground">
                  {systemMetrics.loadStatus.toLowerCase()} performance
                </p>
              </div>
              <Badge 
                variant="secondary" 
                className={
                  systemMetrics.loadStatus === 'Poor' 
                    ? "bg-destructive/10 text-destructive"
                    : systemMetrics.loadStatus === 'Good'
                    ? "bg-warning/10 text-warning"
                    : "bg-success/10 text-success"
                }
              >
                {systemMetrics.loadStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};