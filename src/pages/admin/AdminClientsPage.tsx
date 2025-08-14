import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ClientsTable } from '@/components/admin/clients/ClientsTable';
import { DatabaseTest } from '@/components/debug/DatabaseTest';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  FileText, 
  MessageSquare, 
  Settings,
  BarChart3
} from 'lucide-react';

/**
 * AdminClientsPage Component
 * 
 * Purpose: Main page for admin client management
 * Features:
 * - View all clients in a data table
 * - Add new clients
 * - Edit existing clients
 * - Delete/deactivate clients
 * - View client statistics
 * - Navigate to client details
 */
const AdminClientsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDebug, setShowDebug] = useState(false);

  // Handle navigation between admin routes
  const handleNavigate = (route: string) => {
    navigate(route);
  };

  // Admin navigation items
  const navigationItems = [
    { 
      name: 'Admin Dashboard', 
      href: '/admin/dashboard', 
      icon: <BarChart3 className="h-5 w-5" />
    },
    { 
      name: 'Manage Clients', 
      href: '/admin/clients', 
      icon: <Building2 className="h-5 w-5" />
    },
    { 
      name: 'Manage Users', 
      href: '/admin/users', 
      icon: <Users className="h-5 w-5" />
    },
    { 
      name: 'File Management', 
      href: '/admin/files', 
      icon: <FileText className="h-5 w-5" />
    },
    { 
      name: 'Message', 
      href: '/admin/messages', 
      icon: <MessageSquare className="h-5 w-5" />
    },
    { 
      name: 'Settings', 
      href: '/admin/settings', 
      icon: <Settings className="h-5 w-5" />
    },
  ];

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
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mining Company Management</h1>
            <p className="text-muted-foreground">
              Manage mining companies and their access to the operations portal
            </p>
          </div>
          {/* <Button 
            variant="outline" 
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </Button> */}
        </div>

        {/* Debug Panel */}
        {showDebug && (
          <div className="mb-6">
            <DatabaseTest />
          </div>
        )}

        {/* Clients Table */}
        <ClientsTable />
      </div>
    </DashboardLayout>
  );
};

export default AdminClientsPage;