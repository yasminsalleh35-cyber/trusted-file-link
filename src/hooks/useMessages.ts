import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

/**
 * useMessages Hook
 * 
 * Purpose: Comprehensive message management for all user roles
 * Features:
 * - Fetch messages with real-time updates
 * - Send messages between users
 * - Mark messages as read
 * - Delete messages
 * - Filter and search messages
 * - Real-time subscriptions
 */

type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type MessageType = Database['public']['Enums']['message_type'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export interface EnhancedMessage extends Message {
  sender_name: string;
  sender_role: string;
  recipient_name: string;
  recipient_role: string;
  is_unread: boolean;
  formatted_time: string;
}

export interface MessageStats {
  totalMessages: number;
  unreadMessages: number;
  sentMessages: number;
  receivedMessages: number;
}

export interface MessageFilters {
  messageType?: MessageType;
  isUnread?: boolean;
  senderId?: string;
  recipientId?: string;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SendMessageData {
  recipientId: string;
  subject?: string;
  content: string;
  messageType: MessageType;
}

export const useMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [stats, setStats] = useState<MessageStats>({
    totalMessages: 0,
    unreadMessages: 0,
    sentMessages: 0,
    receivedMessages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MessageFilters>({});
  
  // Use ref to store latest fetchMessages function for real-time subscriptions
  const fetchMessagesRef = useRef<() => void>();

  // Helper function to format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? 's' : ''} ago`;
  };

  // Fetch messages with enhanced data
  const fetchMessages = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Build query based on filters
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(id, full_name, role),
          recipient:recipient_id(id, full_name, role)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.messageType) {
        query = query.eq('message_type', filters.messageType);
      }
      if (filters.isUnread !== undefined) {
        if (filters.isUnread) {
          query = query.is('read_at', null);
        } else {
          query = query.not('read_at', 'is', null);
        }
      }
      if (filters.senderId) {
        query = query.eq('sender_id', filters.senderId);
      }
      if (filters.recipientId) {
        query = query.eq('recipient_id', filters.recipientId);
      }
      if (filters.searchTerm) {
        query = query.or(`subject.ilike.%${filters.searchTerm}%,content.ilike.%${filters.searchTerm}%`);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform data to enhanced messages
      const enhancedMessages: EnhancedMessage[] = (data || []).map(msg => ({
        ...msg,
        sender_name: (msg.sender as any)?.full_name || 'Unknown User',
        sender_role: (msg.sender as any)?.role || 'unknown',
        recipient_name: (msg.recipient as any)?.full_name || 'Unknown User',
        recipient_role: (msg.recipient as any)?.role || 'unknown',
        is_unread: !msg.read_at && msg.recipient_id === user.id,
        formatted_time: formatRelativeTime(msg.created_at || '')
      }));

      setMessages(enhancedMessages);

      // Calculate stats
      const totalMessages = enhancedMessages.length;
      const unreadMessages = enhancedMessages.filter(m => m.is_unread).length;
      const sentMessages = enhancedMessages.filter(m => m.sender_id === user.id).length;
      const receivedMessages = enhancedMessages.filter(m => m.recipient_id === user.id).length;

      setStats({
        totalMessages,
        unreadMessages,
        sentMessages,
        receivedMessages
      });

    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  }, [user, filters]);

  // Update ref with latest fetchMessages
  fetchMessagesRef.current = fetchMessages;

  // Realtime subscription to messages table for the current user
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchMessagesRef.current?.();

    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user.id}`
      }, () => {
        fetchMessagesRef.current?.();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${user.id}`
      }, () => {
        fetchMessagesRef.current?.();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Optionally log
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [user]);

  // Send a new message
  const sendMessage = async (messageData: SendMessageData): Promise<{ success: boolean; error?: string; messageId?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Ensure we have an active Supabase session (required for RLS)
      let { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        sessionData = refreshed || null;
      }
      if (!sessionData?.session) {
        return { success: false, error: 'No active session. Please sign in again.' };
      }

      // Get the current user from Supabase auth (should exist if session is valid)
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) {
        return { success: false, error: 'Authentication failed: ' + (userError?.message || 'No authenticated user') };
      }

      // Verify sender exists in profiles table using the authenticated user ID
      const { data: senderProfile, error: senderError } = await supabase
        .from('profiles')
        .select('id, role, client_id')
        .eq('id', authUser.id)
        .single();
      if (senderError || !senderProfile) {
        return { success: false, error: 'Sender profile not found in database' };
      }

      // Verify recipient exists in profiles table and is allowed by messaging rules
      const { data: recipientProfile, error: recipientError } = await supabase
        .from('profiles')
        .select('id, role, client_id')
        .eq('id', messageData.recipientId)
        .single();
      if (recipientError || !recipientProfile) {
        return { success: false, error: 'Recipient profile not found in database' };
      }

      // Do not block on the front-end; rely on DB RLS for permissions
      // Keep minimal telemetry for debugging inconsistent role data
      const senderRole = String(senderProfile.role || '').toLowerCase();
      const recipientRole = String(recipientProfile.role || '').toLowerCase();
      const sameClient = Boolean(
        senderProfile.client_id && recipientProfile.client_id && senderProfile.client_id === recipientProfile.client_id
      );
      // NOTE: Previous role-pair validation removed to avoid false negatives (e.g., JWT vs Supabase role mismatch)

      const messageInsert: MessageInsert = {
        sender_id: authUser.id,
        recipient_id: messageData.recipientId,
        subject: messageData.subject || null,
        content: messageData.content,
        message_type: messageData.messageType
        // created_at handled by DB
      };

      const { data, error: sendError } = await supabase
        .from('messages')
        .insert(messageInsert)
        .select()
        .single();

      if (sendError) {
        // Surface common RLS error with clearer message
        if ((sendError as any).message?.includes('row-level security')) {
          return { success: false, error: 'Permission denied by security policy. Check roles and recipient.' };
        }
        throw sendError;
      }

      // Refresh messages to include the new one
      await fetchMessages();

      return { success: true, messageId: (data as any).id };
    } catch (error) {
      console.error('Error sending message:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      };
    }
  };

  // Send a message to all site users under the client's account (bulk insert)
  const sendToAllClientUsers = async (data: { subject?: string; content: string }): Promise<{ success: boolean; error?: string; sentCount?: number }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Ensure session
      let { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        sessionData = refreshed || null;
      }
      if (!sessionData?.session) {
        return { success: false, error: 'No active session. Please sign in again.' };
      }

      // Auth user
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) {
        return { success: false, error: 'Authentication failed: ' + (userError?.message || 'No authenticated user') };
      }

      // Sender profile (must be client)
      const { data: senderProfile, error: senderError } = await supabase
        .from('profiles')
        .select('id, role, client_id')
        .eq('id', authUser.id)
        .single();
      if (senderError || !senderProfile) {
        return { success: false, error: 'Sender profile not found in database' };
      }
      if (String(senderProfile.role).toLowerCase() !== 'client') {
        return { success: false, error: 'Only site managers can broadcast to all site users.' };
      }
      if (!senderProfile.client_id) {
        return { success: false, error: 'Your profile is missing client_id. Cannot determine site users.' };
      }

      // Fetch all users under same client
      const { data: recipients, error: recipientsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'user')
        .eq('client_id', senderProfile.client_id);
      if (recipientsError) {
        return { success: false, error: recipientsError.message };
      }

      const recipientIds = (recipients || []).map(r => r.id).filter(Boolean);
      if (recipientIds.length === 0) {
        return { success: false, error: 'No site users found to message.' };
      }

      // Build bulk messages
      const inserts: MessageInsert[] = recipientIds.map((rid) => ({
        sender_id: authUser.id,
        recipient_id: rid,
        subject: data.subject || null,
        content: data.content,
        message_type: 'client_to_user' as MessageType
      }));

      const { error: bulkError } = await supabase
        .from('messages')
        .insert(inserts);
      if (bulkError) {
        if ((bulkError as any).message?.includes('row-level security')) {
          return { success: false, error: 'Permission denied by security policy. Check roles and site membership.' };
        }
        return { success: false, error: bulkError.message };
      }

      await fetchMessages();
      return { success: true, sentCount: inserts.length };
    } catch (error) {
      console.error('Error broadcasting message:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to broadcast message' };
    }
  };

  // Mark message as read
  const markAsRead = async (messageId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('recipient_id', user.id); // Only allow marking own messages as read

      if (updateError) throw updateError;

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, read_at: new Date().toISOString(), is_unread: false }
          : msg
      ));

      // Update stats
      setStats(prev => ({
        ...prev,
        unreadMessages: Math.max(0, prev.unreadMessages - 1)
      }));

      return { success: true };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to mark message as read' 
      };
    }
  };

  // Mark multiple messages as read
  const markMultipleAsRead = async (messageIds: string[]): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', messageIds)
        .eq('recipient_id', user.id);

      if (updateError) throw updateError;

      // Refresh messages
      await fetchMessages();

      return { success: true };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to mark messages as read' 
      };
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Only allow deleting messages where user is sender or recipient
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);

      if (deleteError) throw deleteError;

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));

      // Update stats
      setStats(prev => {
        const deletedMessage = messages.find(m => m.id === messageId);
        if (!deletedMessage) return prev;

        return {
          totalMessages: prev.totalMessages - 1,
          unreadMessages: deletedMessage.is_unread ? prev.unreadMessages - 1 : prev.unreadMessages,
          sentMessages: deletedMessage.sender_id === user.id ? prev.sentMessages - 1 : prev.sentMessages,
          receivedMessages: deletedMessage.recipient_id === user.id ? prev.receivedMessages - 1 : prev.receivedMessages
        };
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete message' 
      };
    }
  };

  // Get message by ID
  const getMessageById = (messageId: string): EnhancedMessage | undefined => {
    return messages.find(msg => msg.id === messageId);
  };

  // Update filters
  const updateFilters = (newFilters: Partial<MessageFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
  };

  // Refresh messages
  const refreshMessages = () => {
    fetchMessages();
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchMessages();

    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},recipient_id.eq.${user.id})`
        },
        () => {
          // Refresh messages when changes occur
          fetchMessagesRef.current?.();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Separate effect for filter changes
  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [filters]);

  return {
    // Data
    messages,
    stats,
    filters,
    isLoading,
    error,
    
    // Actions
    sendMessage,
    sendToAllClientUsers,
    markAsRead,
    markMultipleAsRead,
    deleteMessage,
    refreshMessages,
    
    // Utilities
    getMessageById,
    updateFilters,
    clearFilters
  };
};