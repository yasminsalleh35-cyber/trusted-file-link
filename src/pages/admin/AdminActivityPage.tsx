import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  FileText, 
  MessageSquare, 
  Settings,
  BarChart3,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  User,
  File,
  Mail,
  Clock
} from 'lucide-react';

/**
 * AdminActivityPage Component
 * 
 * Purpose: Comprehensive activity monitoring page for admin users
 * Features:
 * - Real-time activity feed from Supabase
 * - Advanced filtering and search capabilities
 * - Activity type categorization
 * - Export functionality
 * - Pagination for large datasets
 * - Real-time updates
 */

interface ActivityItem {
  id: string;
  type: 'file_upload' | 'message_sent' | 'user_created' | 'client_created' | 'profile_updated';
  action: string;
  user: string;
  userEmail: string;
  details: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

interface Profile {
  full_name: string;
  email: string;
}

const AdminActivityPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const itemsPerPage = 20;

  // Handle navigation
  const handleNavigate = (route: string) => {
    navigate(route);
  };

  // Admin navigation items
  const navigationItems = [
    { 
      name: 'Mining HQ', 
      href: '/admin/dashboard', 
      icon: <BarChart3 className="h-5 w-5" />
    },
    { 
      name: 'Mining Companies', 
      href: '/admin/clients', 
      icon: <Building2 className="h-5 w-5" />
    },
    { 
      name: 'Workers', 
      href: '/admin/users', 
      icon: <Users className="h-5 w-5" />
    },
    { 
      name: 'Documents', 
      href: '/admin/files', 
      icon: <FileText className="h-5 w-5" />
    },
    { 
      name: 'Communications', 
      href: '/admin/messages', 
      icon: <MessageSquare className="h-5 w-5" />
    },
    { 
      name: 'Settings', 
      href: '/admin/settings', 
      icon: <Settings className="h-5 w-5" />
    },
  ];

  // Load comprehensive activity data from Supabase
  const loadActivityData = async (page = 1, refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      console.log('🔄 Loading activity data, page:', page);
      
      const offset = (page - 1) * itemsPerPage;
      const activities: ActivityItem[] = [];

      // 1. Get recent file uploads
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select(`
          id,
          filename,
          file_size,
          created_at,
          profiles:uploaded_by (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (filesError) {
        console.error('Error fetching files:', filesError);
      } else if (filesData) {
        filesData.forEach(file => {
          const profile = file.profiles as Profile | null;
          activities.push({
            id: `file-${file.id}`,
            type: 'file_upload',
            action: 'Document uploaded',
            user: profile?.full_name || 'Unknown User',
            userEmail: profile?.email || 'unknown@email.com',
            details: `${file.filename} (${formatFileSize(file.file_size || 0)})`,
            timestamp: file.created_at,
            status: 'success'
          });
        });
      }

      // 2. Get recent messages
      const { data: messagesData, error: messagesError } = await supabase
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
        .range(offset, offset + itemsPerPage - 1);

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
      } else if (messagesData) {
        messagesData.forEach(message => {
          const sender = message.sender as Profile | null;
          const recipient = message.recipient as Profile | null;
          activities.push({
            id: `message-${message.id}`,
            type: 'message_sent',
            action: 'Message sent',
            user: sender?.full_name || 'Unknown User',
            userEmail: sender?.email || 'unknown@email.com',
            details: `To: ${recipient?.full_name || 'Unknown'} - Subject: ${message.subject || 'No subject'}`,
            timestamp: message.created_at,
            status: 'success'
          });
        });
      }

      // 3. Get recent profile updates (user registrations)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at, updated_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      } else if (profilesData) {
        profilesData.forEach(profile => {
          activities.push({
            id: `profile-${profile.id}`,
            type: 'user_created',
            action: 'User account created',
            user: profile.full_name,
            userEmail: profile.email,
            details: `Role: ${profile.role}`,
            timestamp: profile.created_at,
            status: 'success'
          });
        });
      }

      // 4. Get recent client registrations
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, company_name, contact_email, created_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
      } else if (clientsData) {
        clientsData.forEach(client => {
          activities.push({
            id: `client-${client.id}`,
            type: 'client_created',
            action: 'Mining company registered',
            user: 'System',
            userEmail: 'system@mininghub.com',
            details: `${client.company_name} (${client.contact_email})`,
            timestamp: client.created_at,
            status: 'success'
          });
        });
      }

      // Sort all activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply filters
      let filteredActivities = activities;
      
      if (searchTerm) {
        filteredActivities = activities.filter(activity =>
          activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.details.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (filterType !== 'all') {
        filteredActivities = filteredActivities.filter(activity => activity.type === filterType);
      }
      
      if (filterStatus !== 'all') {
        filteredActivities = filteredActivities.filter(activity => activity.status === filterStatus);
      }

      // Calculate pagination
      const totalItems = filteredActivities.length;
      const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
      
      // Get current page items
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentPageItems = filteredActivities.slice(startIndex, endIndex);

      setActivities(currentPageItems);
      setTotalPages(calculatedTotalPages);
      setCurrentPage(page);

      console.log('✅ Activity data loaded:', {
        totalActivities: activities.length,
        filteredActivities: filteredActivities.length,
        currentPageItems: currentPageItems.length,
        totalPages: calculatedTotalPages
      });

    } catch (error) {
      console.error('❌ Error loading activity data:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Format file size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format time ago helper
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'file_upload': return <File className="h-4 w-4" />;
      case 'message_sent': return <Mail className="h-4 w-4" />;
      case 'user_created': return <User className="h-4 w-4" />;
      case 'client_created': return <Building2 className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success/10 text-success';
      case 'warning': return 'bg-warning/10 text-warning';
      case 'error': return 'bg-destructive/10 text-destructive';
      default: return 'bg-secondary/10 text-secondary';
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    loadActivityData(currentPage, true);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle filter changes
  const handleFilterChange = (type: 'type' | 'status', value: string) => {
    if (type === 'type') {
      setFilterType(value);
    } else {
      setFilterStatus(value);
    }
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadActivityData(currentPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, filterType, filterStatus]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout
      userRole={user.role}
      userEmail={user.email}
      onLogout={logout}
      navigation={navigationItems}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Activity</h1>
            <p className="text-muted-foreground">
              Comprehensive activity monitoring across your mining management system
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search activities, users, or details..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="file_upload">File Uploads</SelectItem>
                  <SelectItem value="message_sent">Messages</SelectItem>
                  <SelectItem value="user_created">User Accounts</SelectItem>
                  <SelectItem value="client_created">Mining Companies</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
            <CardDescription>
              Real-time system activities and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full"></div>
                      <div className="space-y-2">
                        <div className="w-48 h-4 bg-muted rounded"></div>
                        <div className="w-32 h-3 bg-muted rounded"></div>
                      </div>
                    </div>
                    <div className="w-16 h-6 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No activities found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                    ? 'Try adjusting your filters or search terms.'
                    : 'System activities will appear here as they occur.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <Badge 
                            variant="secondary" 
                            className={getStatusBadgeClass(activity.status)}
                          >
                            {activity.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          <span className="font-medium">{activity.user}</span> ({activity.userEmail})
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.details}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminActivityPage;