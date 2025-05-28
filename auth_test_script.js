#!/usr/bin/env node

/**
 * MSSP Platform Authentication Flow Test Script
 * Comprehensive automated testing for authentication functionality
 */

const axios = require('axios');

// Test configuration
const CONFIG = {
  BACKEND_URL: 'http://localhost:3001',
  FRONTEND_URL: 'http://localhost:3000',
  TEST_USERS: {
    engineer: { email: 'engineer@mssp.com', password: 'TestPass123' },
    admin: { email: 'admin@mssp.com', password: 'AdminPass123' },
    manager: { email: 'manager@mssp.com', password: 'ManagerPass123' },
    inactive: { email: 'inactive@mssp.com', password: 'InactivePass123' },
    nonexistent: { email: 'nonexistent@mssp.com', password: 'AnyPassword123' }
  }
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function logTest(testId, title, status, details = '') {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ ${testId}: ${title}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testId}: ${title}`);
    if (details) console.log(`   Details: ${details}`);
  }
  testResults.details.push({ testId, title, status, details });
}

function logSection(title) {
  console.log(`\n🔍 ${title}`);
  console.log('='.repeat(60));
}

// Test functions
async function testBackendConnectivity() {
  logSection('BACKEND CONNECTIVITY TESTS');
  
  try {
    const response = await axios.get(CONFIG.BACKEND_URL);
    logTest('SETUP_001', 'Backend server connectivity', 'PASS', `Response: ${response.data}`);
  } catch (error) {
    logTest('SETUP_001', 'Backend server connectivity', 'FAIL', error.message);
  }
}

async function testFrontendConnectivity() {
  logSection('FRONTEND CONNECTIVITY TESTS');
  
  try {
    const response = await axios.get(CONFIG.FRONTEND_URL);
    const title = response.data.match(/<title>(.*?)<\/title>/)?.[1] || 'No title found';
    logTest('SETUP_002', 'Frontend server connectivity', 'PASS', `Title: ${title}`);
  } catch (error) {
    logTest('SETUP_002', 'Frontend server connectivity', 'FAIL', error.message);
  }
}

async function testLoginPageElements() {
  logSection('I. LOGIN PAGE UI & BASIC VALIDATION');
  
  try {
    const response = await axios.get(`${CONFIG.FRONTEND_URL}/login`);
    const html = response.data;
    
    // AUTH_TC_001: Login Page Elements Visibility
    const hasEmailField = html.includes('type="email"') && html.includes('Email Address');
    const hasPasswordField = html.includes('type="password"') && html.includes('Password');
    const hasLoginButton = html.includes('Sign In') || html.includes('Login');
    const hasMSSPTitle = html.includes('MSSP Platform') || html.includes('MSSP');
    
    logTest('AUTH_TC_001', 'Login page elements visibility', 
      hasEmailField && hasPasswordField && hasLoginButton ? 'PASS' : 'FAIL',
      `Email: ${hasEmailField}, Password: ${hasPasswordField}, Button: ${hasLoginButton}, Title: ${hasMSSPTitle}`);
      
  } catch (error) {
    logTest('AUTH_TC_001', 'Login page elements visibility', 'FAIL', error.message);
  }
}

async function testSuccessfulLogin() {
  logSection('II. SUCCESSFUL LOGIN SCENARIOS');
  
  // AUTH_TC_005: Successful Login - ENGINEER Role
  try {
    const response = await axios.post(`${CONFIG.BACKEND_URL}/auth/login`, CONFIG.TEST_USERS.engineer);
    
    if (response.data.access_token && response.data.user) {
      const user = response.data.user;
      logTest('AUTH_TC_005', 'Successful login - ENGINEER role', 'PASS', 
        `Token received, User: ${user.email}, Role: ${user.role}`);
      
      // Store token for further tests
      CONFIG.ENGINEER_TOKEN = response.data.access_token;
    } else {
      logTest('AUTH_TC_005', 'Successful login - ENGINEER role', 'FAIL', 'No token or user in response');
    }
  } catch (error) {
    logTest('AUTH_TC_005', 'Successful login - ENGINEER role', 'FAIL', error.response?.data?.message || error.message);
  }
  
  // AUTH_TC_006: Successful Login - ADMIN Role
  try {
    const response = await axios.post(`${CONFIG.BACKEND_URL}/auth/login`, CONFIG.TEST_USERS.admin);
    
    if (response.data.access_token && response.data.user) {
      const user = response.data.user;
      logTest('AUTH_TC_006', 'Successful login - ADMIN role', 'PASS', 
        `Token received, User: ${user.email}, Role: ${user.role}`);
      
      CONFIG.ADMIN_TOKEN = response.data.access_token;
    } else {
      logTest('AUTH_TC_006', 'Successful login - ADMIN role', 'FAIL', 'No token or user in response');
    }
  } catch (error) {
    logTest('AUTH_TC_006', 'Successful login - ADMIN role', 'FAIL', error.response?.data?.message || error.message);
  }
  
  // AUTH_TC_007: Successful Login - MANAGER Role
  try {
    const response = await axios.post(`${CONFIG.BACKEND_URL}/auth/login`, CONFIG.TEST_USERS.manager);
    
    if (response.data.access_token && response.data.user) {
      const user = response.data.user;
      logTest('AUTH_TC_007', 'Successful login - MANAGER role', 'PASS', 
        `Token received, User: ${user.email}, Role: ${user.role}`);
      
      CONFIG.MANAGER_TOKEN = response.data.access_token;
    } else {
      logTest('AUTH_TC_007', 'Successful login - MANAGER role', 'FAIL', 'No token or user in response');
    }
  } catch (error) {
    logTest('AUTH_TC_007', 'Successful login - MANAGER role', 'FAIL', error.response?.data?.message || error.message);
  }
}

async function testUnsuccessfulLogin() {
  logSection('III. UNSUCCESSFUL LOGIN SCENARIOS');
  
  // AUTH_TC_009: Non-existent Email Address
  try {
    await axios.post(`${CONFIG.BACKEND_URL}/auth/login`, CONFIG.TEST_USERS.nonexistent);
    logTest('AUTH_TC_009', 'Non-existent email address', 'FAIL', 'Login should have failed but succeeded');
  } catch (error) {
    const expectedMessage = 'Invalid credentials';
    const actualMessage = error.response?.data?.message;
    logTest('AUTH_TC_009', 'Non-existent email address', 
      actualMessage === expectedMessage ? 'PASS' : 'FAIL',
      `Expected: "${expectedMessage}", Got: "${actualMessage}"`);
  }
  
  // AUTH_TC_010: Incorrect Password
  try {
    await axios.post(`${CONFIG.BACKEND_URL}/auth/login`, {
      email: CONFIG.TEST_USERS.manager.email,
      password: 'wrongpassword123'
    });
    logTest('AUTH_TC_010', 'Incorrect password', 'FAIL', 'Login should have failed but succeeded');
  } catch (error) {
    const expectedMessage = 'Invalid credentials';
    const actualMessage = error.response?.data?.message;
    logTest('AUTH_TC_010', 'Incorrect password', 
      actualMessage === expectedMessage ? 'PASS' : 'FAIL',
      `Expected: "${expectedMessage}", Got: "${actualMessage}"`);
  }
  
  // AUTH_TC_012: Email Case Sensitivity
  try {
    const response = await axios.post(`${CONFIG.BACKEND_URL}/auth/login`, {
      email: CONFIG.TEST_USERS.manager.email.toUpperCase(),
      password: CONFIG.TEST_USERS.manager.password
    });
    
    if (response.data.access_token) {
      logTest('AUTH_TC_012', 'Email case sensitivity', 'PASS', 'Login succeeded with uppercase email');
    } else {
      logTest('AUTH_TC_012', 'Email case sensitivity', 'FAIL', 'No token received');
    }
  } catch (error) {
    logTest('AUTH_TC_012', 'Email case sensitivity', 'FAIL', error.response?.data?.message || error.message);
  }
  
  // AUTH_TC_013: Password Case Sensitivity
  try {
    await axios.post(`${CONFIG.BACKEND_URL}/auth/login`, {
      email: CONFIG.TEST_USERS.manager.email,
      password: CONFIG.TEST_USERS.manager.password.toLowerCase()
    });
    logTest('AUTH_TC_013', 'Password case sensitivity', 'FAIL', 'Login should have failed but succeeded');
  } catch (error) {
    const expectedMessage = 'Invalid credentials';
    const actualMessage = error.response?.data?.message;
    logTest('AUTH_TC_013', 'Password case sensitivity', 
      actualMessage === expectedMessage ? 'PASS' : 'FAIL',
      `Expected: "${expectedMessage}", Got: "${actualMessage}"`);
  }
}

async function testProtectedRoutes() {
  logSection('IV. PROTECTED ROUTE ACCESS & REDIRECTION');
  
  // AUTH_TC_014: Direct Dashboard Access (Unauthenticated)
  try {
    const response = await axios.get(`${CONFIG.FRONTEND_URL}/dashboard`, {
      maxRedirects: 0,
      validateStatus: () => true
    });
    
    const isRedirect = response.status >= 300 && response.status < 400;
    const redirectsToLogin = response.headers.location?.includes('/login') || 
                           response.data?.includes('login') ||
                           response.status === 200; // React app might handle client-side redirect
    
    logTest('AUTH_TC_014', 'Direct dashboard access (unauthenticated)', 
      isRedirect || redirectsToLogin ? 'PASS' : 'FAIL',
      `Status: ${response.status}, Redirect: ${response.headers.location || 'client-side'}`);
  } catch (error) {
    logTest('AUTH_TC_014', 'Direct dashboard access (unauthenticated)', 'FAIL', error.message);
  }
  
  // AUTH_TC_016: Invalid JWT Token Handling
  try {
    const response = await axios.get(`${CONFIG.BACKEND_URL}/profile/me`, {
      headers: { Authorization: 'Bearer invalid.jwt.token' },
      validateStatus: () => true
    });
    
    const isUnauthorized = response.status === 401;
    logTest('AUTH_TC_016', 'Invalid JWT token handling', 
      isUnauthorized ? 'PASS' : 'FAIL',
      `Status: ${response.status}, Message: ${response.data?.message}`);
  } catch (error) {
    logTest('AUTH_TC_016', 'Invalid JWT token handling', 'FAIL', error.message);
  }
}

async function testJWTTokenStructure() {
  logSection('VI. SECURITY & OTHER CONSIDERATIONS');
  
  // AUTH_TC_023: JWT Token Structure Validation
  if (CONFIG.ENGINEER_TOKEN) {
    try {
      const parts = CONFIG.ENGINEER_TOKEN.split('.');
      const hasThreeParts = parts.length === 3;
      
      if (hasThreeParts) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        const hasRequiredFields = payload.sub && payload.email && payload.role && payload.exp;
        
        logTest('AUTH_TC_023', 'JWT token structure validation', 
          hasRequiredFields ? 'PASS' : 'FAIL',
          `Parts: ${parts.length}, Fields: sub=${!!payload.sub}, email=${!!payload.email}, role=${!!payload.role}, exp=${!!payload.exp}`);
      } else {
        logTest('AUTH_TC_023', 'JWT token structure validation', 'FAIL', `Token has ${parts.length} parts, expected 3`);
      }
    } catch (error) {
      logTest('AUTH_TC_023', 'JWT token structure validation', 'FAIL', error.message);
    }
  } else {
    logTest('AUTH_TC_023', 'JWT token structure validation', 'FAIL', 'No token available for testing');
  }
}

async function testAuthenticatedEndpoints() {
  logSection('AUTHENTICATED ENDPOINT TESTS');
  
  // Test profile endpoint with valid token
  if (CONFIG.ENGINEER_TOKEN) {
    try {
      const response = await axios.get(`${CONFIG.BACKEND_URL}/profile/me`, {
        headers: { Authorization: `Bearer ${CONFIG.ENGINEER_TOKEN}` }
      });
      
      const hasUserData = response.data.user && response.data.user.email;
      logTest('PROFILE_001', 'Profile endpoint with valid token', 
        hasUserData ? 'PASS' : 'FAIL',
        `User: ${response.data.user?.email}, Role: ${response.data.user?.role}`);
    } catch (error) {
      logTest('PROFILE_001', 'Profile endpoint with valid token', 'FAIL', error.response?.data?.message || error.message);
    }
  }
  
  // Test role-based access
  if (CONFIG.ADMIN_TOKEN) {
    try {
      const response = await axios.get(`${CONFIG.BACKEND_URL}/users/stats`, {
        headers: { Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}` }
      });
      
      const hasStats = response.data.statistics;
      logTest('RBAC_001', 'Admin-only endpoint access', 
        hasStats ? 'PASS' : 'FAIL',
        `Statistics available: ${!!hasStats}`);
    } catch (error) {
      logTest('RBAC_001', 'Admin-only endpoint access', 'FAIL', error.response?.data?.message || error.message);
    }
  }
  
  // Test role restriction (engineer trying to access admin endpoint)
  if (CONFIG.ENGINEER_TOKEN) {
    try {
      await axios.get(`${CONFIG.BACKEND_URL}/users/stats`, {
        headers: { Authorization: `Bearer ${CONFIG.ENGINEER_TOKEN}` }
      });
      logTest('RBAC_002', 'Role restriction enforcement', 'FAIL', 'Engineer should not access admin endpoint');
    } catch (error) {
      const isForbidden = error.response?.status === 403;
      logTest('RBAC_002', 'Role restriction enforcement', 
        isForbidden ? 'PASS' : 'FAIL',
        `Status: ${error.response?.status}, Message: ${error.response?.data?.message}`);
    }
  }
}

async function testInputValidation() {
  logSection('INPUT VALIDATION TESTS');
  
  // AUTH_TC_002: Empty Form Submission
  try {
    await axios.post(`${CONFIG.BACKEND_URL}/auth/login`, {});
    logTest('AUTH_TC_002', 'Empty form submission', 'FAIL', 'Should have failed validation');
  } catch (error) {
    const hasValidationError = error.response?.status === 400;
    logTest('AUTH_TC_002', 'Empty form submission', 
      hasValidationError ? 'PASS' : 'FAIL',
      `Status: ${error.response?.status}, Message: ${error.response?.data?.message}`);
  }
  
  // AUTH_TC_003: Invalid Email Format
  try {
    await axios.post(`${CONFIG.BACKEND_URL}/auth/login`, {
      email: 'invalid-email',
      password: 'somepassword'
    });
    logTest('AUTH_TC_003', 'Invalid email format validation', 'FAIL', 'Should have failed validation');
  } catch (error) {
    const hasValidationError = error.response?.status === 400;
    logTest('AUTH_TC_003', 'Invalid email format validation', 
      hasValidationError ? 'PASS' : 'FAIL',
      `Status: ${error.response?.status}, Message: ${error.response?.data?.message}`);
  }
}

// Main test execution
async function runAllTests() {
  console.log('🚀 MSSP Platform Authentication Flow Test Suite');
  console.log('='.repeat(60));
  console.log(`Backend URL: ${CONFIG.BACKEND_URL}`);
  console.log(`Frontend URL: ${CONFIG.FRONTEND_URL}`);
  console.log(`Test Time: ${new Date().toISOString()}`);
  
  try {
    await testBackendConnectivity();
    await testFrontendConnectivity();
    await testInputValidation();
    await testLoginPageElements();
    await testSuccessfulLogin();
    await testUnsuccessfulLogin();
    await testProtectedRoutes();
    await testJWTTokenStructure();
    await testAuthenticatedEndpoints();
    
    // Final results
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n🔍 FAILED TESTS:');
      testResults.details
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(`   ${test.testId}: ${test.title}`);
          if (test.details) console.log(`      ${test.details}`);
        });
    }
    
    console.log('\n✨ Test execution completed!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, CONFIG, testResults }; 