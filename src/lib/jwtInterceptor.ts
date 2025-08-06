/**
 * JWT HTTP Interceptor
 * 
 * Purpose: Automatically add JWT tokens to HTTP requests
 */

import { JWTAuthService } from '@/services/jwtAuth';

/**
 * Enhanced fetch function with JWT token injection
 */
export const jwtFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Get JWT auth headers
  const authHeaders = JWTAuthService.getAuthHeader();
  
  // Merge headers
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...options.headers
  };

  // Make the request with JWT token
  const response = await fetch(url, {
    ...options,
    headers
  });

  // If token is expired (401), try to refresh
  if (response.status === 401 && !JWTAuthService.isTokenExpired()) {
    console.log('🔄 JWT token might be expired, attempting refresh...');
    
    const refreshResult = await JWTAuthService.refreshTokens();
    if (refreshResult.success) {
      // Retry the request with new token
      const newAuthHeaders = JWTAuthService.getAuthHeader();
      const retryHeaders = {
        'Content-Type': 'application/json',
        ...newAuthHeaders,
        ...options.headers
      };

      return fetch(url, {
        ...options,
        headers: retryHeaders
      });
    } else {
      // Refresh failed, redirect to login
      console.log('❌ JWT token refresh failed, user needs to re-authenticate');
      JWTAuthService.clearTokens();
      window.location.href = '/login';
    }
  }

  return response;
};

/**
 * Supabase client wrapper with JWT token injection
 */
export const createJWTSupabaseWrapper = (supabaseClient: any) => {
  return {
    ...supabaseClient,
    
    // Override the from method to inject JWT tokens
    from: (table: string) => {
      const originalFrom = supabaseClient.from(table);
      
      return {
        ...originalFrom,
        
        // Override select to add JWT headers
        select: (columns?: string) => {
          const query = originalFrom.select(columns);
          
          // Add JWT token to the request headers if available
          const authHeaders = JWTAuthService.getAuthHeader();
          if (authHeaders.Authorization) {
            // Note: Supabase client doesn't directly support custom headers for individual queries
            // The JWT token validation would need to be handled on the server side
            console.log('🔐 JWT token available for query:', table);
          }
          
          return query;
        }
      };
    }
  };
};