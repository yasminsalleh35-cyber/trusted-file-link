/**
 * JWT Debug Panel Component
 * 
 * Purpose: Display JWT token information for debugging and verification
 * This component shows JWT token details when user is authenticated
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JWTAuthService } from '@/services/jwtAuth';
import { testJWTAPI, testJWTRefresh, validateJWTStructure } from '@/lib/apiTest';
import { testBase64url, testJWTStructure } from '@/utils/testBase64url';
import { debugAuthState, testTokenGeneration } from '@/utils/debugAuth';
import { Eye, EyeOff, RefreshCw, Copy, Check, TestTube } from 'lucide-react';

export const JWTDebugPanel: React.FC = () => {
  const [showTokens, setShowTokens] = useState(false);
  const [jwtUser, setJwtUser] = useState<any>(null);
  const [tokens, setTokens] = useState<{
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any>(null);

  const loadJWTInfo = () => {
    const user = JWTAuthService.getCurrentUser();
    const accessToken = localStorage.getItem('jwt_access_token') || '';
    const refreshToken = localStorage.getItem('jwt_refresh_token') || '';
    const expiresAt = localStorage.getItem('jwt_expires_at') || '';

    setJwtUser(user);
    setTokens({
      accessToken,
      refreshToken,
      expiresAt
    });
  };

  useEffect(() => {
    loadJWTInfo();
  }, []);

  const handleRefreshTokens = async () => {
    const result = await JWTAuthService.refreshTokens();
    if (result.success) {
      loadJWTInfo();
    }
  };

  const runJWTTests = async () => {
    try {
      console.log('🧪 Running JWT tests...');
      
      // Run base64url tests first
      const base64Test = testBase64url();
      const jwtStructureTest = testJWTStructure();
      
      const apiTest = await testJWTAPI();
      const refreshTest = await testJWTRefresh();
      const structureTest = validateJWTStructure();
      
      setTestResults({
        base64Test,
        jwtStructureTest,
        apiTest,
        refreshTest,
        structureTest,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ All JWT tests completed');
    } catch (error) {
      console.error('❌ JWT tests failed:', error);
      setTestResults({
        error: error instanceof Error ? error.message : 'Test failed',
        timestamp: new Date().toISOString()
      });
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatToken = (token: string) => {
    if (!token) return 'No token';
    return `${token.substring(0, 20)}...${token.substring(token.length - 20)}`;
  };

  const isTokenExpired = () => {
    if (!tokens?.expiresAt) return true;
    const now = Math.floor(Date.now() / 1000);
    return now >= parseInt(tokens.expiresAt);
  };

  if (!jwtUser) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔐 JWT Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">No JWT Token Found</Badge>
          <p className="text-sm text-muted-foreground mt-2">
            User is not authenticated with JWT tokens
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔐 JWT Authentication Status
          <Badge variant={isTokenExpired() ? "destructive" : "default"}>
            {isTokenExpired() ? "Expired" : "Active"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Information */}
        <div>
          <h4 className="font-medium mb-2">User Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Email:</strong> {jwtUser.email}</div>
            <div><strong>Role:</strong> <Badge variant="outline">{jwtUser.role}</Badge></div>
            <div><strong>Name:</strong> {jwtUser.full_name}</div>
            <div><strong>User ID:</strong> {jwtUser.userId}</div>
            {jwtUser.client_id && (
              <>
                <div><strong>Client ID:</strong> {jwtUser.client_id}</div>
                <div><strong>Client Name:</strong> {jwtUser.client_name}</div>
              </>
            )}
          </div>
        </div>

        {/* Token Information */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Token Information</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTokens(!showTokens)}
              >
                {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showTokens ? 'Hide' : 'Show'} Tokens
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshTokens}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={runJWTTests}
              >
                <TestTube className="w-4 h-4" />
                Test API
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={debugAuthState}
              >
                🔍 Debug Auth
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={testTokenGeneration}
              >
                🧪 Test Tokens
              </Button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <strong>Expires At:</strong> {
                tokens?.expiresAt 
                  ? new Date(parseInt(tokens.expiresAt) * 1000).toLocaleString()
                  : 'Unknown'
              }
            </div>
            <div>
              <strong>Is Expired:</strong> {
                isTokenExpired() 
                  ? <Badge variant="destructive">Yes</Badge>
                  : <Badge variant="default">No</Badge>
              }
            </div>
          </div>

          {showTokens && tokens && (
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-sm">Access Token:</strong>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(tokens.accessToken, 'access')}
                  >
                    {copied === 'access' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <code className="block p-2 bg-muted rounded text-xs break-all">
                  {formatToken(tokens.accessToken)}
                </code>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-sm">Refresh Token:</strong>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(tokens.refreshToken, 'refresh')}
                  >
                    {copied === 'refresh' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <code className="block p-2 bg-muted rounded text-xs break-all">
                  {formatToken(tokens.refreshToken)}
                </code>
              </div>
            </div>
          )}
        </div>

        {/* JWT Features */}
        <div>
          <h4 className="font-medium mb-2">JWT Features Active</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">✅ Token Generation</Badge>
            <Badge variant="outline">✅ Token Validation</Badge>
            <Badge variant="outline">✅ Auto Refresh</Badge>
            <Badge variant="outline">✅ Secure Storage</Badge>
            <Badge variant="outline">✅ Role-based Access</Badge>
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div>
            <h4 className="font-medium mb-2">Test Results</h4>
            <div className="space-y-2">
              {testResults.error ? (
                <Badge variant="destructive">❌ Tests Failed: {testResults.error}</Badge>
              ) : (
                <div className="space-y-1">
                  <Badge variant="default">✅ Base64 Test: {testResults.base64Test?.allPassed ? 'Passed' : 'Failed'}</Badge>
                  <Badge variant="default">✅ JWT Structure Test: {testResults.jwtStructureTest?.success ? 'Passed' : 'Failed'}</Badge>
                  <Badge variant="default">✅ API Test: {testResults.apiTest?.success ? 'Passed' : 'Failed'}</Badge>
                  <Badge variant="default">✅ Refresh Test: {testResults.refreshTest?.success ? 'Passed' : 'Failed'}</Badge>
                  <Badge variant="default">✅ Structure Test: {testResults.structureTest?.success ? 'Passed' : 'Failed'}</Badge>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Last run: {new Date(testResults.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};