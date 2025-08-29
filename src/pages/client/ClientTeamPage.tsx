import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useClientData } from '@/hooks/useClientData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { AddTeamMemberModal } from '@/components/client/team/AddTeamMemberModal';
import { EditTeamMemberModal } from '@/components/client/team/EditTeamMemberModal';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { HardHat, MessageSquare, Mountain, RefreshCw, Search, Settings, FileText } from 'lucide-react';

/**
 * ClientTeamPage (Manage Users)
 * 
 * Purpose: Dedicated page for clients to manage their users.
 * Features:
 * - View all team members for the client's organization
 * - Add new user (client-scoped)
 * - Remove user
 * - (Stub) Edit user details
 */
const ClientTeamPage: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    teamMembers,
    isLoading,
    error,
    refreshData,
    addTeamMember,
    removeTeamMember,
    updateTeamMember,
  } = useClientData();

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<{ id: string; email: string; full_name: string } | null>(null);
  const [search, setSearch] = useState('');

  // Same navigation config as dashboard so sidebar matches
  const navigationItems = [
    { name: 'Dashboard', href: '/client/dashboard', icon: <Mountain className="h-5 w-5" /> },
    { name: 'Manage Users', href: '/client/team', icon: <HardHat className="h-5 w-5" /> },
    { name: 'Site Documents', href: '/client/files', icon: <FileText className="h-5 w-5" /> },
    { name: 'Communications', href: '/client/messages', icon: <MessageSquare className="h-5 w-5" /> },
    { name: 'Site Settings', href: '/client/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  if (!user) return <div>Loading...</div>;

  const filteredMembers = teamMembers.filter(m => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  });

  const handleAddTeamMember = async (memberData: { email: string; full_name: string; password: string; }) => {
    await addTeamMember(memberData);
    setShowAddMemberModal(false);
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    await removeTeamMember(memberId);
  };

  const handleEdit = (member: { id: string; email: string; full_name: string }) => {
    setEditingMember(member);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (memberId: string, updates: { full_name?: string; email?: string }) => {
    await updateTeamMember(memberId, updates);
    setShowEditModal(false);
    setEditingMember(null);
  };

  return (
    <DashboardLayout
      userRole={user.role}
      userEmail={user.email}
      onLogout={logout}
      navigation={navigationItems}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-mining-header">
              <HardHat className="inline-block mr-3 h-8 w-8" />
              Manage Users
            </h1>
            <p className="text-muted-foreground font-mining-body">Add, remove, and manage access for your site users</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddMemberModal(true)} className="bg-mining-primary hover:bg-mining-primary/90 text-white">
              <HardHat className="mr-2 h-4 w-4" />
              Add User
            </Button>
            <Button variant="outline" onClick={refreshData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="pl-9"
            />
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-3/5" />
                  <Skeleton className="h-4 w-2/5 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Team list - Table view */}
        {!isLoading && !error && (
          <Card>
            <CardHeader>
              <CardTitle className="font-mining-header">Team Members</CardTitle>
              <CardDescription className="font-mining-body">
                {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredMembers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No users match your search.</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.full_name || '—'}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell className="capitalize">{member.role}</TableCell>
                          <TableCell>{member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}</TableCell>
                          <TableCell>
                            <span
                              className={
                                member.status === 'online'
                                  ? 'inline-flex h-2 w-2 rounded-full bg-green-500 align-middle'
                                  : 'inline-flex h-2 w-2 rounded-full bg-muted-foreground/40 align-middle'
                              }
                              title={member.status}
                            />
                            <span className="ml-2 text-sm text-muted-foreground">{member.status}</span>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit({ id: member.id, email: member.email, full_name: member.full_name || '' })}>Edit</Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">Remove</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove user?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action will permanently remove this user from your team.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemoveTeamMember(member.id)}>Remove</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add member modal */}
      <AddTeamMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onAddMember={handleAddTeamMember}
      />

      {/* Edit member modal */}
      <EditTeamMemberModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingMember(null); }}
        member={editingMember}
        onSave={handleSaveEdit}
      />
    </DashboardLayout>
  );
};

export default ClientTeamPage;