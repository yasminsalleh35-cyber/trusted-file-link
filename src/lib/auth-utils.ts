/**
 * Authentication Utilities
 * 
 * Purpose: Provide utility functions for authentication management
 * Features:
 * - Session recovery
 * - Auth state debugging
 * - Error handling helpers
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Clear all authentication data and reload the page
 * Use this as a last resort when auth state gets corrupted
 */
export const clearAuthAndReload = () => {
  console.log('Clearing all auth data and reloading...');
  
  // Clear localStorage
  localStorage.clear();
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear cookies
  document.cookie.split(";").forEach(function(c) {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // Sign out from Supabase
  supabase.auth.signOut().finally(() => {
    // Reload the page
    window.location.reload();
  });
};

/**
 * Check if the current session is valid
 */
export const validateSession = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session validation error:', error);
      return false;
    }
    
    return !!session;
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
};

/**
 * Refresh the current session
 */
export const refreshSession = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Session refresh error:', error);
      return false;
    }
    
    return !!data.session;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return false;
  }
};

/**
 * Debug authentication state
 */
export const debugAuthState = async () => {
  console.group('🔍 Auth State Debug');
  
  try {
    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session:', session ? 'Valid' : 'None', sessionError ? `Error: ${sessionError.message}` : '');
    
    // Check user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User:', user ? `${user.email} (${user.id})` : 'None', userError ? `Error: ${userError.message}` : '');
    
    // Check localStorage
    const localStorageKeys = Object.keys(localStorage).filter(key => key.includes('supabase'));
    console.log('LocalStorage keys:', localStorageKeys);
    
    // Check if profile exists
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      console.log('Profile:', profile ? `${profile.email} (${profile.role})` : 'None', 
                  profileError ? `Error: ${profileError.message}` : '');
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
  
  console.groupEnd();
};

/**
 * Add this to window for debugging in browser console
 */
if (typeof window !== 'undefined') {
  (window as any).authDebug = {
    clearAuthAndReload,
    validateSession,
    refreshSession,
    debugAuthState
  };
}