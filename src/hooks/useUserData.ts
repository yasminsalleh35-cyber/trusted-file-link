import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFileManagement } from '@/hooks/useFileManagement';
import { useMessages } from '@/hooks/useMessages';
import type { Database } from '@/integrations/supabase/types';

/**
 * useUserData Hook
 * 
 * Purpose: Fetch and manage user-specific data
 * Features:
 * - User profile information
 * - Assigned files (placeholder for future implementation)
 * - Messages from admin and client
 * - Activity tracking
 * - Real-time updates
 */

type Profile = Database['public']['Tables']['profiles']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

export interface UserStats {
  assignedFilesCount: number;
  unreadMessagesCount: number;
  lastActivityTime: string;
}

export interface AssignedFile {
  id: string;
  name: string;
  size: string;
  assignedAt: string;
  status: 'new' | 'viewed' | 'downloaded';
  assignedBy: string;
  assignedByRole: string;
}

export interface UserMessage {
  id: string;
  from: string;
  fromRole: string;
  subject: string;
  content?: string;
  time: string;
  unread: boolean;
}

export interface UserData {
  profile: Profile | null;
  client: Client | null;
  stats: UserStats;
  recentFiles: AssignedFile[];
  recentMessages: UserMessage[];
  isLoading: boolean;
  error: string | null;
  // File management functions
  managedFiles?: any[];
  downloadFile?: (file: any) => Promise<void>;
  previewFile?: (file: any) => Promise<string>;
}

export const useUserData = () => {
  const { user } = useAuth();
  const { files: managedFiles, downloadFile: downloadManagedFile, previewFile: previewManagedFile } = useFileManagement();
  const { messages, stats: messageStats, markAsRead } = useMessages();
  
  // Helper functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? 's' : ''} ago`;
  };

  const [userData, setUserData] = useState<UserData>({
    profile: null,
    client: null,
    stats: {
      assignedFilesCount: 0,
      unreadMessagesCount: 0,
      lastActivityTime: 'Never'
    },
    recentFiles: [],
    recentMessages: [],
    isLoading: true,
    error: null
  });

  // Fetch user data
  const fetchUserData = async () => {
    if (!user || user.role !== 'user') {
      setUserData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Invalid user or insufficient permissions'
      }));
      return;
    }

    try {
      setUserData(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch client information if user has a client_id
      let clientData = null;
      if (profile.client_id) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', profile.client_id)
          .single();

        if (clientError) {
          console.warn('Could not fetch client data:', clientError);
        } else {
          clientData = client;
        }
      }

      // Transform managed files to user files format
      const userFiles: AssignedFile[] = managedFiles.map(file => ({
        id: file.id,
        name: file.original_name,
        size: formatFileSize(file.file_size),
        assignedAt: formatRelativeTime(file.created_at),
        status: 'new' as const, // TODO: Implement real status tracking
        assignedBy: file.uploaded_by_name || 'Unknown',
        assignedByRole: file.uploaded_by_role || 'unknown'
      }));

      // Transform real messages to UserMessage format
      const recentMessages: UserMessage[] = messages.slice(0, 5).map(msg => ({
        id: msg.id,
        from: msg.sender_name,
        fromRole: msg.sender_role,
        subject: msg.subject || 'No subject',
        content: msg.content,
        time: msg.formatted_time,
        unread: msg.is_unread
      }));

      // Calculate stats
      const stats: UserStats = {
        assignedFilesCount: userFiles.length,
        unreadMessagesCount: messageStats.unreadMessages,
        lastActivityTime: '2 hours ago' // TODO: Implement real activity tracking
      };

      setUserData({
        profile,
        client: clientData,
        stats,
        recentFiles: userFiles,
        recentMessages,
        isLoading: false,
        error: null,
        managedFiles,
        downloadFile: downloadManagedFile,
        previewFile: previewManagedFile
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user data'
      }));
    }
  };

  // Mark message as read (now uses real messaging system)
  const markMessageAsRead = async (messageId: string) => {
    try {
      const result = await markAsRead(messageId);
      if (result.success) {
        // Refresh user data to reflect changes
        await fetchUserData();
      }
      return result;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  };

  // Mark file as viewed
  const markFileAsViewed = async (fileId: string) => {
    try {
      // TODO: Implement when files table is available
      console.log('Marking file as viewed:', fileId);
      
      // Update local state for now
      setUserData(prev => ({
        ...prev,
        recentFiles: prev.recentFiles.map(file =>
          file.id === fileId && file.status === 'new' 
            ? { ...file, status: 'viewed' as const } 
            : file
        )
      }));

      return { success: true };
    } catch (error) {
      console.error('Error marking file as viewed:', error);
      throw error;
    }
  };

  // Mark file as downloaded
  const markFileAsDownloaded = async (fileId: string) => {
    try {
      // TODO: Implement when files table is available
      console.log('Marking file as downloaded:', fileId);
      
      // Update local state for now
      setUserData(prev => ({
        ...prev,
        recentFiles: prev.recentFiles.map(file =>
          file.id === fileId 
            ? { ...file, status: 'downloaded' as const } 
            : file
        )
      }));

      return { success: true };
    } catch (error) {
      console.error('Error marking file as downloaded:', error);
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (updates: {
    full_name?: string;
    email?: string;
  }) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh data
      await fetchUserData();
      
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Refresh data
  const refreshData = () => {
    fetchUserData();
  };

  // Initialize data fetching
  useEffect(() => {
    if (user && user.role === 'user') {
      fetchUserData();
    }
  }, [user]);

  return {
    ...userData,
    refreshData,
    markMessageAsRead,
    markFileAsViewed,
    markFileAsDownloaded,
    updateProfile
  };
};