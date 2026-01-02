#!/usr/bin/env node
/**
 * Test Login Functionality
 * 
 * This script tests various login scenarios to verify the improvements:
 * 1. Case-insensitive email lookup
 * 2. Email trimming
 * 3. Error message improvements
 * 4. Input validation
 */

// Native fetch is available in Node.js 18+
// No external dependencies needed

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testLogin(email, password, description) {
  log(`\n📝 Testing: ${description}`, 'blue');
  log(`   Email: "${email}"`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      log(`✅ Success! User: ${data.user?.email}`, 'green');
      return { success: true, data };
    } else {
      log(`❌ Failed with status ${response.status}`, 'red');
      log(`   Error: ${data.error}`);
      if (data.hint) {
        log(`   Hint: ${data.hint}`, 'yellow');
      }
      return { success: false, error: data.error, hint: data.hint };
    }
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('🚀 Starting Login Tests', 'blue');
  log(`   API URL: ${BASE_URL}`);
  
  const testCases = [
    // Test case-insensitive email
    {
      email: 'demo@stylora.no',
      password: 'demo123',
      description: 'Standard login (lowercase)',
    },
    {
      email: 'DEMO@STYLORA.NO',
      password: 'demo123',
      description: 'Case-insensitive email (uppercase)',
    },
    {
      email: 'Demo@Stylora.No',
      password: 'demo123',
      description: 'Case-insensitive email (mixed case)',
    },
    
    // Test email trimming
    {
      email: '  demo@stylora.no  ',
      password: 'demo123',
      description: 'Email with whitespace',
    },
    
    // Test invalid scenarios
    {
      email: 'nonexistent@example.com',
      password: 'password123',
      description: 'Non-existent email',
    },
    {
      email: 'demo@stylora.no',
      password: 'wrongpassword',
      description: 'Wrong password',
    },
    {
      email: 'invalid-email',
      password: 'password123',
      description: 'Invalid email format',
    },
    {
      email: '',
      password: 'password123',
      description: 'Empty email',
    },
    {
      email: 'demo@stylora.no',
      password: '',
      description: 'Empty password',
    },
  ];

  const results = [];
  
  for (const testCase of testCases) {
    const result = await testLogin(
      testCase.email,
      testCase.password,
      testCase.description
    );
    results.push({ ...testCase, result });
    
    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  log('\n📊 Test Summary', 'blue');
  log('─'.repeat(50));
  
  const successful = results.filter(r => r.result.success).length;
  const failed = results.filter(r => !r.result.success).length;
  
  log(`✅ Successful: ${successful}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  log(`📝 Total: ${results.length}`, 'blue');
  
  // Expected results
  log('\n📋 Expected Results:', 'blue');
  log('   - First 4 tests should succeed (case-insensitive, trimming)');
  log('   - Remaining 5 tests should fail with helpful error messages');
  
  return results;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  log('═'.repeat(60), 'blue');
  log('  Login Functionality Test Suite', 'blue');
  log('═'.repeat(60), 'blue');
  
  runTests()
    .then(() => {
      log('\n✨ Tests completed!', 'green');
      process.exit(0);
    })
    .catch((error) => {
      log(`\n❌ Test suite failed: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    });
}

export { testLogin, runTests };
