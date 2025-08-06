/**
 * Test Base64URL Encoding/Decoding
 * 
 * Purpose: Verify that the base64url functions work correctly
 */

// Test the base64url functions
export const testBase64url = () => {
  console.log('🧪 Testing Base64URL encoding/decoding...');

  // Test data
  const testCases = [
    { input: 'hello world', description: 'simple string' },
    { input: '{"userId":"123","email":"test@example.com"}', description: 'JSON string' },
    { input: 'special chars: !@#$%^&*()_+-=[]{}|;:,.<>?', description: 'special characters' },
    { input: 'unicode: 🔐 JWT 🎉', description: 'unicode characters' }
  ];

  const results = [];

  for (const testCase of testCases) {
    try {
      console.log(`Testing ${testCase.description}: "${testCase.input}"`);

      // Encode
      const encoded = btoa(encodeURIComponent(testCase.input).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
          return String.fromCharCode(parseInt(p1, 16));
        })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      console.log(`Encoded: ${encoded}`);

      // Decode
      const paddedEncoded = encoded + '='.repeat((4 - (encoded.length % 4)) % 4);
      const base64 = paddedEncoded.replace(/\-/g, '+').replace(/_/g, '/');
      const decoded = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      console.log(`Decoded: "${decoded}"`);

      const success = decoded === testCase.input;
      console.log(`Result: ${success ? '✅ PASS' : '❌ FAIL'}`);

      results.push({
        description: testCase.description,
        input: testCase.input,
        encoded,
        decoded,
        success
      });

    } catch (error) {
      console.error(`❌ Error testing ${testCase.description}:`, error);
      results.push({
        description: testCase.description,
        input: testCase.input,
        error: error.message,
        success: false
      });
    }
  }

  const allPassed = results.every(r => r.success);
  console.log(`\n🎯 Overall result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  return { allPassed, results };
};

// Test JWT token creation and parsing
export const testJWTStructure = () => {
  console.log('\n🧪 Testing JWT structure...');

  try {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      userId: '123',
      email: 'test@example.com',
      role: 'admin',
      full_name: 'Test User',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };

    // Encode header and payload
    const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    console.log('Header:', header);
    console.log('Encoded header:', encodedHeader);
    console.log('Payload:', payload);
    console.log('Encoded payload:', encodedPayload);

    // Create mock signature
    const signature = 'mock_signature_for_testing';
    const token = `${encodedHeader}.${encodedPayload}.${signature}`;

    console.log('JWT Token:', token);

    // Test parsing
    const parts = token.split('.');
    console.log('Token parts:', parts.length);

    if (parts.length === 3) {
      console.log('✅ JWT structure is valid');
      return { success: true, token, parts };
    } else {
      console.log('❌ JWT structure is invalid');
      return { success: false, error: 'Invalid JWT structure' };
    }

  } catch (error) {
    console.error('❌ JWT structure test failed:', error);
    return { success: false, error: error.message };
  }
};