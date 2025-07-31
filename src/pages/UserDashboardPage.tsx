import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserDashboard } from '@/components/user/UserDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FileText, 
  MessageSquare, 
  Settings,
  BarChart3
} from 'lucide-react';

/**
 * UserDashboardPage Component
 * 
 * Purpose: Main dashboard page for regular users
 * Features:
 * - User-specific navigation menu
 * - User dashboard content
 * - File access and messaging
 * - Profile management
 */
const UserDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle navigation between user routes
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
      name: 'My Files', 
      href: '/user/files', 
      icon: <FileText className="h-5 w-5" />
    },
    { 
      name: 'Messages', 
      href: '/user/messages', 
      icon: <MessageSquare className="h-5 w-5" />
    },
    { 
      name: 'Profile', 
      href: '/user/profile', 
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
      <UserDashboard 
        onNavigate={handleNavigate}
      />
    </DashboardLayout>
  );
};

export default UserDashboardPage;