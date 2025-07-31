import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegistrationForm } from '@/components/auth/RegistrationForm';
import { LandingPage } from '@/components/landing/LandingPage';

/**
 * LoginPage Component
 * 
 * Purpose: Handles authentication flow including login, registration, and landing
 * Features:
 * - Landing page display
 * - Login form with role-based authentication
 * - Registration form for new users
 * - Smooth transitions between forms
 */
const LoginPage: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    console.log('LoginPage auth state:', { isAuthenticated, user: user?.role, isLoading });
    
    if (isAuthenticated && user && !isLoading) {
      const roleRedirects = {
        admin: '/admin/dashboard',
        client: '/client/dashboard',
        user: '/user/dashboard'
      };
      
      const redirectPath = roleRedirects[user.role as keyof typeof roleRedirects];
      if (redirectPath) {
        console.log('Redirecting authenticated user to:', redirectPath);
        navigate(redirectPath, { replace: true });
      }
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  // Handle successful login (redirect is handled by useEffect above)
  const handleLogin = async (userData: { email: string; role: string; clientId?: string }) => {
    // Login success is handled by the LoginForm component
    // User will be automatically redirected by the useEffect above
  };

  // Show landing page first
  if (showLanding) {
    return <LandingPage onEnterPortal={() => setShowLanding(false)} />;
  }

  // Show registration form
  if (showRegistration) {
    return (
      <RegistrationForm
        onRegistrationSuccess={() => {
          setShowRegistration(false);
          // User will be automatically logged in after registration
        }}
        onBackToLogin={() => setShowRegistration(false)}
        allowedRoles={['client', 'user']} // Don't allow admin registration
        defaultRole="user"
      />
    );
  }

  // Show login form
  return (
    <LoginForm 
      onLogin={handleLogin} 
      onRegister={() => setShowRegistration(true)}
    />
  );
};

export default LoginPage;