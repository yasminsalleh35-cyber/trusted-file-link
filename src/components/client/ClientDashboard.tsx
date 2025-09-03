import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Download,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  HardHat,
  Pickaxe,
  Mountain,
  Truck,
  Shield,
  Zap,
  Activity,
  TrendingUp
} from 'lucide-react';
import { useClientData } from '@/hooks/useClientData';
import { useFileManagement } from '@/hooks/useFileManagement';
import { AddTeamMemberModal } from '@/components/client/team/AddTeamMemberModal';
import { TeamMemberCard } from '@/components/client/team/TeamMemberCard';
import { FilePreviewModal } from '@/components/files/FilePreviewModal';

/**
 * ClientDashboard Component
 * 
 * Purpose: Main dashboard view for Client users
 * Features:
 * - Overview of client's team and resources
 * - Quick access to files assigned to the client
 * - Team member management
 * - Recent activity within the client's scope
 * - Message center for communication with admin and users
 * 
 * Access Control:
 * - Can only see their own users and assigned files
 * - Can manage users under their client account
 * - Can communicate with admin and their own users
 * - Cannot see other clients' data
 */

interface ClientDashboardProps {
  onNavigate: (path: string) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ 
  onNavigate
}) => {
  const { 
    client, 
    stats, 
    teamMembers, 
    isLoading, 
    error, 
    refreshData,
    addTeamMember,
    removeTeamMember,
    updateTeamMember
  } = useClientData();

  // Add file management hook
  const {
    files,
    isLoading: filesLoading,
    error: filesError,
    downloadFile,
    previewFile: previewFileFromHook
  } = useFileManagement();

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  
  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);

  // Get recent files (last 3 files) from real data
  const recentFiles = files.slice(0, 3).map(file => ({
    id: file.id,
    name: file.original_filename,
    size: file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
    uploadedAt: new Date(file.created_at).toLocaleDateString(),
    status: 'new' // You can enhance this based on access logs
  }));

  // Handle adding team member
  const handleAddTeamMember = async (memberData: {
    email: string;
    full_name: string;
    password: string;
  }) => {
    await addTeamMember(memberData);
  };

  // Handle editing team member
  const handleEditTeamMember = (member: any) => {
    setEditingMember(member);
    // TODO: Implement edit modal
  };

  // Handle removing team member
  const handleRemoveTeamMember = async (memberId: string) => {
    await removeTeamMember(memberId);
  };

  // Handle file download
  const handleDownloadFile = async (fileId: string) => {
    try {
      const file = files.find(f => f.id === fileId);
      if (file) {
        await downloadFile(file);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      // You could add a toast notification here
    }
  };

  // Handle file preview
  const handlePreviewFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      setPreviewFile(file);
      setShowPreviewModal(true);
    }
  };

  // Check if file can be previewed
  const canPreview = (mimeType: string | undefined | null): boolean => {
    if (!mimeType) return false;
    return (
      mimeType.startsWith('image/') ||
      mimeType === 'application/pdf' ||
      mimeType.startsWith('text/')
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      new: 'bg-warning/10 text-warning border-warning/20',
      viewed: 'bg-primary/10 text-primary border-primary/20',
      downloaded: 'bg-success/10 text-success border-success/20'
    };
    
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles]}>
        {status}
      </Badge>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mining Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-mining-primary font-mining-header">
            <Mountain className="inline-block mr-3 h-8 w-8" />
            {client?.company_name || 'Mining Operations'}
          </h1>
          <p className="text-muted-foreground font-mining-body">
            Manage your Site Users and operational resources
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowAddMemberModal(true)} 
            className="bg-mining-primary hover:bg-mining-primary/90 text-white"
          >
            <HardHat className="mr-2 h-4 w-4" />
            Add User
          </Button>
          <Button variant="outline" onClick={() => onNavigate('/client/messages?compose=admin')}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Contact Admin
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mining Operations Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-mining-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mining-body">Available Users</CardTitle>
            <HardHat className="h-4 w-4 text-mining-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mining-mono">{stats.teamMemberCount}</div>
            <p className="text-xs text-muted-foreground">Active users on site</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-mining-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mining-body">Site Documents</CardTitle>
            <Shield className="h-4 w-4 text-mining-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mining-mono">{files.length}</div>
            <p className="text-xs text-muted-foreground">Safety & operational docs</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-mining-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mining-body">Messages</CardTitle>
            <Activity className="h-4 w-4 text-mining-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mining-mono">{stats.unreadMessagesCount}</div>
            <p className="text-xs text-muted-foreground">Unread site updates</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mining-body">Production Data</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mining-mono">{stats.storageUsed}</div>
            <p className="text-xs text-muted-foreground">of operational storage</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Site Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mining-header flex items-center">
              <Shield className="mr-2 h-5 w-5 text-mining-secondary" />
              Recent Site Documents
            </CardTitle>
            <CardDescription className="font-mining-body">
              Safety protocols and operational documents for your mining site
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-8 w-8 text-mining-secondary" />
                    <div>
                      <p className="text-sm font-medium font-mining-body">{file.name}</p>
                      <p className="text-xs text-muted-foreground font-mining-mono">
                        {file.size} • {file.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={file.status} />
                    {canPreview(files.find(f => f.id === file.id)?.file_type) && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePreviewFile(file.id)}
                        disabled={filesLoading}
                        title="Preview file"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownloadFile(file.id)}
                      disabled={filesLoading}
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full font-mining-body" onClick={() => onNavigate('/client/files')}>
                <FileText className="mr-2 h-4 w-4" />
                View All Site Documents
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mining Crew */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mining-header flex items-center">
              <HardHat className="mr-2 h-5 w-5 text-mining-primary" />
              Manage Users
            </CardTitle>
            <CardDescription className="font-mining-body">
              Manage your site members and their site access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.length > 0 ? (
                teamMembers.slice(0, 3).map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    onEdit={handleEditTeamMember}
                    onDelete={handleRemoveTeamMember}
                  />
                ))
              ) : (
                <div className="text-center py-6">
                  <HardHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground font-mining-body">No site members assigned yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 font-mining-body"
                    onClick={() => setShowAddMemberModal(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Miner
                  </Button>
                </div>
              )}
            </div>
            {teamMembers.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full font-mining-body" onClick={() => onNavigate('/client/team')}>
                  <Users className="mr-2 h-4 w-4" />
                  {teamMembers.length > 3 ? `View All ${teamMembers.length} Crew Members` : 'Manage Users'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for managing your team and resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => onNavigate('/client/files')}
            >
              <FileText className="h-6 w-6 mb-2 text-client" />
              <span className="text-sm">View Files</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => onNavigate('/client/team')}
            >
              <Users className="h-6 w-6 mb-2 text-client" />
              <span className="text-sm">Manage Team</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => onNavigate('/client/messages')}
            >
              <MessageSquare className="h-6 w-6 mb-2 text-client" />
              <span className="text-sm">Messages</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => onNavigate('/client/reports')}
            >
              <Clock className="h-6 w-6 mb-2 text-client" />
              <span className="text-sm">Activity</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onAdd={handleAddTeamMember}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewFile(null);
        }}
        file={previewFile}
        onDownload={downloadFile}
        onPreview={previewFileFromHook}
      />
    </div>
  );
};