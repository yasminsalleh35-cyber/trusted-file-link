import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AccessibleInput, AccessibleButton } from '@/components/ui/accessible-components';
import { useOptimizedSearch } from '@/utils/performance';
import { ComponentErrorBoundary } from '@/components/ui/error-boundary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  User,
  HardDrive,
  AlertCircle,
  RefreshCw,
  BarChart3,
  MessageSquare,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useFileManagement } from '@/hooks/useFileManagement';
import { FileCard } from '@/components/files/FileCard';

/**
 * UserFilesPage Component
 * 
 * Purpose: Dedicated page for users to view and manage their assigned files
 * Features:
 * - View all assigned files
 * - Search and filter files
 * - Download and preview files
 * - File access tracking
 */

const UserFilesPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const {
    files,
    stats,
    isLoading,
    error,
    downloadFile,
    previewFile,
    refreshData
  } = useFileManagement();

  const [searchTerm, setSearchTerm] = useState('');

  // Handle navigation
  const handleNavigate = (route: string) => {
    navigate(route);
  };

  // User navigation items
  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/user/dashboard', 
      icon: <BarChart3 className="h-5 w-5" />
    },
    { 
      name: 'Safety Documents', 
      href: '/user/files', 
      icon: <FileText className="h-5 w-5" />
    },
    { 
      name: 'Site Updates', 
      href: '/user/messages', 
      icon: <MessageSquare className="h-5 w-5" />
    },
    { 
      name: 'Settings', 
      href: '/user/settings', 
      icon: <Settings className="h-5 w-5" />
    },
  ];

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter files based on search term
  const filteredFiles = files.filter(file =>
    file.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.uploaded_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle file actions (no assignment or delete for users)
  const handleFileAssign = () => {
    // Users cannot assign files
  };

  const handleFileDelete = () => {
    // Users cannot delete files
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Safety Documents</h1>
            <p className="text-muted-foreground">
              Access safety protocols and operational documents assigned to you
            </p>
          </div>
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Safety Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.totalFiles}</div>
              )}
              <p className="text-xs text-muted-foreground">Safety protocols assigned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Document Size</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
              )}
              <p className="text-xs text-muted-foreground">Total document size</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Updates</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{stats.recentUploads}</div>
              )}
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search safety documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Files Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Skeleton className="h-8 w-8" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredFiles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onDownload={downloadFile}
                onPreview={async (f) => {
                  try {
                    const url = await previewFile(f);
                    window.open(url, '_blank', 'noopener');
                  } catch (e) {
                    console.error('Preview failed:', e);
                  }
                }}
                onAssign={handleFileAssign}
                onDelete={handleFileDelete}
                canManage={false} // Users cannot manage files
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No safety documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'No safety documents match your search criteria.' 
                  : 'No safety documents have been assigned to you yet.'
                }
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserFilesPage;