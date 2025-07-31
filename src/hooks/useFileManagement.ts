import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';
import { 
  mapDatabaseFilesToApp, 
  safeFileAccess, 
  getFileDisplayName, 
  getFileType, 
  getStoragePath,
  type AppFile 
} from '@/utils/fileSchemaAdapter';
import { 
  safeAsync, 
  withRetry, 
  FileOperationError, 
  NetworkError,
  errorLogger 
} from '@/utils/errorHandler';
import { 
  useCachedFileOperations, 
  performanceTimer,
  BatchProcessor 
} from '@/utils/performance';

/**
 * useFileManagement Hook
 * 
 * Purpose: Manage files, assignments, and access control
 * Features:
 * - File listing and filtering
 * - File assignments to users/clients
 * - File access tracking
 * - File deletion and management
 * - Download URL generation
 */

type FileRow = Database['public']['Tables']['files']['Row'];
type FileAssignmentRow = Database['public']['Tables']['file_assignments']['Row'];

// Use the standardized AppFile interface
export interface ManagedFile extends AppFile {
  uploaded_by_name?: string;
  uploaded_by_role?: string;
  assignment_count?: number;
  last_accessed?: string;
  access_count?: number;
}

export interface FileAssignment extends FileAssignmentRow {
  file?: ManagedFile;
  assigned_to_name?: string;
  assigned_to_email?: string;
  assigned_to_client_name?: string;
  assigned_by_name?: string;
}

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  recentUploads: number;
  activeAssignments: number;
}

export const useFileManagement = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [assignments, setAssignments] = useState<FileAssignment[]>([]);
  const [stats, setStats] = useState<FileStats>({
    totalFiles: 0,
    totalSize: 0,
    recentUploads: 0,
    activeAssignments: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Performance optimizations
  const { 
    getCachedFile, 
    setCachedFile, 
    getCachedDownloadUrl, 
    setCachedDownloadUrl,
    clearFileCache 
  } = useCachedFileOperations();

  // Fetch files based on user role
  const fetchFiles = async () => {
    if (!user) return;

    await safeAsync(
      async () => {
        setIsLoading(true);
        setError(null);

      let filesData: any[] = [];

      if (user.role === 'admin') {
        // Admins can see all files
        const { data, error } = await supabase
          .from('files')
          .select(`
            *,
            profiles:uploaded_by (
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        filesData = data || [];
        
      } else {
        // For clients and users, we need to get files through assignments
        let assignmentQuery = supabase
          .from('file_assignments')
          .select(`
            *,
            files (
              *,
              profiles:uploaded_by (
                full_name,
                email
              )
            )
          `);

        if (user.role === 'client') {
          console.log('🔍 CLIENT DEBUG:');
          console.log('  - User ID:', user.id);
          console.log('  - User Email:', user.email);
          console.log('  - Client ID:', user.client_id);
          console.log('  - User Role:', user.role);
          
          // Client admins can see:
          // 1. Files assigned directly to them (assigned_to_user)
          // 2. Files assigned to their client (assigned_to_client) - only if they have a client_id
          if (user.client_id) {
            assignmentQuery = assignmentQuery.or(`assigned_to_user.eq.${user.id},assigned_to_client.eq.${user.client_id}`);
          } else {
            assignmentQuery = assignmentQuery.eq('assigned_to_user', user.id);
          }
        } else if (user.role === 'user') {
          console.log('🔍 USER DEBUG:');
          console.log('  - User ID:', user.id);
          console.log('  - User Email:', user.email);
          console.log('  - Client ID:', user.client_id);
          console.log('  - User Role:', user.role);
          
          // Regular users can see:
          // 1. Files assigned directly to them (assigned_to_user)
          // 2. Files assigned to their client (assigned_to_client) - only if they have a client_id
          if (user.client_id) {
            assignmentQuery = assignmentQuery.or(`assigned_to_user.eq.${user.id},assigned_to_client.eq.${user.client_id}`);
          } else {
            assignmentQuery = assignmentQuery.eq('assigned_to_user', user.id);
          }
        }

        console.log('🔍 About to execute assignment query...');
        const { data: assignments, error: assignmentError } = await assignmentQuery;
        
        if (assignmentError) {
          console.error('🚨 Assignment query error:', assignmentError);
          throw assignmentError;
        }
        
        console.log('🔍 Raw assignments from database:', assignments);
        console.log('🔍 Number of assignments found:', assignments?.length || 0);

        // Extract files from assignments and remove duplicates
        const fileMap = new Map();
        console.log('🔍 Processing assignments...');
        assignments?.forEach((assignment, index) => {
          console.log(`🔍 Assignment ${index + 1}:`, {
            id: assignment.id,
            assigned_to_user: assignment.assigned_to_user,
            assigned_to_client: assignment.assigned_to_client,
            has_files: !!assignment.files,
            file_name: assignment.files?.original_filename
          });
          
          if (assignment.files) {
            fileMap.set(assignment.files.id, assignment.files);
          }
        });
        
        filesData = Array.from(fileMap.values());
        console.log('🔍 Final files after processing:', filesData.length, 'files');
        console.log('🔍 File names:', filesData.map(f => f.original_filename));

        // Also include files uploaded by the user (for clients)
        if (user.role === 'client') {
          const { data: ownFiles, error: ownFilesError } = await supabase
            .from('files')
            .select(`
              *,
              profiles:uploaded_by (
                full_name,
                email
              )
            `)
            .eq('uploaded_by', user.id);
          
          if (ownFilesError) throw ownFilesError;
          
          // Merge own files with assigned files (avoid duplicates)
          ownFiles?.forEach(file => {
            if (!fileMap.has(file.id)) {
              filesData.push(file);
            }
          });
        }
      }

      // Transform data with basic info using the adapter
      const transformedFiles: ManagedFile[] = filesData?.map(file => {
        const adaptedFile = safeFileAccess(file);
        return {
          ...adaptedFile,
          uploaded_by_name: file.profiles?.full_name || file.profiles?.email || 'Unknown User',
          uploaded_by_role: 'unknown',
          assignment_count: 0, // We'll calculate this separately
          access_count: 0,
          last_accessed: null
        };
      }) || [];

      setFiles(transformedFiles);

      // Calculate stats
      const totalFiles = transformedFiles.length;
      const totalSize = transformedFiles.reduce((sum, file) => sum + (file.file_size || 0), 0);
      const recentUploads = transformedFiles.filter(file => {
        const uploadDate = new Date(file.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return uploadDate > weekAgo;
      }).length;

        setStats({
          totalFiles,
          totalSize,
          recentUploads,
          activeAssignments: 0 // Will be calculated when assignments are fetched
        });
      },
      'fetchFiles',
      { 
        showToast: true, 
        retries: 2, 
        userId: user.id 
      }
    );

    setIsLoading(false);
  };

  // Fetch file assignments
  const fetchAssignments = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('file_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (user.role === 'client') {
        if (user.client_id) {
          query = query.or(`assigned_to_client.eq.${user.client_id},assigned_by.eq.${user.id}`);
        } else {
          query = query.eq('assigned_by', user.id);
        }
      } else if (user.role === 'user') {
        if (user.client_id) {
          query = query.or(`assigned_to_user.eq.${user.id},assigned_to_client.eq.${user.client_id}`);
        } else {
          query = query.eq('assigned_to_user', user.id);
        }
      }

      const { data: assignmentsData, error: assignmentsError } = await query;

      if (assignmentsError) throw assignmentsError;

      const transformedAssignments: FileAssignment[] = assignmentsData?.map(assignment => ({
        ...assignment,
        assigned_to_name: 'User', // We'll fetch this separately if needed
        assigned_to_email: null,
        assigned_to_client_name: 'Client',
        assigned_by_name: 'Admin'
      })) || [];

      setAssignments(transformedAssignments);

      // Update stats with active assignments count
      setStats(prev => ({
        ...prev,
        activeAssignments: transformedAssignments.length
      }));

    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  // Assign file to user or client
  const assignFile = async (
    fileId: string,
    assignment: {
      assignedTo?: string; // user ID
      assignedToClient?: string; // client ID
      assignmentType: 'user' | 'client';
      notes?: string;
      expiresAt?: string;
    }
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('file_assignments')
        .insert({
          file_id: fileId,
          assigned_to_user: assignment.assignedTo || null,
          assigned_to_client: assignment.assignedToClient || null,
          assigned_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh assignments
      await fetchAssignments();

      return data;
    } catch (error) {
      console.error('Error assigning file:', error);
      throw error;
    }
  };

  // Remove file assignment
  const removeAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('file_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      // Refresh assignments
      await fetchAssignments();
    } catch (error) {
      console.error('Error removing assignment:', error);
      throw error;
    }
  };

  // Delete file
  const deleteFile = async (fileId: string) => {
    console.log('🗑️ DELETE DEBUG: Starting file deletion for ID:', fileId);
    
    if (!user) {
      console.error('🗑️ DELETE ERROR: User not authenticated');
      throw new Error('User not authenticated');
    }

    try {
      console.log('🗑️ DELETE DEBUG: Fetching file info...');
      // Get file info first
      const { data: fileData, error: fetchError } = await supabase
        .from('files')
        .select('storage_path')
        .eq('id', fileId)
        .single();

      if (fetchError) {
        console.error('🗑️ DELETE ERROR: Failed to fetch file info:', fetchError);
        throw fetchError;
      }

      console.log('🗑️ DELETE DEBUG: File data:', fileData);

      console.log('🗑️ DELETE DEBUG: Deleting from storage...');
      // Delete from storage using adapter for safe path access
      const storagePath = getStoragePath(fileData);
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([storagePath]);

      if (storageError) {
        console.warn('🗑️ DELETE WARNING: Storage deletion failed:', storageError);
        // Continue with database deletion even if storage fails
      } else {
        console.log('🗑️ DELETE DEBUG: Storage deletion successful');
      }

      console.log('🗑️ DELETE DEBUG: Deleting from database...');
      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('🗑️ DELETE ERROR: Database deletion failed:', dbError);
        throw dbError;
      }

      console.log('🗑️ DELETE DEBUG: Database deletion successful');
      console.log('🗑️ DELETE DEBUG: Refreshing files list...');
      
      // Refresh files
      await fetchFiles();
      
      console.log('🗑️ DELETE SUCCESS: File deleted successfully');
    } catch (error) {
      console.error('🗑️ DELETE ERROR: Error deleting file:', error);
      throw error;
    }
  };

  // Generate download URL
  const getDownloadUrl = async (filePath: string): Promise<string> => {
    return await performanceTimer.measureAsync('getDownloadUrl', async () => {
      // Check cache first
      const cachedUrl = getCachedDownloadUrl(filePath);
      if (cachedUrl) {
        return cachedUrl;
      }

      try {
        const { data, error } = await supabase.storage
          .from('files')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (error) throw error;
        if (!data?.signedUrl) throw new Error('No signed URL returned');

        // Cache the URL (expires in 50 minutes to be safe)
        setCachedDownloadUrl(filePath, data.signedUrl, 50 * 60 * 1000);

        return data.signedUrl;
      } catch (error) {
        console.error('Error generating download URL:', error);
        throw error;
      }
    });
  };

  // Log file access
  const logFileAccess = async (
    fileId: string, 
    accessType: 'view' | 'download' | 'preview'
  ) => {
    try {
      await supabase
        .from('file_access_logs')
        .insert({
          file_id: fileId,
          user_id: user?.id,
          access_type: accessType,
          accessed_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging file access:', error);
      // Don't throw error as this is not critical
    }
  };

  // Download file
  const downloadFile = async (file: ManagedFile) => {
    await safeAsync(
      async () => {
        // Log access
        await logFileAccess(file.id, 'download');

        // Get download URL using adapter for safe path access
        const storagePath = getStoragePath(file);
        const downloadUrl = await withRetry(() => getDownloadUrl(storagePath), 3);

        // Trigger download using adapter for safe filename access
        const filename = getFileDisplayName(file);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      'downloadFile',
      { 
        showToast: true, 
        retries: 2, 
        userId: user?.id 
      }
    );
  };

  // Preview file (for supported types)
  const previewFile = async (file: ManagedFile): Promise<string> => {
    try {
      // Log access
      await logFileAccess(file.id, 'preview');

      // Get preview URL using adapter for safe path access
      const storagePath = getStoragePath(file);
      return await getDownloadUrl(storagePath);
    } catch (error) {
      console.error('Error previewing file:', error);
      throw error;
    }
  };

  // Refresh all data
  const refreshData = async () => {
    await Promise.all([fetchFiles(), fetchAssignments()]);
  };

  // Initialize data fetching
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  return {
    files,
    assignments,
    stats,
    isLoading,
    error,
    assignFile,
    removeAssignment,
    deleteFile,
    downloadFile,
    previewFile,
    refreshData,
    logFileAccess
  };
};