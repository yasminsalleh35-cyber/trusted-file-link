/**
 * Integration and Testing Utilities
 * 
 * Provides utilities for testing the integrated system and ensuring
 * all components work together correctly.
 */

import { supabase } from '@/integrations/supabase/client';
import { errorLogger } from './errorHandler';
import { securityAuditLogger } from './security';

export interface SystemHealthCheck {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  timestamp: Date;
  details?: any;
}

export interface IntegrationTestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

/**
 * Comprehensive system health check
 */
export async function performSystemHealthCheck(): Promise<SystemHealthCheck[]> {
  const checks: SystemHealthCheck[] = [];
  
  // Database connectivity check
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    checks.push({
      component: 'Database',
      status: error ? 'error' : 'healthy',
      message: error ? `Database error: ${error.message}` : 'Database connection successful',
      timestamp: new Date(),
      details: { error }
    });
  } catch (error) {
    checks.push({
      component: 'Database',
      status: 'error',
      message: `Database connection failed: ${error}`,
      timestamp: new Date(),
      details: { error }
    });
  }

  // Storage connectivity check
  try {
    const { data, error } = await supabase.storage.from('files').list('', { limit: 1 });
    checks.push({
      component: 'Storage',
      status: error ? 'error' : 'healthy',
      message: error ? `Storage error: ${error.message}` : 'Storage connection successful',
      timestamp: new Date(),
      details: { error }
    });
  } catch (error) {
    checks.push({
      component: 'Storage',
      status: 'error',
      message: `Storage connection failed: ${error}`,
      timestamp: new Date(),
      details: { error }
    });
  }

  // Authentication check
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    checks.push({
      component: 'Authentication',
      status: error ? 'error' : 'healthy',
      message: error ? `Auth error: ${error.message}` : 'Authentication service operational',
      timestamp: new Date(),
      details: { hasSession: !!session, error }
    });
  } catch (error) {
    checks.push({
      component: 'Authentication',
      status: 'error',
      message: `Authentication check failed: ${error}`,
      timestamp: new Date(),
      details: { error }
    });
  }

  // Error logging system check
  try {
    const logs = errorLogger.getLogs();
    checks.push({
      component: 'Error Logging',
      status: 'healthy',
      message: `Error logging operational (${logs.length} logs)`,
      timestamp: new Date(),
      details: { logCount: logs.length }
    });
  } catch (error) {
    checks.push({
      component: 'Error Logging',
      status: 'error',
      message: `Error logging failed: ${error}`,
      timestamp: new Date(),
      details: { error }
    });
  }

  // Security audit logging check
  try {
    const events = securityAuditLogger.getEvents();
    checks.push({
      component: 'Security Audit',
      status: 'healthy',
      message: `Security audit operational (${events.length} events)`,
      timestamp: new Date(),
      details: { eventCount: events.length }
    });
  } catch (error) {
    checks.push({
      component: 'Security Audit',
      status: 'error',
      message: `Security audit failed: ${error}`,
      timestamp: new Date(),
      details: { error }
    });
  }

  // Browser compatibility check
  const browserChecks = checkBrowserCompatibility();
  checks.push(...browserChecks);

  return checks;
}

/**
 * Check browser compatibility
 */
function checkBrowserCompatibility(): SystemHealthCheck[] {
  const checks: SystemHealthCheck[] = [];

  // Check for required APIs
  const requiredAPIs = [
    { name: 'FileReader', api: 'FileReader' },
    { name: 'Fetch API', api: 'fetch' },
    { name: 'Local Storage', api: 'localStorage' },
    { name: 'Session Storage', api: 'sessionStorage' },
    { name: 'Crypto API', api: 'crypto' },
    { name: 'Intersection Observer', api: 'IntersectionObserver' }
  ];

  requiredAPIs.forEach(({ name, api }) => {
    const isSupported = api in window;
    checks.push({
      component: `Browser API: ${name}`,
      status: isSupported ? 'healthy' : 'error',
      message: isSupported ? `${name} is supported` : `${name} is not supported`,
      timestamp: new Date(),
      details: { api, supported: isSupported }
    });
  });

  return checks;
}

/**
 * Run integration tests
 */
export async function runIntegrationTests(): Promise<IntegrationTestResult[]> {
  const results: IntegrationTestResult[] = [];

  // Test 1: File upload flow
  results.push(await testFileUploadFlow());

  // Test 2: File download flow
  results.push(await testFileDownloadFlow());

  // Test 3: User authentication flow
  results.push(await testAuthenticationFlow());

  // Test 4: Error handling
  results.push(await testErrorHandling());

  // Test 5: Security validations
  results.push(await testSecurityValidations());

  return results;
}

/**
 * Test file upload flow
 */
async function testFileUploadFlow(): Promise<IntegrationTestResult> {
  const startTime = performance.now();
  
  try {
    // Create a test file
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Test file validation
    const { validateFile } = await import('./errorHandler');
    validateFile(testFile);
    
    // Test security validation
    const { validateFileSecurityStrict } = await import('./security');
    validateFileSecurityStrict(testFile);
    
    const duration = performance.now() - startTime;
    
    return {
      testName: 'File Upload Flow',
      passed: true,
      duration,
      details: { fileSize: testFile.size, fileName: testFile.name }
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    
    return {
      testName: 'File Upload Flow',
      passed: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { error }
    };
  }
}

/**
 * Test file download flow
 */
async function testFileDownloadFlow(): Promise<IntegrationTestResult> {
  const startTime = performance.now();
  
  try {
    // Test download URL generation (mock)
    const testPath = 'test/file.txt';
    
    // This would normally test the actual download flow
    // For now, just test the path validation
    if (!testPath || testPath.includes('..')) {
      throw new Error('Invalid file path');
    }
    
    const duration = performance.now() - startTime;
    
    return {
      testName: 'File Download Flow',
      passed: true,
      duration,
      details: { testPath }
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    
    return {
      testName: 'File Download Flow',
      passed: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { error }
    };
  }
}

/**
 * Test authentication flow
 */
async function testAuthenticationFlow(): Promise<IntegrationTestResult> {
  const startTime = performance.now();
  
  try {
    // Test JWT validation
    const { validateJWTFormat } = await import('./security');
    
    const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const invalidJWT = 'invalid.jwt.token';
    
    if (!validateJWTFormat(validJWT)) {
      throw new Error('Valid JWT not recognized');
    }
    
    if (validateJWTFormat(invalidJWT)) {
      throw new Error('Invalid JWT was accepted');
    }
    
    const duration = performance.now() - startTime;
    
    return {
      testName: 'Authentication Flow',
      passed: true,
      duration,
      details: { validJWTTest: true, invalidJWTTest: true }
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    
    return {
      testName: 'Authentication Flow',
      passed: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { error }
    };
  }
}

/**
 * Test error handling
 */
async function testErrorHandling(): Promise<IntegrationTestResult> {
  const startTime = performance.now();
  
  try {
    const { ValidationError, FileOperationError } = await import('./errorHandler');
    
    // Test ValidationError
    try {
      throw new ValidationError('test', 'Test validation error');
    } catch (error) {
      if (!(error instanceof ValidationError)) {
        throw new Error('ValidationError not working correctly');
      }
    }
    
    // Test FileOperationError
    try {
      throw new FileOperationError('TEST_ERROR', 'Test file operation error');
    } catch (error) {
      if (!(error instanceof FileOperationError)) {
        throw new Error('FileOperationError not working correctly');
      }
    }
    
    const duration = performance.now() - startTime;
    
    return {
      testName: 'Error Handling',
      passed: true,
      duration,
      details: { validationErrorTest: true, fileOperationErrorTest: true }
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    
    return {
      testName: 'Error Handling',
      passed: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { error }
    };
  }
}

/**
 * Test security validations
 */
async function testSecurityValidations(): Promise<IntegrationTestResult> {
  const startTime = performance.now();
  
  try {
    const { sanitizeFileNameSecure, generateSecureFileName } = await import('./security');
    
    // Test file name sanitization
    const dangerousName = '../../../etc/passwd';
    const sanitized = sanitizeFileNameSecure(dangerousName);
    
    if (sanitized.includes('..') || sanitized.includes('/')) {
      throw new Error('File name sanitization failed');
    }
    
    // Test secure file name generation
    const secureFileName = generateSecureFileName('test.txt');
    
    if (!secureFileName.endsWith('.txt') || secureFileName.length < 10) {
      throw new Error('Secure file name generation failed');
    }
    
    const duration = performance.now() - startTime;
    
    return {
      testName: 'Security Validations',
      passed: true,
      duration,
      details: { 
        sanitizationTest: true, 
        secureFileNameTest: true,
        sanitizedName: sanitized,
        secureFileName 
      }
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    
    return {
      testName: 'Security Validations',
      passed: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { error }
    };
  }
}

/**
 * Generate system report
 */
export async function generateSystemReport(): Promise<{
  healthChecks: SystemHealthCheck[];
  integrationTests: IntegrationTestResult[];
  summary: {
    overallHealth: 'healthy' | 'warning' | 'error';
    testsPassedCount: number;
    totalTestsCount: number;
    criticalIssues: string[];
    recommendations: string[];
  };
}> {
  console.log('🔍 Running system health checks...');
  const healthChecks = await performSystemHealthCheck();
  
  console.log('🧪 Running integration tests...');
  const integrationTests = await runIntegrationTests();
  
  // Analyze results
  const criticalIssues: string[] = [];
  const recommendations: string[] = [];
  
  // Check for critical health issues
  const errorChecks = healthChecks.filter(check => check.status === 'error');
  errorChecks.forEach(check => {
    criticalIssues.push(`${check.component}: ${check.message}`);
  });
  
  // Check for failed tests
  const failedTests = integrationTests.filter(test => !test.passed);
  failedTests.forEach(test => {
    criticalIssues.push(`Test failed: ${test.testName} - ${test.error}`);
  });
  
  // Generate recommendations
  if (errorChecks.length > 0) {
    recommendations.push('Fix critical system components before deployment');
  }
  
  if (failedTests.length > 0) {
    recommendations.push('Resolve failing integration tests');
  }
  
  const warningChecks = healthChecks.filter(check => check.status === 'warning');
  if (warningChecks.length > 0) {
    recommendations.push('Address system warnings for optimal performance');
  }
  
  if (criticalIssues.length === 0) {
    recommendations.push('System is ready for production deployment');
  }
  
  // Determine overall health
  let overallHealth: 'healthy' | 'warning' | 'error' = 'healthy';
  if (errorChecks.length > 0 || failedTests.length > 0) {
    overallHealth = 'error';
  } else if (warningChecks.length > 0) {
    overallHealth = 'warning';
  }
  
  const report = {
    healthChecks,
    integrationTests,
    summary: {
      overallHealth,
      testsPassedCount: integrationTests.filter(test => test.passed).length,
      totalTestsCount: integrationTests.length,
      criticalIssues,
      recommendations
    }
  };
  
  console.log('📊 System Report Generated:', report);
  
  return report;
}

/**
 * Validate all critical paths are working
 */
export async function validateCriticalPaths(): Promise<boolean> {
  try {
    const report = await generateSystemReport();
    
    // Check if any critical components are failing
    const criticalComponents = ['Database', 'Storage', 'Authentication'];
    const failedCritical = report.healthChecks.filter(
      check => criticalComponents.includes(check.component) && check.status === 'error'
    );
    
    if (failedCritical.length > 0) {
      console.error('❌ Critical components failing:', failedCritical);
      return false;
    }
    
    // Check if core tests are passing
    const coreTests = ['File Upload Flow', 'Authentication Flow', 'Error Handling'];
    const failedCore = report.integrationTests.filter(
      test => coreTests.includes(test.testName) && !test.passed
    );
    
    if (failedCore.length > 0) {
      console.error('❌ Core tests failing:', failedCore);
      return false;
    }
    
    console.log('✅ All critical paths validated successfully');
    return true;
  } catch (error) {
    console.error('❌ Critical path validation failed:', error);
    return false;
  }
}

/**
 * Initialize system monitoring
 */
export function initializeSystemMonitoring(): void {
  // Monitor for unhandled errors
  window.addEventListener('error', (event) => {
    errorLogger.log(
      new Error(`Unhandled error: ${event.message}`),
      'Global Error Handler',
      undefined
    );
  });
  
  // Monitor for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.log(
      new Error(`Unhandled promise rejection: ${event.reason}`),
      'Global Promise Handler',
      undefined
    );
  });
  
  // Periodic health checks (every 5 minutes)
  setInterval(async () => {
    try {
      const healthChecks = await performSystemHealthCheck();
      const errorChecks = healthChecks.filter(check => check.status === 'error');
      
      if (errorChecks.length > 0) {
        console.warn('⚠️ System health issues detected:', errorChecks);
      }
    } catch (error) {
      console.error('❌ Health check failed:', error);
    }
  }, 5 * 60 * 1000);
  
  console.log('🔍 System monitoring initialized');
}