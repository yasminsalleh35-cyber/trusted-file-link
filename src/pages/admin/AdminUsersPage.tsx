import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { UsersTable } from '@/components/admin/users/UsersTable';
import {
  BarChart3,
  Building2,
  Users,
  FileText,
  MessageSquare,
  Settings,
  Plus
} from 'lucide-react';

/**
 * AdminUsersPage Component
 *
 * Purpose: Main page for admin user management
 * Notes: Initial scaffold so clicking "Manage Users" does not show Dashboard.
 *        We'll iterate to add full CRUD similar to Manage Clients.
 */
const AdminUsersPage: React.FC = () => {
  const { user, logout } = useAuth();

  // Admin navigation items (consistent across admin pages)
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
    }
  ];

  if (!user) return <div>Loading...</div>;

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
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">
              Manage users across all client organizations
            </p>
          </div>
          <Button className="bg-mining-primary hover:bg-mining-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Users Table */}
        <UsersTable />
      </div>
    </DashboardLayout>
  );
};

export default AdminUsersPage;