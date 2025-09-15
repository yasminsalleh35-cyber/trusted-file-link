import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AccessibleInput } from '@/components/ui/accessible-components';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  HardDrive,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Settings,
  Mountain,
  HardHat,
  Grid3X3,
  List
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFileManagement } from '@/hooks/useFileManagement';
import { FileCard } from '@/components/files/FileCard';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

/**
 * ClientFilesPage Component (Site Documents)
 *
 * Purpose: Dedicated page for clients to view site-wide documents assigned to their client or themselves
 * Features:
 * - View all assigned files (client + user scope)
 * - Search and filter files
 * - Grid and Table view modes
 * - Download and preview files
 */

const ClientFilesPage: React.FC = () => {
  const { user, logout } = useAuth();

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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Client navigation items
  const navigationItems = [
    { name: 'Dashboard', href: '/client/dashboard', icon: <Mountain className="h-5 w-5" /> },
    { name: 'Manage Users', href: '/client/team', icon: <HardHat className="h-5 w-5" /> },
    { name: 'Site Documents', href: '/client/files', icon: <FileText className="h-5 w-5" /> },
    { name: 'Communications', href: '/client/messages', icon: <MessageSquare className="h-5 w-5" /> },
    { name: 'Site Settings', href: '/client/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  // Format file size
  const formatFileSize = (bytes: number | null | undefined): string => {
    const val = bytes ?? 0;
    if (val === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(val) / Math.log(k));
    return parseFloat((val / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter files based on search term
  const filteredFiles = files.filter(file =>
    (file.original_filename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.uploaded_by_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1 className="text-3xl font-bold tracking-tight font-mining-header">Site Documents</h1>
            <p className="text-muted-foreground font-mining-body">
              View and access documents assigned to your organization or directly to you
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex rounded-md border p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                className="gap-2"
                title="Grid view"
              >
                <Grid3X3 className="h-4 w-4" /> Grid
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                aria-pressed={viewMode === 'table'}
                className="gap-2"
                title="Table view"
              >
                <List className="h-4 w-4" /> Table
              </Button>
            </div>
            <Button variant="outline" onClick={refreshData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
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
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.totalFiles}</div>
              )}
              <p className="text-xs text-muted-foreground">Assigned to your site</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
              )}
              <p className="text-xs text-muted-foreground">All documents size</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{stats.recentUploads}</div>
              )}
              <p className="text-xs text-muted-foreground">Recently uploaded</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search site documents..."
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

        {/* Files - Grid or Table */}
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
          viewMode === 'grid' ? (
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
                  onAssign={() => { /* Clients: assignment handled elsewhere or future enhancement */ }}
                  onDelete={() => { /* Clients: deletion restricted by policy; future enhancement */ }}
                  canManage={false}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead className="hidden md:table-cell">Size</TableHead>
                      <TableHead className="hidden lg:table-cell">Uploaded By</TableHead>
                      <TableHead className="hidden lg:table-cell">Uploaded At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{file.original_filename || 'Untitled'}</span>
                            {file.description && (
                              <span className="text-xs text-muted-foreground truncate max-w-[380px]">
                                {file.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {file.file_type || '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatFileSize(file.file_size)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {file.uploaded_by_name || 'Unknown'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {file.created_at ? new Date(file.created_at).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" onClick={async () => {
                            try {
                              const url = await previewFile(file);
                              window.open(url, '_blank', 'noopener');
                            } catch (e) {
                              console.error('Preview failed:', e);
                            }
                          }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => downloadFile(file)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No site documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'No documents match your search criteria.' 
                  : 'No documents have been assigned to your site yet.'
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

export default ClientFilesPage;