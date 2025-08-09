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
  BarChart3,
  HardHat,
  Pickaxe,
  Mountain,
  Truck,
  Shield
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

  // Mining Company navigation items
  const navigationItems = [
    { 
      name: 'Operations Dashboard', 
      href: '/client/dashboard', 
      icon: <Mountain className="h-5 w-5" />
    },
    { 
      name: 'Mining Crew', 
      href: '/client/team', 
      icon: <HardHat className="h-5 w-5" />
    },
    { 
      name: 'Site Documents', 
      href: '/client/files', 
      icon: <FileText className="h-5 w-5" />
    },
    { 
      name: 'Communications', 
      href: '/client/messages', 
      icon: <MessageSquare className="h-5 w-5" />
    },
    { 
      name: 'Site Settings', 
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