import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FileOperationErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingOverlay, FileOperationButton, EmptyState } from '@/components/ui/loading-states';
import { DeleteFileDialog, BulkOperationDialog, useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { AccessibleButton, AccessibleInput, AccessibleFileActions } from '@/components/ui/accessible-components';
import { useCachedFileOperations, useOptimizedSearch } from '@/utils/performance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Upload,
  Search,
  Filter,
  BarChart3,
  Users,
  HardDrive,
  AlertCircle,
  RefreshCw,
  Plus,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  CheckSquare,
  Square,
  Trash2,
  Share,
  FolderOpen,
  Tag,
  Calendar,
  FileType,
  User
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFileManagement } from '@/hooks/useFileManagement';
import { FileUploadZone } from '@/components/files/FileUploadZone';
import { SimpleFileUpload } from '@/components/files/SimpleFileUpload';
import { FileCard } from '@/components/files/FileCard';
import { EnhancedFileCard } from '@/components/admin/EnhancedFileCard';
import { FileAssignmentModal } from '@/components/files/FileAssignmentModal';
import { FilePreviewModal } from '@/components/files/FilePreviewModal';
import { testStorageSetup, createStorageBucket } from '@/utils/testStorage';
import { testDatabaseSetup, createTestFile } from '@/utils/testDatabase';
import { setupCompleteFileSystem } from '@/utils/setupDatabase';
import { showManualSetupInstructions, testFileUploadReadiness } from '@/utils/manualSetup';

/**
 * AdminFileManagementPage Component
 * 
 * Purpose: Main file management interface for administrators
 * Features:
 * - File upload and management
 * - File assignment to users/clients
 * - File statistics and analytics
 * - Search and filtering
 * - Bulk operations
 */

const AdminFileManagementPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    files,
    assignments,
    stats,
    isLoading,
    error,
    assignFile,
    deleteFile,
    downloadFile,
    previewFile: previewFileFromHook,
    refreshData
  } = useFileManagement();

  // Search and filtering state with performance optimization
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  
  // Use optimized search
  const { filteredItems: searchResults, isSearching, setSearchTerm: handleSearch } = useOptimizedSearch(
    files,
    ['original_filename', 'description', 'mime_type'],
    300 // 300ms debounce
  );
  const [showUploadZone, setShowUploadZone] = useState(false);
  
  // Enhanced filtering and display options
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterUploader, setFilterUploader] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Bulk operations state
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);

  // Handle navigation
  const handleNavigate = (route: string) => {
    navigate(route);
  };

  // Admin navigation items
  const navigationItems = [
    { 
      name: 'Mining HQ', 
      href: '/admin/dashboard', 
      icon: <BarChart3 className="h-5 w-5" />
    },
    { 
      name: 'Mining Sites', 
      href: '/admin/users', 
      icon: <Users className="h-5 w-5" />
    },
    { 
      name: 'Documents', 
      href: '/admin/files', 
      icon: <FileText className="h-5 w-5" />
    },
  ];

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get unique file types for filtering
  const fileTypes = useMemo(() => {
    const types = new Set(files.map(file => file.file_type?.split('/')[0] || 'unknown'));
    return Array.from(types).sort();
  }, [files]);

  // Get unique uploaders for filtering
  const uploaders = useMemo(() => {
    const users = new Set(files.map(file => file.uploaded_by_name || 'Unknown'));
    return Array.from(users).sort();
  }, [files]);

  // Enhanced filtering and sorting
  const filteredAndSortedFiles = useMemo(() => {
    // Use optimized search results if searching, otherwise use all files
    let filtered = searchTerm ? searchResults : files;
    
    // Apply additional filters
    filtered = filtered.filter(file => {
      // Type filter
      const typeMatch = filterType === 'all' || 
        file.file_type?.startsWith(filterType) ||
        (filterType === 'unknown' && !file.file_type);

      // Uploader filter
      const uploaderMatch = filterUploader === 'all' || 
        file.uploaded_by_name === filterUploader;

      return typeMatch && uploaderMatch;
    });

    // Sort files
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.original_filename || '').localeCompare(b.original_filename || '');
          break;
        case 'date':
          comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          break;
        case 'size':
          comparison = (a.file_size || 0) - (b.file_size || 0);
          break;
        case 'type':
          comparison = (a.file_type || '').localeCompare(b.file_type || '');
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [files, searchTerm, searchResults, filterType, filterUploader, sortBy, sortOrder]);

  // Handle file assignment
  const handleAssignFile = (file: any) => {
    setSelectedFile(file);
    setShowAssignmentModal(true);
  };

  // Handle file preview
  const handlePreviewFile = (file: any) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };

  // Handle file assignment submission
  const handleAssignmentSubmit = async (fileId: string, assignment: any) => {
    await assignFile(fileId, assignment);
  };

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedFiles.size === filteredAndSortedFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredAndSortedFiles.map(file => file.id)));
    }
  };

  const handleSelectFile = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      for (const fileId of selectedFiles) {
        await deleteFile(fileId);
      }
      setSelectedFiles(new Set());
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  const handleBulkAssign = () => {
    if (selectedFiles.size === 0) return;
    // For bulk assignment, we'll use the first selected file as a template
    const firstFile = filteredAndSortedFiles.find(file => selectedFiles.has(file.id));
    if (firstFile) {
      setSelectedFile({ ...firstFile, bulkSelection: Array.from(selectedFiles) });
      setShowAssignmentModal(true);
    }
  };

  // Handle file upload completion
  const handleUploadComplete = (uploadedFiles: any[]) => {
    console.log('Files uploaded:', uploadedFiles);
    refreshData();
    setShowUploadZone(false);
  };

  // Handle upload error
  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  // Test storage setup
  const handleTestStorage = async () => {
    console.log('🧪 Testing storage setup...');
    await createStorageBucket();
    await testStorageSetup();
  };

  // Test database setup
  const handleTestDatabase = async () => {
    console.log('🗄️ Testing database setup...');
    await testDatabaseSetup();
    await createTestFile();
  };

  // Setup complete file system
  const handleSetupFileSystem = async () => {
    console.log('🚀 Setting up complete file system...');
    const success = await setupCompleteFileSystem();
    if (success) {
      console.log('✅ File system setup completed! Try uploading a file now.');
      refreshData();
    } else {
      console.error('❌ File system setup failed. Check console for details.');
    }
  };

  // Manual setup instructions
  const handleManualSetup = () => {
    showManualSetupInstructions();
  };

  // Test readiness
  const handleTestReadiness = async () => {
    const ready = await testFileUploadReadiness();
    if (ready) {
      console.log('🎉 System is ready! Try uploading a file.');
    } else {
      console.log('⚠️ System not ready. Check the issues above.');
    }
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
      <FileOperationErrorBoundary operation="file management">
        <LoadingOverlay isLoading={isBulkDeleting} message="Deleting files...">
          <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mining Document Management</h1>
            <p className="text-muted-foreground">
              Upload, manage, and assign safety documents and operational files to mining sites and workers
            </p>
            {selectedFiles.size > 0 && (
              <div className="mt-2">
                <Badge variant="secondary" className="mr-2">
                  {selectedFiles.size} files selected
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkAssign}
                  className="mr-2"
                >
                  <Share className="mr-1 h-3 w-3" />
                  Bulk Assign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Bulk Delete
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowUploadZone(!showUploadZone)}>
              <Plus className="mr-2 h-4 w-4" />
              {showUploadZone ? 'Hide Upload' : 'Upload Documents'}
            </Button>
            <Button variant="outline" onClick={refreshData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Zone */}
        {showUploadZone && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>
                Upload files to assign to users and clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleFileUpload
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.totalFiles}</div>
              )}
              <p className="text-xs text-muted-foreground">Files in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
              )}
              <p className="text-xs text-muted-foreground">Total storage</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{stats.activeAssignments}</div>
              )}
              <p className="text-xs text-muted-foreground">File assignments</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="files" className="space-y-4">
          <TabsList>
            <TabsTrigger value="files">All Files</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4">
            {/* Enhanced Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <AccessibleInput
                        id="file-search"
                        label="Search Files"
                        placeholder="Search files by name, description..."
                        value={searchTerm}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSearchTerm(value);
                          handleSearch(value);
                        }}
                        icon={<Search className="h-4 w-4" />}
                        helperText="Search across file names, descriptions, and file types"
                        showLabel={false}
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    {/* Sort Controls */}
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            Date
                          </div>
                        </SelectItem>
                        <SelectItem value="name">
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4" />
                            Name
                          </div>
                        </SelectItem>
                        <SelectItem value="size">
                          <div className="flex items-center">
                            <HardDrive className="mr-2 h-4 w-4" />
                            Size
                          </div>
                        </SelectItem>
                        <SelectItem value="type">
                          <div className="flex items-center">
                            <FileType className="mr-2 h-4 w-4" />
                            Type
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Filter Row */}
                  <div className="flex items-center space-x-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="File Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {fileTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterUploader} onValueChange={setFilterUploader}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Uploader" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {uploaders.map(uploader => (
                          <SelectItem key={uploader} value={uploader}>
                            {uploader}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Clear Filters */}
                    {(searchTerm || filterType !== 'all' || filterUploader !== 'all') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setFilterType('all');
                          setFilterUploader('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}

                    {/* Results Count */}
                    <div className="text-sm text-muted-foreground ml-auto">
                      {filteredAndSortedFiles.length} of {files.length} files
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Selection Header */}
            {filteredAndSortedFiles.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedFiles.size === filteredAndSortedFiles.length && filteredAndSortedFiles.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm font-medium">
                        Select All ({filteredAndSortedFiles.length} files)
                      </span>
                    </div>
                    {selectedFiles.size > 0 && (
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {selectedFiles.size} selected
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFiles(new Set())}
                        >
                          Clear Selection
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Files Display */}
            {isLoading ? (
              <div className={
                viewMode === 'grid' 
                  ? "grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "space-y-2"
              }>
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
            ) : filteredAndSortedFiles.length > 0 ? (
              <div className={
                viewMode === 'grid' 
                  ? "grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "space-y-3"
              }>
                {filteredAndSortedFiles.map((file) => (
                  <div key={file.id} className="relative">
                    {/* Selection Checkbox */}
                    <div className="absolute top-3 left-3 z-10">
                      <Checkbox
                        checked={selectedFiles.has(file.id)}
                        onCheckedChange={() => handleSelectFile(file.id)}
                        className="bg-white border-2 shadow-sm hover:bg-gray-50"
                      />
                    </div>
                    
                    <EnhancedFileCard
                      file={file}
                      onDownload={downloadFile}
                      onPreview={handlePreviewFile}
                      onAssign={handleAssignFile}
                      onDelete={deleteFile}
                      canManage={true}
                      viewMode={viewMode}
                      isSelected={selectedFiles.has(file.id)}
                      onSelect={handleSelectFile}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No files found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'No files match your search criteria.' : 'Upload your first file to get started.'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setShowUploadZone(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>File Assignments</CardTitle>
                <CardDescription>
                  Manage file assignments to users and clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignments.length > 0 ? (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{assignment.file?.original_filename}</p>
                          <p className="text-sm text-muted-foreground">
                            Assigned to: {assignment.assigned_to_name || assignment.assigned_to_client_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            By: {assignment.assigned_by_name} • {new Date(assignment.assigned_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No file assignments yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* File Assignment Modal */}
        <FileAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedFile(null);
          }}
          file={selectedFile}
          onAssign={handleAssignmentSubmit}
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

        {/* Confirmation Dialogs */}
        <BulkOperationDialog
          isOpen={showBulkDeleteDialog}
          onClose={() => setShowBulkDeleteDialog(false)}
          onConfirm={confirmBulkDelete}
          operation="delete"
          itemCount={selectedFiles.size}
          itemType="file"
        />
      </div>
        </LoadingOverlay>
      </FileOperationErrorBoundary>
    </DashboardLayout>
  );
};

export default AdminFileManagementPage;