import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Search, 
  RefreshCw, 
  Send,
  Filter,
  BarChart3,
  Building2,
  Users,
  FileText,
  Inbox,
  Mail,
  MailOpen,
  Shield,
  Radio,
  Megaphone,
  Newspaper,
  Plus
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EnhancedMessageCard } from '@/components/messages/EnhancedMessageCard';
import { MessageDetailModal } from '@/components/messages/MessageDetailModal';
import { ComposeMessageModal } from '@/components/messages/ComposeMessageModal';
import { NewsCard } from '@/components/news/NewsCard';
import { NewsDetailModal } from '@/components/news/NewsDetailModal';
import { CreateNewsModal } from '@/components/news/CreateNewsModal';
import { useMessages } from '@/hooks/useMessages';
import { useNews } from '@/hooks/useNews';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MessageFilters } from '@/hooks/useMessages';
import type { NewsFilters } from '@/hooks/useNews';

/**
 * AdminMessagesPage Component
 * 
 * Purpose: Unified communication center for Mining HQ administrators
 * Features:
 * - Personal message management (direct communications)
 * - Company news and announcements system
 * - Assignment-based news distribution
 * - Broadcast capabilities for company-wide communications
 * - Real-time updates for both messages and news
 * - Mining-themed UI with role-based styling
 */

const AdminMessagesPage: React.FC = () => {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  
  // Messages hook
  const {
    messages,
    stats: messageStats,
    filters: messageFilters,
    isLoading: messagesLoading,
    error: messagesError,
    sendMessage,
    markAsRead,
    deleteMessage,
    refreshMessages,
    updateFilters: updateMessageFilters,
    clearFilters: clearMessageFilters,
    getMessageById
  } = useMessages();

  // News hook - only initialize when news tab is active
  const {
    news,
    stats: newsStats,
    filters: newsFilters,
    isLoading: newsLoading,
    error: newsError,
    createAndAssignNews,
    getAssignmentTargets,
    updateFilters: updateNewsFilters,
    clearFilters: clearNewsFilters,
    refreshNews,
    getNewsById
  } = useNews();

  // Local state
  const [activeTab, setActiveTab] = useState('messages');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isCreateNewsOpen, setIsCreateNewsOpen] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<any>(null);
  const [assignmentTargets, setAssignmentTargets] = useState<any[]>([]);

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
  ];

  // Load assignment targets on mount
  React.useEffect(() => {
    const loadTargets = async () => {
      const targets = await getAssignmentTargets();
      setAssignmentTargets(targets);
    };
    loadTargets();
  }, []); // Remove getAssignmentTargets dependency to prevent infinite loop

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (activeTab === 'messages') {
      updateMessageFilters({ searchTerm: value || undefined });
    } else {
      updateNewsFilters({ searchTerm: value || undefined });
    }
  };

  // Handle message filter change
  const handleMessageFilterChange = (key: keyof MessageFilters, value: any) => {
    updateMessageFilters({ [key]: value === 'all' ? undefined : value });
  };

  // Handle news filter change
  const handleNewsFilterChange = (key: keyof NewsFilters, value: any) => {
    updateNewsFilters({ [key]: value === 'all' ? undefined : value });
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

  // Handle news view
  const handleNewsView = (newsId: string) => {
    setSelectedNewsId(newsId);
  };

  // Handle news creation
  const handleCreateNews = async (newsData: any, targets: any[]) => {
    try {
      const result = await createAndAssignNews(newsData, targets);
      if (result.success) {
        setIsCreateNewsOpen(false);
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating news:', error);
      throw error;
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    if (activeTab === 'messages') {
      refreshMessages();
      toast({
        title: 'Messages Refreshed',
        description: 'Your messages have been updated',
      });
    } else {
      refreshNews();
      toast({
        title: 'News Refreshed',
        description: 'Company announcements have been updated',
      });
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    if (activeTab === 'messages') {
      clearMessageFilters();
    } else {
      clearNewsFilters();
    }
  };

  // Get selected message and news
  const selectedMessage = selectedMessageId ? getMessageById(selectedMessageId) : null;
  const selectedNews = selectedNewsId ? getNewsById(selectedNewsId) : null;

  return (
    <DashboardLayout 
      userRole={user?.role || 'admin'}
      userEmail={user?.email || ''}
      onLogout={logout}
      navigation={navigationItems}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-mining-header">Mining Communications Center</h1>
            <p className="text-muted-foreground font-mining-body">
              Unified platform for personal messages and company announcements
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={messagesLoading || newsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(messagesLoading || newsLoading) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {activeTab === 'messages' ? (
              <Button 
                onClick={() => setIsComposeOpen(true)}
                className="bg-mining-primary hover:bg-mining-primary/90"
              >
                <Send className="h-4 w-4 mr-2" />
                New Message
              </Button>
            ) : (
              <Button 
                onClick={() => setIsCreateNewsOpen(true)}
                className="bg-mining-secondary hover:bg-mining-secondary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            )}
          </div>
        </div>

        {/* Unified Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-mining-secondary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-mining-body">Personal Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-mining-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mining-mono">{messageStats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">{messageStats.unreadMessages} unread</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-mining-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-mining-body">Company News</CardTitle>
              <Newspaper className="h-4 w-4 text-mining-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mining-mono">{newsStats.totalNews}</div>
              <p className="text-xs text-muted-foreground">{newsStats.myAssignedNews} assigned</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-admin">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-mining-body">To Site Managers</CardTitle>
              <Building2 className="h-4 w-4 text-admin" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mining-mono">
                {messages.filter(m => m.message_type === 'admin_to_client' && m.sender_id).length}
              </div>
              <p className="text-xs text-muted-foreground">Direct messages</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-mining-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-mining-body">To Workers</CardTitle>
              <Shield className="h-4 w-4 text-mining-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mining-mono">
                {messages.filter(m => m.message_type === 'admin_to_user' && m.sender_id).length}
              </div>
              <p className="text-xs text-muted-foreground">Direct messages</p>
            </CardContent>
          </Card>
        </div>

        {/* Unified Communication Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="messages" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Personal Messages</span>
                {messageStats.unreadMessages > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                    {messageStats.unreadMessages}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center space-x-2">
                <Newspaper className="h-4 w-4" />
                <span>Company News</span>
                {newsStats.totalNews > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                    {newsStats.totalNews}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Quick Actions */}
            <div className="flex space-x-2">
              {activeTab === 'messages' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsComposeOpen(true)}
                  >
                    <Building2 className="h-4 w-4 mr-2 text-client" />
                    Message Site Managers
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsComposeOpen(true)}
                  >
                    <Users className="h-4 w-4 mr-2 text-user" />
                    Message Workers
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateNewsOpen(true)}
                  >
                    <Shield className="h-4 w-4 mr-2 text-mining-primary" />
                    Safety Alert
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateNewsOpen(true)}
                  >
                    <Megaphone className="h-4 w-4 mr-2 text-mining-accent" />
                    Company Broadcast
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <TabsContent value="messages" className="space-y-6">
            {/* Message Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filter Personal Messages</span>
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
                    value={messageFilters.isUnread === undefined ? 'all' : messageFilters.isUnread ? 'unread' : 'read'} 
                    onValueChange={(value) => handleMessageFilterChange('isUnread', value === 'all' ? undefined : value === 'unread')}
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
                    value={messageFilters.messageType || 'all'} 
                    onValueChange={(value) => handleMessageFilterChange('messageType', value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="admin_to_client">To Site Managers</SelectItem>
                      <SelectItem value="admin_to_user">To Workers</SelectItem>
                      <SelectItem value="user_to_admin">From Workers</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Clear Filters */}
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Messages List */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Messages</CardTitle>
                <CardDescription>
                  {messages.length > 0 
                    ? `Showing ${messages.length} message${messages.length > 1 ? 's' : ''}`
                    : 'No messages found'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {messagesError ? (
                  <div className="text-center py-8">
                    <div className="text-destructive mb-2">Error loading messages</div>
                    <p className="text-sm text-muted-foreground mb-4">{messagesError}</p>
                    <Button onClick={handleRefresh} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : messagesLoading ? (
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
                      {searchTerm || Object.keys(messageFilters).length > 0
                        ? 'No messages match your current filters.'
                        : 'No personal communications have been sent or received yet.'
                      }
                    </p>
                    {(searchTerm || Object.keys(messageFilters).length > 0) && (
                      <Button variant="outline" onClick={handleClearFilters}>
                        Clear Filters
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* News Tab Content */}
          <TabsContent value="news" className="space-y-6">
            {/* News Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filter Company News</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search news and announcements..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10 font-mining-body"
                    />
                  </div>

                  {/* Assignment Filter */}
                  <Select 
                    value={newsFilters.assignedToMe === undefined ? 'all' : newsFilters.assignedToMe ? 'assigned' : 'not-assigned'} 
                    onValueChange={(value) => handleNewsFilterChange('assignedToMe', value === 'all' ? undefined : value === 'assigned')}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All News</SelectItem>
                      <SelectItem value="assigned">Assigned to Me</SelectItem>
                      <SelectItem value="not-assigned">Not Assigned</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Clear Filters */}
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* News List */}
            <Card>
              <CardHeader>
                <CardTitle>Company News & Announcements</CardTitle>
                <CardDescription>
                  {news.length > 0 
                    ? `Showing ${news.length} announcement${news.length > 1 ? 's' : ''}`
                    : 'No announcements found'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {newsError ? (
                  <div className="text-center py-8">
                    <div className="text-destructive mb-2">Error loading news</div>
                    <p className="text-sm text-muted-foreground mb-4">{newsError}</p>
                    <Button onClick={handleRefresh} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : newsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : news.length > 0 ? (
                  <div className="space-y-4">
                    {news.map((newsItem) => (
                      <NewsCard
                        key={newsItem.id}
                        news={newsItem}
                        onView={handleNewsView}
                        showAssignButton={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No announcements found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || Object.keys(newsFilters).length > 0
                        ? 'No announcements match your current filters.'
                        : 'No company announcements have been created yet.'
                      }
                    </p>
                    {(searchTerm || Object.keys(newsFilters).length > 0) && (
                      <Button variant="outline" onClick={handleClearFilters}>
                        Clear Filters
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Message Detail Modal */}
      <MessageDetailModal
        message={selectedMessage}
        isOpen={!!selectedMessage}
        onClose={() => setSelectedMessageId(null)}
        onReply={handleMessageReply}
        onDelete={handleMessageDelete}
      />

      {/* News Detail Modal */}
      <NewsDetailModal
        news={selectedNews}
        isOpen={!!selectedNews}
        onClose={() => setSelectedNewsId(null)}
        showAssignButton={true}
      />

      {/* Compose Message Modal */}
      <ComposeMessageModal
        isOpen={isComposeOpen}
        onClose={() => {
          setIsComposeOpen(false);
          setReplyToMessage(null);
        }}
        onSend={handleSendMessage}
        preselectedRecipient={replyToMessage ? {
          id: replyToMessage.sender_id,
          name: replyToMessage.sender_name,
          role: replyToMessage.sender_role
        } : undefined}
      />

      {/* Create News Modal */}
      <CreateNewsModal
        isOpen={isCreateNewsOpen}
        onClose={() => setIsCreateNewsOpen(false)}
        onSubmit={handleCreateNews}
        availableTargets={assignmentTargets}
        isLoading={newsLoading}
      />
    </DashboardLayout>
  );
};

export default AdminMessagesPage;