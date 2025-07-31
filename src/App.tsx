import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { initializeSystemMonitoring } from "@/utils/integration";
import LoginPage from "./pages/LoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminClientsPage from "./pages/admin/AdminClientsPage";
import AdminFileManagementPage from "./pages/AdminFileManagementPage";
import ClientDashboardPage from "./pages/ClientDashboardPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import UserFilesPage from "./pages/UserFilesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Initialize system monitoring
if (typeof window !== 'undefined') {
  initializeSystemMonitoring();
}

/**
 * DashboardRedirect Component
 * 
 * Purpose: Redirects users to their role-specific dashboard
 * Used for legacy /dashboard route compatibility
 */
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const roleRedirects = {
    admin: '/admin/dashboard',
    client: '/client/dashboard',
    user: '/user/dashboard'
  };
  
  return <Navigate to={roleRedirects[user.role as keyof typeof roleRedirects]} replace />;
};

/**
 * Main App Component with Proper Routing
 * 
 * Purpose: Root application component with role-based routing
 * Features:
 * - Protected routes with role-based access control
 * - Automatic redirects based on user role
 * - Proper authentication flow
 * - 404 handling for invalid routes
 */
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Root redirect - goes to login if not authenticated */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Protected Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/clients" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminClientsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/files" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminFileManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Client Routes */}
          <Route 
            path="/client/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <ClientDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/client/*" 
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <ClientDashboardPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected User Routes */}
          <Route 
            path="/user/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user/files" 
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserFilesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user/*" 
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserDashboardPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Legacy dashboard redirect - redirect to role-specific dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } 
          />
          
          {/* 404 - Catch all invalid routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
