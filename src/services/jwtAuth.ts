/**
 * JWT Authentication Service
 * 
 * Purpose: Handle JWT token-based authentication while maintaining compatibility
 * with existing Supabase authentication system
 */

import { supabase } from '@/integrations/supabase/client';
import { BrowserJWTService } from './browserJWT';

// JWT Configuration
const JWT_SECRET = 'trusted-file-link-jwt-secret-key-2024'; // In production, use environment variable
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'client' | 'user';
  full_name: string;
  client_id?: string;
  client_name?: string;
  iat?: number;
  exp?: number;
}

export interface JWTTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTAuthResponse {
  success: boolean;
  user?: JWTPayload;
  tokens?: JWTTokens;
  error?: string;
}

/**
 * JWT Authentication Service Class
 */
export class JWTAuthService {
  
  /**
   * Generate JWT tokens for a user
   */
  static async generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<JWTTokens> {
    return await BrowserJWTService.generateTokens(payload);
  }

  /**
   * Verify and decode JWT token
   */
  static async verifyToken(token: string): Promise<JWTPayload | null> {
    return await BrowserJWTService.verifyToken(token);
  }

  /**
   * Verify refresh token
   */
  static async verifyRefreshToken(token: string): Promise<{ userId: string; email: string } | null> {
    const decoded = await BrowserJWTService.verifyToken(token);
    if (decoded) {
      return { userId: decoded.userId, email: decoded.email };
    }
    return null;
  }

  /**
   * Sign in with JWT tokens (maintains Supabase compatibility)
   */
  static async signInWithJWT(credentials: {
    email: string;
    password: string;
    selectedDemoLogin?: 'admin' | 'client' | 'user';
  }): Promise<JWTAuthResponse> {
    try {
      console.log('🔐 JWT Auth: Starting sign in for', credentials.email);

      // First, authenticate with Supabase to validate credentials
      const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (supabaseError) {
        throw supabaseError;
      }

      if (!supabaseData.user) {
        throw new Error('No user data returned from Supabase');
      }

      console.log('✅ Supabase authentication successful');

      // Get user profile from database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseData.user.id)
        .single();

      if (profileError) {
        console.error('Profile query error:', profileError);
        throw new Error('User profile not found. Please contact administrator.');
      }

      // Get client data separately if user has a client_id
      let clientData = null;
      if (profileData.client_id) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', profileData.client_id)
          .single();

        if (!clientError && client) {
          clientData = client;
        }
      }

      const actualRole = profileData.role as 'admin' | 'client' | 'user';

      // Role validation for demo login
      if (credentials.selectedDemoLogin) {
        if (actualRole !== credentials.selectedDemoLogin) {
          // Sign out from Supabase since role doesn't match
          await supabase.auth.signOut();
          throw new Error(`Access denied: You selected ${credentials.selectedDemoLogin} login but your account has ${actualRole} role. Please select the correct demo type for your role.`);
        }
      }

      // Create JWT payload
      const jwtPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: profileData.id,
        email: profileData.email,
        role: actualRole,
        full_name: profileData.full_name,
        client_id: profileData.client_id || undefined,
        client_name: clientData?.company_name || undefined
      };

      // Generate JWT tokens
      const tokens = await this.generateTokens(jwtPayload);

      // Store tokens in localStorage for persistence
      localStorage.setItem('jwt_access_token', tokens.accessToken);
      localStorage.setItem('jwt_refresh_token', tokens.refreshToken);
      localStorage.setItem('jwt_expires_at', tokens.expiresIn.toString());

      console.log('✅ JWT tokens generated and stored');

      // Keep Supabase session active for database operations
      // Don't sign out from Supabase as we need it for RLS policies

      return {
        success: true,
        user: { ...jwtPayload, iat: Math.floor(Date.now() / 1000), exp: tokens.expiresIn },
        tokens
      };

    } catch (error) {
      console.error('❌ JWT Auth: Sign in failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      };
    }
  }

  /**
   * Get current user from JWT token
   */
  static async getCurrentUser(): Promise<JWTPayload | null> {
    return await BrowserJWTService.getCurrentUser();
  }

  /**
   * Refresh JWT tokens
   */
  static async refreshTokens(): Promise<JWTAuthResponse> {
    try {
      const refreshToken = localStorage.getItem('jwt_refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const decoded = await this.verifyRefreshToken(refreshToken);
      if (!decoded) {
        throw new Error('Invalid refresh token');
      }

      // Get fresh user data from database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (profileError) {
        throw new Error('Failed to refresh user profile');
      }

      // Get client data separately if user has a client_id
      let clientData = null;
      if (profileData.client_id) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', profileData.client_id)
          .single();

        if (!clientError && client) {
          clientData = client;
        }
      }

      // Create new JWT payload
      const jwtPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: profileData.id,
        email: profileData.email,
        role: profileData.role as 'admin' | 'client' | 'user',
        full_name: profileData.full_name,
        client_id: profileData.client_id || undefined,
        client_name: clientData?.company_name || undefined
      };

      // Generate new tokens
      const tokens = await this.generateTokens(jwtPayload);

      // Update stored tokens
      localStorage.setItem('jwt_access_token', tokens.accessToken);
      localStorage.setItem('jwt_refresh_token', tokens.refreshToken);
      localStorage.setItem('jwt_expires_at', tokens.expiresIn.toString());

      console.log('✅ JWT tokens refreshed');

      return {
        success: true,
        user: { ...jwtPayload, iat: Math.floor(Date.now() / 1000), exp: tokens.expiresIn },
        tokens
      };

    } catch (error) {
      console.error('❌ JWT token refresh failed:', error);
      this.clearTokens();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed'
      };
    }
  }

  /**
   * Sign out and clear JWT tokens
   */
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      // Clear JWT tokens
      this.clearTokens();

      // Also sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Supabase sign out warning:', error);
      }

      console.log('✅ JWT Auth: Sign out successful');

      return { success: true };
    } catch (error) {
      console.error('❌ JWT Auth: Sign out failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      };
    }
  }

  /**
   * Clear stored JWT tokens
   */
  static clearTokens(): void {
    BrowserJWTService.clearTokens();
  }

  /**
   * Check if JWT token is expired
   */
  static isTokenExpired(): boolean {
    return BrowserJWTService.isTokenExpired();
  }

  /**
   * Get JWT token for API requests
   */
  static getAuthHeader(): { Authorization: string } | {} {
    return BrowserJWTService.getAuthHeader();
  }
}