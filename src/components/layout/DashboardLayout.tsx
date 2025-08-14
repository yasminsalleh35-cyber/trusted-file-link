import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  ChevronDown,
  Home
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
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userRole,
  userEmail,
  onLogout,
  navigation
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

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

  // Get dashboard route based on user role
  const getDashboardRoute = () => {
    const dashboardRoutes = {
      admin: '/admin/dashboard',
      client: '/client/dashboard',
      user: '/user/dashboard'
    };
    return dashboardRoutes[userRole];
  };

  // Check if current page is the dashboard
  const isDashboardPage = () => {
    const dashboardRoute = getDashboardRoute();
    return location.pathname === dashboardRoute;
  };

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
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Slide-out Navigation Sidebar (Mobile/Desktop) */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
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
              className={`${config.textClass} hover:bg-white/20`}
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
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                              (item.href !== '/admin/dashboard' && item.href !== '/client/dashboard' && item.href !== '/user/dashboard' && location.pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Full-width layout - No fixed sidebar */}
      <div className="w-full">
        {/* Clean header like Image 2 */}
        <header className="bg-card/80 backdrop-blur-sm shadow-sm border-b relative z-10">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left side - Hamburger menu, Home button, and page title */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Home button - only show when not on dashboard
              {!isDashboardPage() && (
                <Link to={getDashboardRoute()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline">Home</span>
                  </Button>
                </Link>
              )} */}
              
              <h2 className="text-xl font-semibold text-foreground">
                Dashboard
              </h2>
            </div>

            {/* Right side - Notifications and user */}
            <div className="flex items-center space-x-4">
              {!isDashboardPage() && (
                <Link to={getDashboardRoute()}>
                  <Button
                    variant = "outline"
                    size = "sm"
                    className = "flex items-center space-x-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Home className = "h-4 w-4" />
                    <span className = "hidden sm:inline">Home</span>
                  </Button>
                </Link>
              )}

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full"></span>
              </Button>

              {/* User dropdown - simplified like Image 2 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {getUserInitials(userEmail)}
                    </span>
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

        {/* Full-width main content - like Image 2 */}
        <main className="p-6 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
};