/**
 * API Test Utilities
 * 
 * Purpose: Test JWT token integration with API calls
 */

import { JWTAuthService } from '@/services/jwtAuth';
import { jwtFetch } from '@/lib/jwtInterceptor';

/**
 * Test JWT token with a mock API call
 */
export const testJWTAPI = async () => {
  try {
    console.log('🧪 Testing JWT API integration...');

    // Get current JWT user
    const jwtUser = JWTAuthService.getCurrentUser();
    if (!jwtUser) {
      throw new Error('No JWT user found');
    }

    console.log('✅ JWT User found:', jwtUser.email);

    // Get auth headers
    const authHeaders = JWTAuthService.getAuthHeader();
    console.log('🔐 Auth headers:', authHeaders);

    // Test with a mock endpoint (this would be your actual API)
    const mockApiResponse = {
      success: true,
      message: 'JWT token validated successfully',
      user: jwtUser,
      timestamp: new Date().toISOString(),
      tokenInfo: {
        hasToken: !!authHeaders.Authorization,
        tokenPrefix: authHeaders.Authorization ? authHeaders.Authorization.substring(0, 20) + '...' : 'No token'
      }
    };

    console.log('✅ Mock API response:', mockApiResponse);

    return mockApiResponse;

  } catch (error) {
    console.error('❌ JWT API test failed:', error);
    throw error;
  }
};

/**
 * Test JWT token refresh functionality
 */
export const testJWTRefresh = async () => {
  try {
    console.log('🔄 Testing JWT token refresh...');

    const refreshResult = await JWTAuthService.refreshTokens();
    
    if (refreshResult.success) {
      console.log('✅ JWT token refresh successful');
      return {
        success: true,
        message: 'Token refreshed successfully',
        user: refreshResult.user
      };
    } else {
      throw new Error(refreshResult.error || 'Token refresh failed');
    }

  } catch (error) {
    console.error('❌ JWT refresh test failed:', error);
    throw error;
  }
};

/**
 * Validate JWT token structure and claims
 */
export const validateJWTStructure = () => {
  try {
    console.log('🔍 Validating JWT token structure...');

    const jwtUser = JWTAuthService.getCurrentUser();
    if (!jwtUser) {
      throw new Error('No JWT user found');
    }

    // Check required fields
    const requiredFields = ['userId', 'email', 'role', 'full_name'];
    const missingFields = requiredFields.filter(field => !jwtUser[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required JWT fields: ${missingFields.join(', ')}`);
    }

    // Check token expiration
    const isExpired = JWTAuthService.isTokenExpired();
    
    console.log('✅ JWT structure validation passed');

    return {
      success: true,
      message: 'JWT structure is valid',
      claims: jwtUser,
      isExpired,
      validation: {
        hasRequiredFields: missingFields.length === 0,
        isExpired,
        tokenAge: jwtUser.iat ? Math.floor(Date.now() / 1000) - jwtUser.iat : 'Unknown'
      }
    };

  } catch (error) {
    console.error('❌ JWT structure validation failed:', error);
    throw error;
  }
};