import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Database,
  User,
  MessageSquare,
  Newspaper,
  Wifi
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * QuickDiagnostic Component
 * 
 * Purpose: Quick health check for the messaging system
 * Features:
 * - Instant system status overview
 * - Key functionality verification
 * - Issue identification
 */

interface DiagnosticResult {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  icon: React.ReactNode;
}

export const QuickDiagnostic: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // 1. Database Connection
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1);
      diagnosticResults.push({
        name: 'Database Connection',
        status: error ? 'error' : 'ok',
        message: error ? `Connection failed: ${error.message}` : 'Connected to Supabase',
        icon: <Database className="h-4 w-4" />
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'Database Connection',
        status: 'error',
        message: 'Failed to connect to database',
        icon: <Database className="h-4 w-4" />
      });
    }

    // 2. Authentication
    diagnosticResults.push({
      name: 'Authentication',
      status: user ? 'ok' : 'error',
      message: user ? `Logged in as ${user.email} (${user.user_metadata?.role || 'unknown role'})` : 'Not authenticated',
      icon: <User className="h-4 w-4" />
    });

    // 3. Messages Table
    if (user) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id')
          .limit(1);
        
        diagnosticResults.push({
          name: 'Messages System',
          status: error ? 'error' : 'ok',
          message: error ? `Messages error: ${error.message}` : 'Messages table accessible',
          icon: <MessageSquare className="h-4 w-4" />
        });
      } catch (error) {
        diagnosticResults.push({
          name: 'Messages System',
          status: 'error',
          message: 'Cannot access messages table',
          icon: <MessageSquare className="h-4 w-4" />
        });
      }
    }

    // 4. News Table
    if (user) {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('id')
          .limit(1);
        
        diagnosticResults.push({
          name: 'News System',
          status: error ? 'error' : 'ok',
          message: error ? `News error: ${error.message}` : 'News table accessible',
          icon: <Newspaper className="h-4 w-4" />
        });
      } catch (error) {
        diagnosticResults.push({
          name: 'News System',
          status: 'error',
          message: 'Cannot access news table',
          icon: <Newspaper className="h-4 w-4" />
        });
      }
    }

    // 5. Real-time Connection
    diagnosticResults.push({
      name: 'Real-time Connection',
      status: supabase.realtime.isConnected() ? 'ok' : 'warning',
      message: supabase.realtime.isConnected() ? 'Real-time connected' : 'Real-time not connected',
      icon: <Wifi className="h-4 w-4" />
    });

    setResults(diagnosticResults);
    setIsRunning(false);
  };

  useEffect(() => {
    if (!authLoading) {
      runDiagnostic();
    }
  }, [authLoading, user]);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'ok':
        return <Badge variant="default" className="bg-green-500">OK</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500">Warning</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  const hasErrors = results.some(r => r.status === 'error');
  const hasWarnings = results.some(r => r.status === 'warning');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>System Health Check</span>
          <Button 
            onClick={runDiagnostic} 
            disabled={isRunning}
            size="sm"
            variant="outline"
          >
            {isRunning ? 'Checking...' : 'Refresh'}
          </Button>
        </CardTitle>
        <CardDescription>
          Quick diagnostic of core system functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        {results.length > 0 && (
          <Alert className={hasErrors ? 'border-red-500' : hasWarnings ? 'border-yellow-500' : 'border-green-500'}>
            <AlertDescription>
              {hasErrors ? (
                <span className="text-red-600 font-medium">
                  ❌ System has critical issues that need attention
                </span>
              ) : hasWarnings ? (
                <span className="text-yellow-600 font-medium">
                  ⚠️ System is mostly functional with minor issues
                </span>
              ) : (
                <span className="text-green-600 font-medium">
                  ✅ All core systems are functioning properly
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Diagnostic Results */}
        <div className="space-y-2">
          {results.map((result) => (
            <div key={result.name} className="flex items-center justify-between p-3 rounded border">
              <div className="flex items-center space-x-3">
                {result.icon}
                <span className="font-medium">{result.name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground max-w-md text-right">
                  {result.message}
                </span>
                {getStatusBadge(result.status)}
              </div>
            </div>
          ))}
        </div>

        {/* Loading State */}
        {isRunning && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mining-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Running diagnostic...</p>
          </div>
        )}

        {/* No Results */}
        {results.length === 0 && !isRunning && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Click "Refresh" to run diagnostic</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};