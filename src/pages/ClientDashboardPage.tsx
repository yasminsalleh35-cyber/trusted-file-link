import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ClientDashboard } from '@/components/client/ClientDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Settings,
  BarChart3
} from 'lucide-react';

/**
 * ClientDashboardPage Component
 * 
 * Purpose: Main dashboard page for client users
 * Features:
 * - Client-specific navigation menu
 * - Client dashboard content
 * - Team management access
 * - File and message management
 */
const ClientDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle navigation between client routes
  const handleNavigate = (route: string) => {
    navigate(route);
  };

  // Client navigation items
  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/client/dashboard', 
      icon: <BarChart3 className="h-5 w-5" />
    },
    { 
      name: 'My Team', 
      href: '/client/team', 
      icon: <Users className="h-5 w-5" />
    },
    { 
      name: 'Files', 
      href: '/client/files', 
      icon: <FileText className="h-5 w-5" />
    },
    { 
      name: 'Messages', 
      href: '/client/messages', 
      icon: <MessageSquare className="h-5 w-5" />
    },
    { 
      name: 'Settings', 
      href: '/client/settings', 
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
      <ClientDashboard 
        onNavigate={handleNavigate}
      />
    </DashboardLayout>
  );
};

export default ClientDashboardPage;