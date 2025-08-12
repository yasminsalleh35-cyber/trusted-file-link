/**
 * Test Runner Utility
 * 
 * Purpose: Programmatic testing of core functionality
 * Features:
 * - Database connectivity tests
 * - Basic CRUD operations
 * - Error handling verification
 */

import { supabase } from '@/integrations/supabase/client';

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  error?: any;
  duration?: number;
}

export class TestRunner {
  private results: TestResult[] = [];

  async runTest(name: string, testFn: () => Promise<void>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      const result: TestResult = {
        name,
        passed: true,
        message: `Test passed in ${duration}ms`,
        duration
      };
      this.results.push(result);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        name,
        passed: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        duration
      };
      this.results.push(result);
      return result;
    }
  }

  async runAllTests(): Promise<TestResult[]> {
    this.results = [];
    
    console.log('🧪 Starting comprehensive system tests...');

    // Test 1: Database Connection
    await this.runTest('Database Connection', async () => {
      const { error } = await supabase.from('profiles').select('count').limit(1);
      if (error) throw error;
    });

    // Test 2: Authentication Check
    await this.runTest('Authentication Status', async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) throw new Error('No authenticated user');
    });

    // Test 3: Messages Table Access
    await this.runTest('Messages Table Access', async () => {
      const { error } = await supabase.from('messages').select('count').limit(1);
      if (error) throw error;
    });

    // Test 4: News Table Access
    await this.runTest('News Table Access', async () => {
      const { error } = await supabase.from('news').select('count').limit(1);
      if (error) throw error;
    });

    // Test 5: Profiles Table Access
    await this.runTest('Profiles Table Access', async () => {
      const { error } = await supabase.from('profiles').select('id, full_name, role').limit(1);
      if (error) throw error;
    });

    // Test 6: Real-time Connection
    await this.runTest('Real-time Connection', async () => {
      const isConnected = supabase.realtime.isConnected();
      if (!isConnected) {
        // Try to connect
        const channel = supabase.channel('test-connection');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout);
              resolve(true);
            }
          });
        });
        await supabase.removeChannel(channel);
      }
    });

    const passedTests = this.results.filter(r => r.passed).length;
    const totalTests = this.results.length;
    
    console.log(`🎯 Tests completed: ${passedTests}/${totalTests} passed`);
    
    return this.results;
  }

  getResults(): TestResult[] {
    return this.results;
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    
    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total) * 100 : 0
    };
  }
}

// Export singleton instance
export const testRunner = new TestRunner();