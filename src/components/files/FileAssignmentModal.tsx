import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  AlertCircle, 
  Users, 
  User, 
  CheckCircle, 
  Clock, 
  FileText,
  History,
  Trash2,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { ManagedFile } from '@/hooks/useFileManagement';

/**
 * Enhanced FileAssignmentModal Component
 * 
 * Purpose: Modal for assigning files to users or clients with advanced features
 * Features:
 * - Single and bulk file assignment
 * - User/client selection
 * - Assignment type selection
 * - Notes and expiry date
 * - Assignment history viewing
 * - Form validation
 */

interface Assignment {
  id: string;
  file_id: string;
  assigned_to_user?: string;
  assigned_to_client?: string;
  assigned_by: string;
  created_at: string;
  // Joined data
  user_profile?: {
    full_name: string;
    email: string;
  };
  client_profile?: {
    company_name: string;
  };
  assigned_by_profile?: {
    full_name: string;
    email: string;
  };
}

interface FileAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: (ManagedFile & { bulkSelection?: string[] }) | null;
  onAssign: (fileId: string, assignment: {
    assignedTo?: string;
    assignedToClient?: string;
    assignmentType: 'user' | 'client' | 'all_users_in_client';
  }) => Promise<void>;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  client_id?: string;
}

interface Client {
  id: string;
  company_name: string;
}

export const FileAssignmentModal: React.FC<FileAssignmentModalProps> = ({
  isOpen,
  onClose,
  file,
  onAssign
}) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('assign');

  const [formData, setFormData] = useState({
    assignmentType: 'user' as 'user' | 'client' | 'all_users_in_client',
    assignedTo: '',
    assignedToClient: ''
  });

  // Fetch users, clients, and assignment history
  const fetchData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch users
      let usersQuery = supabase
        .from('profiles')
        .select('id, full_name, email, role, client_id')
        .neq('id', user.id); // Exclude current user

      // If current user is client, only show users from their client
      if (user.role === 'client') {
        usersQuery = usersQuery.eq('client_id', user.client_id);
      }

      const { data: usersData, error: usersError } = await usersQuery;
      if (usersError) throw usersError;

      setUsers(usersData || []);

      // Fetch clients (only for admins)
      if (user.role === 'admin') {
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, company_name')
          .order('company_name');

        if (clientsError) throw clientsError;
        setClients(clientsData || []);
      }

      // Fetch assignment history for the file
      if (file && !file.bulkSelection) {
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('file_assignments')
          .select(`
            id,
            file_id,
            assigned_to_user,
            assigned_to_client,
            assigned_by,
            created_at,
            user_profile:assigned_to_user(full_name, email),
            client_profile:assigned_to_client(company_name),
            assigned_by_profile:assigned_by(full_name, email)
          `)
          .eq('file_id', file.id)
          .order('created_at', { ascending: false });

        if (assignmentsError) throw assignmentsError;
        setAssignments(assignmentsData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        assignmentType: 'user',
        assignedTo: '',
        assignedToClient: ''
      });
      setError(null);
      fetchData();
    }
  }, [isOpen]);

  // Handle form submission (single or bulk)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError(null);

    // Validation
    if (formData.assignmentType === 'user' && !formData.assignedTo) {
      setError('Please select a user');
      return;
    }

    if (formData.assignmentType === 'client' && !formData.assignedToClient) {
      setError('Please select a client');
      return;
    }

    setIsSubmitting(true);

    try {
      const assignmentData = {
        assignedTo: formData.assignmentType === 'user' ? formData.assignedTo : undefined,
        assignedToClient: formData.assignmentType === 'client' ? formData.assignedToClient : undefined,
        assignmentType: formData.assignmentType
      };

      // Handle bulk assignment
      if (file.bulkSelection && file.bulkSelection.length > 0) {
        for (const fileId of file.bulkSelection) {
          await onAssign(fileId, assignmentData);
        }
        
        toast.success('Bulk assignment completed!', {
          description: `${file.bulkSelection.length} files have been assigned.`
        });
      } else {
        // Single file assignment
        await onAssign(file.id, assignmentData);
        
        toast.success('File assigned successfully!', {
          description: `File "${file.original_filename}" has been assigned.`
        });
      }

      onClose();
    } catch (error) {
      console.error('Error assigning file:', error);
      setError(error instanceof Error ? error.message : 'Failed to assign file');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Filter users based on assignment type
  const getFilteredUsers = () => {
    if (formData.assignmentType === 'user') {
      return users.filter(u => u.role === 'user');
    }
    return users;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  // Check if this is a bulk assignment
  const isBulkAssignment = file?.bulkSelection && file.bulkSelection.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isBulkAssignment ? 'Bulk Assign Files' : 'Assign File'}
          </DialogTitle>
          <DialogDescription>
            {isBulkAssignment 
              ? `Assign ${file?.bulkSelection?.length} selected files to users or clients`
              : `Assign "${file?.original_filename}" to users or clients`
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assign">
              <FileText className="mr-2 h-4 w-4" />
              {isBulkAssignment ? 'Bulk Assign' : 'Assign'}
            </TabsTrigger>
            <TabsTrigger value="history" disabled={isBulkAssignment}>
              <History className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assign" className="space-y-4 mt-4">

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Bulk Assignment Info */}
              {isBulkAssignment && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Bulk Assignment: {file?.bulkSelection?.length} files selected
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      This assignment will be applied to all selected files
                    </p>
                  </CardContent>
                </Card>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

          {/* Assignment Type */}
          <div className="space-y-2">
            <Label htmlFor="assignmentType">Assignment Type</Label>
            <Select
              value={formData.assignmentType}
              onValueChange={(value: 'user' | 'client') => 
                setFormData(prev => ({ 
                  ...prev, 
                  assignmentType: value,
                  assignedTo: '',
                  assignedToClient: ''
                }))
              }
              disabled={isLoading || isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Specific User
                  </div>
                </SelectItem>
                {user?.role === 'admin' && (
                  <>
                    <SelectItem value="client">
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        Entire Client (All Users)
                      </div>
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* User Selection */}
          {formData.assignmentType === 'user' && (
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Select User</Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}
                disabled={isLoading || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredUsers().map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Client Selection */}
          {(formData.assignmentType === 'client' || formData.assignmentType === 'all_users_in_client') && (
            <div className="space-y-2">
              <Label htmlFor="assignedToClient">Select Client</Label>
              <Select
                value={formData.assignedToClient}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToClient: value }))}
                disabled={isLoading || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}





              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isBulkAssignment ? 'Assign to All Files' : 'Assign File'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assignment History</CardTitle>
                <CardDescription>
                  View all previous assignments for this file
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                          <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : assignments.length > 0 ? (
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                          {assignment.assigned_to_user ? (
                            <User className="h-4 w-4 text-primary" />
                          ) : (
                            <Users className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">
                              {assignment.user_profile?.full_name || assignment.client_profile?.company_name || 'Unknown'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {assignment.assigned_to_user ? 'user' : 'client'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>Assigned by {assignment.assigned_by_profile?.full_name || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(assignment.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Assignment History</h3>
                    <p className="text-muted-foreground">
                      This file hasn't been assigned to anyone yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};