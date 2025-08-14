import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  FileText, 
  MessageSquare, 
  Settings,
  BarChart3
} from 'lucide-react';

/**
 * AdminDashboardPage Component
 * 
 * Purpose: Main dashboard page for admin users
 * Features:
 * - Full admin navigation menu
 * - Admin dashboard content
 * - Proper logout functionality
 * - Role-based navigation items
 */
const AdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Handle navigation between admin routes (legacy - now handled by React Router)
  const handleNavigate = (route: string) => {
    navigate(route);
  };

  // Handle role switching for demo (legacy function)
  const handleRoleSwitch = async (role: 'admin' | 'client' | 'user') => {
    // For now, just navigate to the appropriate dashboard
    const roleRoutes = {
      admin: '/admin/dashboard',
      client: '/client/dashboard',
      user: '/user/dashboard'
    };
    navigate(roleRoutes[role]);
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
      <AdminDashboard 
        onNavigate={handleNavigate} 
        onRoleSwitch={handleRoleSwitch} 
      />
    </DashboardLayout>
  );
};

export default AdminDashboardPage;