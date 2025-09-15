import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MessageSquare, 
  Search, 
  RefreshCw, 
  Send,
  Filter,
  BarChart3,
  FileText,
  Users,
  Inbox,
  Mail,
  MailOpen,
  Building2,
  Settings
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EnhancedMessageCard } from '@/components/messages/EnhancedMessageCard';
import { MessageDetailModal } from '@/components/messages/MessageDetailModal';
import { ComposeMessageModal } from '@/components/messages/ComposeMessageModal';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { MessageFilters } from '@/hooks/useMessages';

/**
 * ClientMessagesPage Component
 * 
 * Purpose: Complete message management interface for mining site managers
 * Features:
 * - Message inbox with filtering and search
 * - Message composition to workers and HQ
 * - Message detail view
 * - Real-time updates
 * - Mining-themed UI
 */

const ClientMessagesPage: React.FC = () => {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const {
    messages,
    stats,
    filters,
    isLoading,
    error,
    sendMessage,
    sendToAllClientUsers,
    markAsRead,
    deleteMessage,
    refreshMessages,
    updateFilters,
    clearFilters,
    getMessageById
  } = useMessages();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<any>(null);
  const [composePreset, setComposePreset] = useState<'admin' | null>(null);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Client navigation items
  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/client/dashboard', 
      icon: <BarChart3 className="h-5 w-5" />
    },
    { 
      name: 'Manage Users', 
      href: '/client/team', 
      icon: <Users className="h-5 w-5" />
    },
    { 
      name: 'Site Documents', 
      href: '/client/files', 
      icon: <FileText className="h-5 w-5" />
    },
    { 
      name: 'Communications', 
      href: '/client/messages', 
      icon: <MessageSquare className="h-5 w-5" />
    },
    { 
      name: 'Site Settings', 
      href: '/client/settings', 
      icon: <Settings className="h-5 w-5" />
    },
  ];

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    updateFilters({ searchTerm: value || undefined });
  };

  // Handle filter change
  const handleFilterChange = (key: keyof MessageFilters, value: any) => {
    updateFilters({ [key]: value === 'all' ? undefined : value });
  };

  // Handle message view
  const handleMessageView = async (messageId: string) => {
    setSelectedMessageId(messageId);
    
    const message = getMessageById(messageId);
    if (message?.is_unread) {
      try {
        await markAsRead(messageId);
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  // Handle message reply
  const handleMessageReply = (message: any) => {
    setReplyToMessage(message);
    setIsComposeOpen(true);
  };

  // Handle message delete
  const handleMessageDelete = async (messageId: string) => {
    try {
      const result = await deleteMessage(messageId);
      if (result.success) {
        toast({
          title: 'Message Deleted',
          description: 'The message has been deleted successfully',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete message',
        variant: 'destructive'
      });
    }
  };

  // Handle send message
  const handleSendMessage = async (messageData: any) => {
    try {
      const result = await sendMessage(messageData);
      if (result.success) {
        setIsComposeOpen(false);
        setReplyToMessage(null);
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    refreshMessages();
    toast({
      title: 'Messages Refreshed',
      description: 'Your messages have been updated',
    });
  };

  // Get selected message
  const selectedMessage = selectedMessageId ? getMessageById(selectedMessageId) : null;

  // Auto-open compose if URL has compose=admin, or open broadcast modal if broadcast=1
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const compose = params.get('compose');
    const broadcast = params.get('broadcast');
    if (compose === 'admin') {
      setComposePreset('admin');
      setIsComposeOpen(true);
    }
    if (broadcast === '1') {
      setIsBroadcastOpen(true);
    }
  }, []);

  return (
    <DashboardLayout 
      userRole={user?.role || 'client'}
      userEmail={user?.email || ''}
      onLogout={logout}
      navigation={navigationItems}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-mining-header">Site Communications</h1>
            <p className="text-muted-foreground font-mining-body">
              Communicate with admin and your users
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => setIsComposeOpen(true)}
              className="bg-mining-primary hover:bg-mining-primary/90"
            >
              <Send className="h-4 w-4 mr-2" />
              New Message
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsBroadcastOpen(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              Message All Users
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-mining-secondary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-mining-body">Total Messages</CardTitle>
              <Inbox className="h-4 w-4 text-mining-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mining-mono">{stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">All communications</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-mining-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-mining-body">Unread</CardTitle>
              <Mail className="h-4 w-4 text-mining-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mining-mono">{stats.unreadMessages}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-mining-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-mining-body">From Admin</CardTitle>
              <MailOpen className="h-4 w-4 text-mining-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mining-mono">
                {messages.filter(m => m.message_type === 'admin_to_client' && m.recipient_id).length}
              </div>
              <p className="text-xs text-muted-foreground">From headquarters</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-client">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-mining-body">To User</CardTitle>
              <Building2 className="h-4 w-4 text-client" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mining-mono">
                {messages.filter(m => m.message_type === 'client_to_user' && m.sender_id).length}
              </div>
              <p className="text-xs text-muted-foreground">To Site User</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter Messages</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 font-mining-body"
                />
              </div>

              {/* Status Filter */}
              <Select 
                value={filters.isUnread === undefined ? 'all' : filters.isUnread ? 'unread' : 'read'} 
                onValueChange={(value) => handleFilterChange('isUnread', value === 'all' ? undefined : value === 'unread')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="unread">Unread Only</SelectItem>
                  <SelectItem value="read">Read Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Message Type Filter */}
              <Select 
                value={filters.messageType || 'all'} 
                onValueChange={(value) => handleFilterChange('messageType', value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="admin_to_client">From Admin</SelectItem>
                  <SelectItem value="client_to_user">To Site User</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>
              {messages.length > 0 
                ? `Showing ${messages.length} message${messages.length > 1 ? 's' : ''}`
                : 'No messages found'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <div className="text-destructive mb-2">Error loading messages</div>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <EnhancedMessageCard
                    key={message.id}
                    message={message}
                    onView={handleMessageView}
                    onReply={handleMessageReply}
                    onDelete={handleMessageDelete}
                    onMarkAsRead={markAsRead}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No messages found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || Object.keys(filters).length > 0
                    ? 'No messages match your current filters.'
                    : 'You haven\'t sent or received any site communications yet.'
                  }
                </p>
                {(searchTerm || Object.keys(filters).length > 0) && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Message Detail Modal */}
      <MessageDetailModal
        message={selectedMessage}
        isOpen={!!selectedMessage}
        onClose={() => setSelectedMessageId(null)}
        onReply={handleMessageReply}
        onDelete={handleMessageDelete}
      />

      {/* Compose Message Modal */}
      <ComposeMessageModal
        isOpen={isComposeOpen}
        onClose={() => {
          setIsComposeOpen(false);
          setReplyToMessage(null);
          setComposePreset(null);
          const url = new URL(window.location.href);
          url.searchParams.delete('compose');
          window.history.replaceState({}, '', url.toString());
        }}
        onSend={handleSendMessage}
        preselectedRecipient={replyToMessage ? {
          id: replyToMessage.sender_id,
          name: replyToMessage.sender_name,
          role: replyToMessage.sender_role
        } : undefined}
        presetRole={composePreset === 'admin' ? 'admin' : undefined}
      />

      {/* Broadcast to all site users modal */}
      <Dialog open={isBroadcastOpen} onOpenChange={() => setIsBroadcastOpen(false)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-mining-header">Message All Site Users</DialogTitle>
            <DialogDescription>Send an announcement to every user at your site.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="Subject (optional)"
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
            />
            <Textarea 
              placeholder="Type your announcement..."
              rows={6}
              value={broadcastContent}
              onChange={(e) => setBroadcastContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsBroadcastOpen(false)} disabled={isBroadcasting}>Cancel</Button>
              <Button 
                onClick={async () => {
                  try {
                    setIsBroadcasting(true);
                    const result = await sendToAllClientUsers({ subject: broadcastSubject || undefined, content: broadcastContent.trim() });
                    if (result.success) {
                      toast({ title: 'Announcement sent', description: `Delivered to ${result.sentCount} users.` });
                      setIsBroadcastOpen(false);
                      setBroadcastSubject('');
                      setBroadcastContent('');
                    } else {
                      toast({ title: 'Failed to send', description: result.error || 'Unknown error', variant: 'destructive' });
                    }
                  } finally {
                    setIsBroadcasting(false);
                  }
                }}
                disabled={isBroadcasting || !broadcastContent.trim()}
                className="bg-mining-primary hover:bg-mining-primary/90"
              >
                {isBroadcasting ? 'Sending…' : 'Send to All Users'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClientMessagesPage;