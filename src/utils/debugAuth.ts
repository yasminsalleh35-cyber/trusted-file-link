/**
 * Debug Authentication Flow
 * 
 * Purpose: Help diagnose authentication issues
 */

import { JWTAuthService } from '@/services/jwtAuth';
import { BrowserJWTService } from '@/services/browserJWT';

export const debugAuthState = async () => {
  console.log('🔍 === AUTH DEBUG START ===');
  
  // Check localStorage
  const accessToken = localStorage.getItem('jwt_access_token');
  const refreshToken = localStorage.getItem('jwt_refresh_token');
  const expiresAt = localStorage.getItem('jwt_expires_at');
  
  console.log('📦 LocalStorage tokens:');
  console.log('  - Access token:', accessToken ? 'EXISTS' : 'MISSING');
  console.log('  - Refresh token:', refreshToken ? 'EXISTS' : 'MISSING');
  console.log('  - Expires at:', expiresAt);
  
  if (accessToken) {
    console.log('🔍 Access token details:');
    console.log('  - Length:', accessToken.length);
    console.log('  - Parts:', accessToken.split('.').length);
    
    // Try to decode manually
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const [header, payload, signature] = parts;
        console.log('  - Header length:', header.length);
        console.log('  - Payload length:', payload.length);
        console.log('  - Signature length:', signature.length);
        
        // Try to decode payload
        try {
          const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
          const base64 = paddedPayload.replace(/\-/g, '+').replace(/_/g, '/');
          const decoded = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const payloadObj = JSON.parse(decoded);
          console.log('  - Decoded payload:', payloadObj);
        } catch (decodeError) {
          console.error('  - Payload decode error:', decodeError);
        }
      }
    } catch (error) {
      console.error('  - Token parsing error:', error);
    }
  }
  
  // Check JWT service methods
  console.log('🔍 JWT Service checks:');
  
  try {
    const isExpired = JWTAuthService.isTokenExpired();
    console.log('  - Is token expired:', isExpired);
  } catch (error) {
    console.error('  - Error checking expiration:', error);
  }
  
  try {
    const currentUser = await JWTAuthService.getCurrentUser();
    console.log('  - Current user:', currentUser ? 'FOUND' : 'NULL');
    if (currentUser) {
      console.log('    - User ID:', currentUser.userId);
      console.log('    - Email:', currentUser.email);
      console.log('    - Role:', currentUser.role);
    }
  } catch (error) {
    console.error('  - Error getting current user:', error);
  }
  
  // Check browser JWT service directly
  console.log('🔍 Browser JWT Service checks:');
  
  try {
    const browserUser = await BrowserJWTService.getCurrentUser();
    console.log('  - Browser current user:', browserUser ? 'FOUND' : 'NULL');
    if (browserUser) {
      console.log('    - User ID:', browserUser.userId);
      console.log('    - Email:', browserUser.email);
      console.log('    - Role:', browserUser.role);
    }
  } catch (error) {
    console.error('  - Error getting browser current user:', error);
  }
  
  try {
    const browserExpired = BrowserJWTService.isTokenExpired();
    console.log('  - Browser token expired:', browserExpired);
  } catch (error) {
    console.error('  - Error checking browser expiration:', error);
  }
  
  console.log('🔍 === AUTH DEBUG END ===');
};

export const testTokenGeneration = async () => {
  console.log('🧪 === TOKEN GENERATION TEST ===');
  
  const testPayload = {
    userId: 'test-123',
    email: 'test@example.com',
    role: 'admin' as const,
    full_name: 'Test User'
  };
  
  try {
    console.log('🔧 Generating test tokens...');
    const tokens = await BrowserJWTService.generateTokens(testPayload);
    console.log('✅ Tokens generated successfully');
    console.log('  - Access token length:', tokens.accessToken.length);
    console.log('  - Refresh token length:', tokens.refreshToken.length);
    console.log('  - Expires in:', tokens.expiresIn);
    
    // Test verification
    console.log('🔧 Testing token verification...');
    const verified = await BrowserJWTService.verifyToken(tokens.accessToken);
    console.log('✅ Token verification result:', verified ? 'SUCCESS' : 'FAILED');
    
    if (verified) {
      console.log('  - Verified user ID:', verified.userId);
      console.log('  - Verified email:', verified.email);
      console.log('  - Verified role:', verified.role);
    }
    
  } catch (error) {
    console.error('❌ Token generation test failed:', error);
  }
  
  console.log('🧪 === TOKEN GENERATION TEST END ===');
};