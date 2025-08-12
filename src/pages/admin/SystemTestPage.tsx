import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SystemTest } from '@/components/testing/SystemTest';
import { QuickDiagnostic } from '@/components/testing/QuickDiagnostic';
import { useAuth } from '@/hooks/useAuth';
import { 
  Settings,
  MessageSquare,
  Users,
  FileText,
  BarChart3,
  Shield
} from 'lucide-react';

/**
 * SystemTestPage Component
 * 
 * Purpose: Admin page for comprehensive system testing
 * Features:
 * - Access to system testing dashboard
 * - Real-time test execution
 * - Detailed test results
 * - Issue identification and reporting
 */

const SystemTestPage: React.FC = () => {
  const { user, logout } = useAuth();

  // Admin navigation items
  const navigationItems = [
    { 
      name: 'Mining HQ', 
      href: '/admin/dashboard', 
      icon: <Shield className="h-5 w-5" />
    },
    { 
      name: 'Messages', 
      href: '/admin/messages', 
      icon: <MessageSquare className="h-5 w-5" />
    },
    { 
      name: 'User Management', 
      href: '/admin/users', 
      icon: <Users className="h-5 w-5" />
    },
    { 
      name: 'File Management', 
      href: '/admin/files', 
      icon: <FileText className="h-5 w-5" />
    },
    { 
      name: 'Analytics', 
      href: '/admin/analytics', 
      icon: <BarChart3 className="h-5 w-5" />
    },
    { 
      name: 'System Test', 
      href: '/admin/system-test', 
      icon: <Settings className="h-5 w-5" />
    },
  ];

  return (
    <DashboardLayout 
      userRole={user?.role || 'admin'}
      userEmail={user?.email || ''}
      onLogout={logout}
      navigation={navigationItems}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-mining-header">System Testing</h1>
            <p className="text-muted-foreground font-mining-body">
              Comprehensive testing dashboard for messaging and news systems
            </p>
          </div>
        </div>

        {/* Quick Diagnostic */}
        <QuickDiagnostic />

        {/* System Test Component */}
        <SystemTest />
      </div>
    </DashboardLayout>
  );
};

export default SystemTestPage;