import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  X, 
  LogOut, 
  Settings, 
  User, 
  Bell,
  ChevronDown
} from 'lucide-react';
import { AnimatedBackground } from './AnimatedBackground';

/**
 * DashboardLayout Component
 * 
 * Purpose: Main layout wrapper for all dashboard pages
 * Features:
 * - Responsive navigation sidebar
 * - Header with user profile and notifications
 * - Role-based styling and navigation
 * - Mobile-friendly collapsible menu
 * 
 * Props:
 * - children: React nodes to render in main content area
 * - userRole: 'admin' | 'client' | 'user' - determines navigation items
 * - userEmail: Current user's email address
 * - onLogout: Callback function for logout action
 * - navigation: Array of navigation items specific to user role
 */

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  current?: boolean;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'client' | 'user';
  userEmail: string;
  onLogout: () => void;
  navigation: NavigationItem[];
  onNavigate: (href: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userRole,
  userEmail,
  onLogout,
  navigation,
  onNavigate
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Role-specific configuration
  const roleConfig = {
    admin: {
      title: 'Admin Portal',
      bgClass: 'bg-gradient-to-r from-admin to-admin/80',
      textClass: 'text-white'
    },
    client: {
      title: 'Client Portal',
      bgClass: 'bg-gradient-to-r from-client to-client/80',
      textClass: 'text-white'
    },
    user: {
      title: 'User Portal',
      bgClass: 'bg-gradient-to-r from-user to-user/80',
      textClass: 'text-white'
    }
  };

  const config = roleConfig[userRole];

  // Get user initials for avatar
  const getUserInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-muted/30 relative">
      {/* Animated background */}
      <AnimatedBackground />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        {/* Sidebar header */}
        <div className={`${config.bgClass} p-6`}>
          <div className="flex items-center justify-between">
            <h1 className={`text-xl font-bold ${config.textClass}`}>
              {config.title}
            </h1>
            <Button
              variant="ghost"
              size="sm"
              className={`lg:hidden ${config.textClass} hover:bg-white/20`}
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className={`text-sm ${config.textClass} opacity-90 mt-1`}>
            Welcome back, {userEmail.split('@')[0]}
          </p>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">
          <div className="space-y-2">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  onNavigate(item.href);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${item.current 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-card/80 backdrop-blur-sm shadow-sm border-b relative z-10">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Page title - will be updated based on current page */}
            <div className="flex-1 lg:flex-none">
              <h2 className="text-xl font-semibold text-foreground">
                Dashboard
              </h2>
            </div>

            {/* Header actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full"></span>
              </Button>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(userEmail)}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{userEmail}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="p-6 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
};