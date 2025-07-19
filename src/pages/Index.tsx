import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LandingPage } from '@/components/landing/LandingPage';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ClientDashboard } from '@/components/client/ClientDashboard';
import { UserDashboard } from '@/components/user/UserDashboard';
import { 
  Building2, 
  Users, 
  FileText, 
  MessageSquare, 
  Settings,
  BarChart3,
  Upload,
  Download
} from 'lucide-react';

/**
 * Main Index Component - Client Portal System
 * 
 * Purpose: Entry point for the entire client portal application
 * Features:
 * - Role-based authentication and routing
 * - Dynamic dashboard rendering based on user role
 * - Navigation management for different user types
 * - Responsive layout with proper access control
 * 
 * Architecture:
 * - Uses useAuth hook for authentication state management
 * - Renders appropriate dashboard based on user role
 * - Implements role-based navigation menus
 * - Handles logout and route navigation
 */

const Index = () => {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  const [currentRoute, setCurrentRoute] = useState('/dashboard');
  const [loginRole, setLoginRole] = useState<'admin' | 'client' | 'user'>('admin');
  const [showLanding, setShowLanding] = useState(true);

  // Handle user login
  const handleLogin = async (userData: { email: string; role: string; clientId?: string }) => {
    await login({
      email: userData.email,
      role: userData.role as 'admin' | 'client' | 'user',
      clientId: userData.clientId
    });
  };

  // Handle role switching for demo
  const handleRoleSwitch = async (role: 'admin' | 'client' | 'user') => {
    await login({
      email: `demo-${role}@financehub.com`,
      role: role,
      clientId: role === 'client' ? 'demo-client-1' : undefined
    });
  };

  // Handle navigation between routes
  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
  };

  // Navigation configuration for each role
  const getNavigationItems = (role: string) => {
    const baseNavigation = {
      admin: [
        { name: 'Dashboard', href: '/dashboard', icon: <BarChart3 className="h-5 w-5" />, current: currentRoute === '/dashboard' },
        { name: 'Clients', href: '/admin/clients', icon: <Building2 className="h-5 w-5" />, current: currentRoute.startsWith('/admin/clients') },
        { name: 'Users', href: '/admin/users', icon: <Users className="h-5 w-5" />, current: currentRoute.startsWith('/admin/users') },
        { name: 'Files', href: '/admin/files', icon: <FileText className="h-5 w-5" />, current: currentRoute.startsWith('/admin/files') },
        { name: 'Messages', href: '/admin/messages', icon: <MessageSquare className="h-5 w-5" />, current: currentRoute.startsWith('/admin/messages') },
        { name: 'Settings', href: '/admin/settings', icon: <Settings className="h-5 w-5" />, current: currentRoute.startsWith('/admin/settings') },
      ],
      client: [
        { name: 'Dashboard', href: '/dashboard', icon: <BarChart3 className="h-5 w-5" />, current: currentRoute === '/dashboard' },
        { name: 'My Team', href: '/client/team', icon: <Users className="h-5 w-5" />, current: currentRoute.startsWith('/client/team') },
        { name: 'Files', href: '/client/files', icon: <FileText className="h-5 w-5" />, current: currentRoute.startsWith('/client/files') },
        { name: 'Messages', href: '/client/messages', icon: <MessageSquare className="h-5 w-5" />, current: currentRoute.startsWith('/client/messages') },
        { name: 'Settings', href: '/client/settings', icon: <Settings className="h-5 w-5" />, current: currentRoute.startsWith('/client/settings') },
      ],
      user: [
        { name: 'Dashboard', href: '/dashboard', icon: <BarChart3 className="h-5 w-5" />, current: currentRoute === '/dashboard' },
        { name: 'My Files', href: '/user/files', icon: <FileText className="h-5 w-5" />, current: currentRoute.startsWith('/user/files') },
        { name: 'Messages', href: '/user/messages', icon: <MessageSquare className="h-5 w-5" />, current: currentRoute.startsWith('/user/messages') },
        { name: 'Profile', href: '/user/profile', icon: <Settings className="h-5 w-5" />, current: currentRoute.startsWith('/user/profile') },
      ]
    };

    return baseNavigation[role as keyof typeof baseNavigation] || [];
  };

  // Render appropriate dashboard based on user role
  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case 'admin':
        return <AdminDashboard onNavigate={handleNavigate} onRoleSwitch={handleRoleSwitch} />;
      case 'client':
        return (
          <ClientDashboard 
            onNavigate={handleNavigate}
            clientData={{
              companyName: user.clientName || 'Your Company',
              userCount: 8,
              assignedFiles: 15,
              recentMessages: 3
            }}
          />
        );
      case 'user':
        return (
          <UserDashboard 
            onNavigate={handleNavigate}
            userData={{
              name: user.name || 'User',
              email: user.email,
              clientName: user.clientName || 'Company',
              assignedFiles: 7,
              unreadMessages: 2
            }}
          />
        );
      default:
        return <div>Invalid user role</div>;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page first
  if (showLanding && !isAuthenticated) {
    return <LandingPage onEnterPortal={() => setShowLanding(false)} />;
  }

  // Show login form if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div>
        {/* Role selector for demo purposes */}
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-card rounded-lg shadow-lg border p-4">
            <p className="text-sm font-medium mb-2">Demo Login As:</p>
            <div className="flex gap-2">
              <button
                onClick={() => setLoginRole('admin')}
                className={`px-3 py-1 text-xs rounded ${
                  loginRole === 'admin' 
                    ? 'bg-admin text-white' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setLoginRole('client')}
                className={`px-3 py-1 text-xs rounded ${
                  loginRole === 'client' 
                    ? 'bg-client text-white' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Client
              </button>
              <button
                onClick={() => setLoginRole('user')}
                className={`px-3 py-1 text-xs rounded ${
                  loginRole === 'user' 
                    ? 'bg-user text-white' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                User
              </button>
            </div>
          </div>
        </div>
        
        <LoginForm onLogin={handleLogin} userType={loginRole} />
      </div>
    );
  }

  // Show main dashboard with layout
  return (
    <DashboardLayout
      userRole={user.role}
      userEmail={user.email}
      onLogout={logout}
      navigation={getNavigationItems(user.role)}
      onNavigate={handleNavigate}
    >
      {renderDashboard()}
    </DashboardLayout>
  );
};

export default Index;
