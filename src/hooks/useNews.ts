import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

/**
 * useNews Hook
 * 
 * Purpose: Comprehensive news and announcements management for mining operations
 * Features:
 * - Fetch news with assignment-based filtering
 * - Create and manage company announcements
 * - Assignment system for targeted distribution
 * - Real-time updates for news and assignments
 * - Role-based access control
 */

type News = Database['public']['Tables']['news']['Row'];
type NewsInsert = Database['public']['Tables']['news']['Insert'];
type NewsAssignment = Database['public']['Tables']['news_assignments']['Row'];
type NewsAssignmentInsert = Database['public']['Tables']['news_assignments']['Insert'];
type NewsAssignmentDetailed = Database['public']['Views']['news_assignments_detailed']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

export interface EnhancedNews extends News {
  created_by_name: string;
  created_by_role: string;
  assignment_count: number;
  is_assigned_to_me: boolean;
  assigned_at?: string;
  formatted_time: string;
}

export interface NewsStats {
  totalNews: number;
  myAssignedNews: number;
  unreadNews: number;
  createdByMe: number;
}

export interface NewsFilters {
  assignedToMe?: boolean;
  createdByMe?: boolean;
  clientId?: string;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AssignmentTarget {
  type: 'user' | 'client' | 'broadcast';
  id?: string;
  name: string;
  role?: string;
}

export const useNews = () => {
  const { user } = useAuth();
  const [news, setNews] = useState<EnhancedNews[]>([]);
  const [stats, setStats] = useState<NewsStats>({
    totalNews: 0,
    myAssignedNews: 0,
    unreadNews: 0,
    createdByMe: 0
  });
  const [filters, setFilters] = useState<NewsFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to store latest fetchNews function for real-time subscriptions
  const fetchNewsRef = useRef<() => void>();

  // Helper function to format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? 's' : ''} ago`;
  };

  // Fetch news with assignments
  const fetchNews = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Build query based on user role and filters
      let query = supabase
        .from('news_assignments_detailed')
        .select('*')
        .order('assigned_at', { ascending: false });

      // Apply role-based filtering
      if (user.role === 'user') {
        // Users only see news assigned to them or their client
        query = query.or(`assigned_to_user.eq.${user.id},assigned_to_client.eq.${user.client_id || 'null'}`);
      } else if (user.role === 'client') {
        // Clients see news assigned to them or their users
        query = query.or(`assigned_to_client.eq.${user.client_id || user.id},assigned_to_user.in.(${await getUsersInClient(user.client_id || user.id)})`);
      }
      // Admins see all news (no additional filtering)

      // Apply user filters
      if (filters.assignedToMe && user.role !== 'admin') {
        if (user.role === 'user') {
          query = query.eq('assigned_to_user', user.id);
        } else if (user.role === 'client') {
          query = query.eq('assigned_to_client', user.client_id || user.id);
        }
      }

      if (filters.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,content.ilike.%${filters.searchTerm}%`);
      }

      if (filters.dateFrom) {
        query = query.gte('assigned_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('assigned_at', filters.dateTo);
      }

      const { data: newsData, error: newsError } = await query;

      if (newsError) throw newsError;

      // Transform data to EnhancedNews format
      const enhancedNews: EnhancedNews[] = [];
      const newsMap = new Map<string, EnhancedNews>();

      newsData?.forEach((item) => {
        if (!item.news_id) return;

        const newsId = item.news_id;
        
        if (!newsMap.has(newsId)) {
          newsMap.set(newsId, {
            id: newsId,
            title: item.title || '',
            content: item.content || '',
            created_by: item.assigned_by_name || '',
            created_at: item.assigned_at,
            updated_at: item.assigned_at,
            created_by_name: item.assigned_by_name || 'Unknown',
            created_by_role: 'admin', // Most news created by admins
            assignment_count: 0,
            is_assigned_to_me: false,
            formatted_time: formatRelativeTime(item.assigned_at || new Date().toISOString())
          });
        }

        const newsItem = newsMap.get(newsId)!;
        newsItem.assignment_count += 1;

        // Check if assigned to current user
        if (
          (user.role === 'user' && item.assigned_to_user === user.id) ||
          (user.role === 'client' && item.assigned_to_client === (user.client_id || user.id)) ||
          (user.role === 'admin')
        ) {
          newsItem.is_assigned_to_me = true;
          if (item.assigned_at) {
            newsItem.assigned_at = item.assigned_at;
          }
        }
      });

      const newsArray = Array.from(newsMap.values());
      setNews(newsArray);

      // Calculate stats
      const newStats: NewsStats = {
        totalNews: newsArray.length,
        myAssignedNews: newsArray.filter(n => n.is_assigned_to_me).length,
        unreadNews: newsArray.filter(n => n.is_assigned_to_me).length, // TODO: Implement read tracking
        createdByMe: user.role === 'admin' ? newsArray.length : 0
      };
      setStats(newStats);

    } catch (error) {
      console.error('Error fetching news:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch news');
    } finally {
      setIsLoading(false);
    }
  }, [user, filters]);

  // Update ref with latest fetchNews
  fetchNewsRef.current = fetchNews;

  // Helper function to get users in a client
  const getUsersInClient = async (clientId: string): Promise<string> => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('client_id', clientId);
      
      return data?.map(p => p.id).join(',') || '';
    } catch {
      return '';
    }
  };

  // Create news (admin only)
  const createNews = async (newsData: {
    title: string;
    content: string;
  }) => {
    try {
      if (!user || user.role !== 'admin') {
        throw new Error('Only administrators can create news');
      }

      const { data, error } = await supabase
        .from('news')
        .insert({
          title: newsData.title,
          content: newsData.content,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating news:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create news'
      };
    }
  };

  // Assign news to targets
  const assignNews = async (newsId: string, targets: AssignmentTarget[]) => {
    try {
      if (!user || user.role !== 'admin') {
        throw new Error('Only administrators can assign news');
      }

      const assignments: NewsAssignmentInsert[] = [];

      for (const target of targets) {
        if (target.type === 'broadcast') {
          // Broadcast to everyone - create assignment with no specific target
          assignments.push({
            news_id: newsId,
            assigned_by: user.id,
            assigned_to_client: null,
            assigned_to_user: null
          });
        } else if (target.type === 'client' && target.id) {
          assignments.push({
            news_id: newsId,
            assigned_by: user.id,
            assigned_to_client: target.id,
            assigned_to_user: null
          });
        } else if (target.type === 'user' && target.id) {
          assignments.push({
            news_id: newsId,
            assigned_by: user.id,
            assigned_to_client: null,
            assigned_to_user: target.id
          });
        }
      }

      const { error } = await supabase
        .from('news_assignments')
        .insert(assignments);

      if (error) throw error;

      // Refresh news data
      await fetchNews();

      return { success: true };
    } catch (error) {
      console.error('Error assigning news:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign news'
      };
    }
  };

  // Create and assign news in one operation
  const createAndAssignNews = async (
    newsData: { title: string; content: string },
    targets: AssignmentTarget[]
  ) => {
    try {
      const createResult = await createNews(newsData);
      if (!createResult.success || !createResult.data) {
        return createResult;
      }

      const assignResult = await assignNews(createResult.data.id, targets);
      if (!assignResult.success) {
        return assignResult;
      }

      return { success: true, data: createResult.data };
    } catch (error) {
      console.error('Error creating and assigning news:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create and assign news'
      };
    }
  };

  // Get available assignment targets
  const getAssignmentTargets = useCallback(async (): Promise<AssignmentTarget[]> => {
    try {
      if (!user || user.role !== 'admin') {
        return [];
      }

      const targets: AssignmentTarget[] = [
        { type: 'broadcast', name: 'Everyone (Broadcast)', role: 'all' }
      ];

      // Get all clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, company_name')
        .order('company_name');

      clients?.forEach(client => {
        targets.push({
          type: 'client',
          id: client.id,
          name: client.company_name,
          role: 'client'
        });
      });

      // Get all users
      const { data: users } = await supabase
        .from('user_profiles_with_clients')
        .select('id, full_name, role, company_name')
        .order('full_name');

      users?.forEach(user => {
        targets.push({
          type: 'user',
          id: user.id || '',
          name: `${user.full_name} (${user.company_name || 'No Company'})`,
          role: user.role || 'user'
        });
      });

      return targets;
    } catch (error) {
      console.error('Error fetching assignment targets:', error);
      return [];
    }
  }, [user]);

  // Update filters
  const updateFilters = (newFilters: Partial<NewsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
  };

  // Refresh news
  const refreshNews = () => {
    fetchNews();
  };

  // Get news by ID
  const getNewsById = (newsId: string): EnhancedNews | null => {
    return news.find(n => n.id === newsId) || null;
  };

  // Initialize and set up real-time subscriptions
  useEffect(() => {
    if (user) {
      // Initial fetch
      fetchNews();

      // Set up real-time subscription for news
      const newsSubscription = supabase
        .channel('news_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => {
          fetchNewsRef.current?.();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'news_assignments' }, () => {
          fetchNewsRef.current?.();
        })
        .subscribe();

      return () => {
        newsSubscription.unsubscribe();
      };
    }
  }, [user]);

  // Separate effect for filter changes
  useEffect(() => {
    if (user) {
      fetchNews();
    }
  }, [filters]);

  return {
    news,
    stats,
    filters,
    isLoading,
    error,
    createNews,
    assignNews,
    createAndAssignNews,
    getAssignmentTargets,
    updateFilters,
    clearFilters,
    refreshNews,
    getNewsById
  };
};