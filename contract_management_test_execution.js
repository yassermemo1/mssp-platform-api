#!/usr/bin/env node

/**
 * MSSP Platform Contract Management Test Execution Script
 * Automated testing for the 35 test cases defined in CONTRACT_MANAGEMENT_TEST_PLAN.md
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  BACKEND_URL: 'http://localhost:3001',
  FRONTEND_URL: 'http://localhost:3000',
  TEST_TOKENS: {},
  TEST_DATA: {
    clients: [],
    services: [],
    contracts: [],
    serviceScopes: [],
    proposals: []
  }
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
  categories: {
    'Core Contract Creation': { passed: 0, failed: 0, total: 8 },
    'Service Scopes & Dynamic Forms': { passed: 0, failed: 0, total: 8 },
    'Proposal Management': { passed: 0, failed: 0, total: 7 },
    'End-to-End Scenarios': { passed: 0, failed: 0, total: 2 },
    'Data Integrity & RBAC': { passed: 0, failed: 0, total: 10 }
  }
};

// Utility functions
function logTest(testId, title, status, details = '', category = 'General') {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
    if (testResults.categories[category]) {
      testResults.categories[category].passed++;
    }
    console.log(`✅ ${testId}: ${title}`);
  } else {
    testResults.failed++;
    if (testResults.categories[category]) {
      testResults.categories[category].failed++;
    }
    console.log(`❌ ${testId}: ${title}`);
    if (details) console.log(`   Details: ${details}`);
  }
  testResults.details.push({ testId, title, status, details, category });
}

function logSection(title) {
  console.log(`\n🔍 ${title}`);
  console.log('='.repeat(60));
}

// Authentication helper
async function authenticateUser(email, password) {
  try {
    const response = await axios.post(`${CONFIG.BACKEND_URL}/auth/login`, {
      email,
      password
    });
    return response.data.access_token;
  } catch (error) {
    console.error(`Failed to authenticate ${email}:`, error.response?.data?.message || error.message);
    return null;
  }
}

// Test data setup
async function setupTestData() {
  logSection('TEST DATA SETUP');
  
  try {
    // Authenticate test users with correct passwords
    CONFIG.TEST_TOKENS.admin = await authenticateUser('contract.admin@mssp.com', 'ContractAdmin123');
    CONFIG.TEST_TOKENS.manager = await authenticateUser('manager@mssp.com', 'ManagerPass123');
    CONFIG.TEST_TOKENS.engineer = await authenticateUser('contract.engineer@mssp.com', 'ContractEng123');
    
    if (!CONFIG.TEST_TOKENS.admin) {
      console.log('⚠️  Admin user not found, some tests will be skipped');
      return;
    }

    // Get existing clients first
    try {
      const clientsResponse = await axios.get(`${CONFIG.BACKEND_URL}/clients`, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKENS.admin}` }
      });
      if (clientsResponse.data && clientsResponse.data.length > 0) {
        CONFIG.TEST_DATA.clients = clientsResponse.data;
        console.log('✅ Using existing test clients');
      }
    } catch (error) {
      console.log('ℹ️  No existing clients found');
    }

    // Create test client if none exist
    if (CONFIG.TEST_DATA.clients.length === 0) {
      try {
        const clientResponse = await axios.post(`${CONFIG.BACKEND_URL}/clients`, {
          companyName: 'Pharma Inc.',
          contactName: 'Ahmed Al-Rashid',
          contactEmail: 'contact@pharmainc.com',
          contactPhone: '+966-11-123-4567',
          address: 'Riyadh, Saudi Arabia',
          status: 'active'
        }, {
          headers: { Authorization: `Bearer ${CONFIG.TEST_TOKENS.admin}` }
        });
        CONFIG.TEST_DATA.clients.push(clientResponse.data);
        console.log('✅ Test client "Pharma Inc." created');
      } catch (error) {
        console.log('❌ Failed to create test client:', error.response?.data?.message || error.message);
      }
    }
    
    // Get existing services first
    try {
      const servicesResponse = await axios.get(`${CONFIG.BACKEND_URL}/services`, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKENS.admin}` }
      });
      if (servicesResponse.data && servicesResponse.data.data && servicesResponse.data.data.length > 0) {
        CONFIG.TEST_DATA.services = servicesResponse.data.data;
        console.log('✅ Using existing test services');
      }
    } catch (error) {
      console.log('ℹ️  No existing services found');
    }

    // Create test service if none exist
    if (CONFIG.TEST_DATA.services.length === 0) {
      try {
        const siemService = await axios.post(`${CONFIG.BACKEND_URL}/services`, {
          name: 'Managed SIEM',
          description: 'Comprehensive SIEM monitoring service',
          category: 'managed_siem',
          deliveryModel: 'cloud_hosted',
          basePrice: 5000.00,
          isActive: true,
          scopeDefinitionTemplate: {
            fields: [
              {
                name: 'log_sources',
                label: 'Log Sources',
                type: 'textarea',
                required: true,
                placeholder: 'List log sources (one per line)'
              },
              {
                name: 'eps_target',
                label: 'EPS Target',
                type: 'number',
                required: true,
                min: 100,
                max: 10000
              }
            ],
            version: '1.0',
            description: 'SIEM service scope configuration'
          }
        }, {
          headers: { Authorization: `Bearer ${CONFIG.TEST_TOKENS.admin}` }
        });
        CONFIG.TEST_DATA.services.push(siemService.data.data);
        console.log('✅ Test service "Managed SIEM" created');
      } catch (error) {
        console.log('❌ Failed to create test service:', error.response?.data?.message || error.message);
      }
    }
    
    console.log(`✅ Test data setup completed - Clients: ${CONFIG.TEST_DATA.clients.length}, Services: ${CONFIG.TEST_DATA.services.length}`);
  } catch (error) {
    console.error('❌ Test data setup failed:', error.message);
  }
}

// I. Core Contract Creation Workflow Tests
async function testCoreContractCreation() {
  logSection('I. CORE CONTRACT CREATION WORKFLOW');
  const category = 'Core Contract Creation';
  
  // CM_TC_001: Successful Contract Creation (Admin Role)
  if (CONFIG.TEST_TOKENS.admin && CONFIG.TEST_DATA.clients.length > 0) {
    try {
      const timestamp = new Date().getTime();
      const contractData = {
        contractName: `Pharma SIEM Contract ${timestamp}`,
        clientId: CONFIG.TEST_DATA.clients[0].id,
        startDate: '2025-06-01',
        endDate: '2026-05-31',
        value: 150000.00,
        status: 'draft',
        notes: 'Initial SIEM implementation contract'
      };
      
      const response = await axios.post(`${CONFIG.BACKEND_URL}/contracts`, contractData, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKENS.admin}` }
      });
      
      if (response.status === 201 && response.data.data.contractName) {
        CONFIG.TEST_DATA.contracts.push(response.data.data);
        logTest('CM_TC_001', 'Successful Contract Creation (Admin Role)', 'PASS', 
          `Contract created successfully with ID: ${response.data.data.id}`, category);
      } else {
        logTest('CM_TC_001', 'Successful Contract Creation (Admin Role)', 'FAIL', 
          'Contract not created properly', category);
      }
    } catch (error) {
      logTest('CM_TC_001', 'Successful Contract Creation (Admin Role)', 'FAIL', 
        error.response?.data?.message || error.message, category);
    }
  } else {
    logTest('CM_TC_001', 'Successful Contract Creation (Admin Role)', 'SKIP', 
      'Admin token or test client not available', category);
  }
  
  // CM_TC_002: Contract Creation with Document Upload
  // Note: This requires multipart form data, will be tested manually
  logTest('CM_TC_002', 'Contract Creation with Document Upload', 'MANUAL', 
    'Requires file upload testing in browser', category);
  
  // CM_TC_003: Contract Creation with Previous Contract Link
  if (CONFIG.TEST_TOKENS.admin && CONFIG.TEST_DATA.clients.length > 0 && CONFIG.TEST_DATA.contracts.length > 0) {
    try {
      const timestamp = new Date().getTime();
      const renewalContractData = {
        contractName: `Pharma SIEM 2025 Renewal ${timestamp}`,
        clientId: CONFIG.TEST_DATA.clients[0].id,
        startDate: '2026-06-01',
        endDate: '2027-05-31',
        value: 160000.00,
        status: 'draft',
        previousContractId: CONFIG.TEST_DATA.contracts[0].id,
        notes: 'Renewal of previous SIEM contract'
      };
      
      const response = await axios.post(`${CONFIG.BACKEND_URL}/contracts`, renewalContractData, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKENS.admin}` }
      });
      
      if (response.status === 201 && response.data.data.previousContractId) {
        logTest('CM_TC_003', 'Contract Creation with Previous Contract Link', 'PASS', 
          `Renewal contract created with previous contract link`, category);
      } else {
        logTest('CM_TC_003', 'Contract Creation with Previous Contract Link', 'FAIL', 
          'Renewal contract not created properly', category);
      }
    } catch (error) {
      logTest('CM_TC_003', 'Contract Creation with Previous Contract Link', 'FAIL', 
        error.response?.data?.message || error.message, category);
    }
  } else {
    logTest('CM_TC_003', 'Contract Creation with Previous Contract Link', 'SKIP', 
      'Prerequisites not available', category);
  }
  
  // CM_TC_004: Contract Creation - Invalid Client ID
  if (CONFIG.TEST_TOKENS.admin) {
    try {
      const invalidData = {
        contractName: 'Invalid Client Contract',
        clientId: '00000000-0000-0000-0000-000000000000',
        startDate: '2025-06-01',
        endDate: '2026-05-31',
        value: 100000.00,
        status: 'draft'
      };
      
      await axios.post(`${CONFIG.BACKEND_URL}/contracts`, invalidData, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKENS.admin}` }
      });
      
      logTest('CM_TC_004', 'Contract Creation - Invalid Client ID', 'FAIL', 
        'Should have failed but succeeded', category);
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        logTest('CM_TC_004', 'Contract Creation - Invalid Client ID', 'PASS', 
          `Correctly rejected: ${error.response.data.message}`, category);
      } else {
        logTest('CM_TC_004', 'Contract Creation - Invalid Client ID', 'FAIL', 
          `Unexpected error: ${error.message}`, category);
      }
    }
  } else {
    logTest('CM_TC_004', 'Contract Creation - Invalid Client ID', 'SKIP', 
      'Admin token not available', category);
  }
  
  // CM_TC_005: Contract Creation - Missing Required Fields
  if (CONFIG.TEST_TOKENS.admin) {
    try {
      const incompleteData = {
        contractName: '', // Missing required field
        // clientId missing
        // startDate missing
        value: 100000.00
      };
      
      await axios.post(`${CONFIG.BACKEND_URL}/contracts`, incompleteData, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKENS.admin}` }
      });
      
      logTest('CM_TC_005', 'Contract Creation - Missing Required Fields', 'FAIL', 
        'Should have failed validation but succeeded', category);
    } catch (error) {
      if (error.response?.status === 400) {
        logTest('CM_TC_005', 'Contract Creation - Missing Required Fields', 'PASS', 
          `Validation failed correctly: ${error.response.data.message}`, category);
      } else {
        logTest('CM_TC_005', 'Contract Creation - Missing Required Fields', 'FAIL', 
          `Unexpected error: ${error.message}`, category);
      }
    }
  } else {
    logTest('CM_TC_005', 'Contract Creation - Missing Required Fields', 'SKIP', 
      'Admin token not available', category);
  }
  
  // CM_TC_006: Contract Creation - Insufficient Permissions (Engineer)
  if (CONFIG.TEST_TOKENS.engineer && CONFIG.TEST_DATA.clients.length > 0) {
    try {
      const contractData = {
        contractName: 'Unauthorized Contract',
        clientId: CONFIG.TEST_DATA.clients[0].id,
        startDate: '2025-06-01',
        endDate: '2026-05-31',
        value: 100000.00,
        status: 'draft'
      };
      
      await axios.post(`${CONFIG.BACKEND_URL}/contracts`, contractData, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKENS.engineer}` }
      });
      
      logTest('CM_TC_006', 'Contract Creation - Insufficient Permissions (Engineer)', 'FAIL', 
        'Engineer should not be able to create contracts', category);
    } catch (error) {
      if (error.response?.status === 403) {
        logTest('CM_TC_006', 'Contract Creation - Insufficient Permissions (Engineer)', 'PASS', 
          `Access denied correctly: ${error.response.data.message}`, category);
      } else {
        logTest('CM_TC_006', 'Contract Creation - Insufficient Permissions (Engineer)', 'FAIL', 
          `Unexpected error: ${error.message}`, category);
      }
    }
  } else {
    logTest('CM_TC_006', 'Contract Creation - Insufficient Permissions (Engineer)', 'SKIP', 
      'Engineer token or test client not available', category);
  }
  
  // CM_TC_007: Contract Creation - Authorized Roles (Manager)
  if (CONFIG.TEST_TOKENS.manager && CONFIG.TEST_DATA.clients.length > 0) {
    try {
      const timestamp = new Date().getTime();
      const contractData = {
        contractName: `Manager Created Contract ${timestamp}`,
        clientId: CONFIG.TEST_DATA.clients[0].id,
        startDate: '2025-06-01',
        endDate: '2026-05-31',
        value: 120000.00,
        status: 'draft'
      };
      
      const response = await axios.post(`${CONFIG.BACKEND_URL}/contracts`, contractData, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKENS.manager}` }
      });
      
      if (response.status === 201) {
        logTest('CM_TC_007', 'Contract Creation - Authorized Roles (Manager)', 'PASS', 
          `Manager successfully created contract`, category);
      } else {
        logTest('CM_TC_007', 'Contract Creation - Authorized Roles (Manager)', 'FAIL', 
          'Contract creation failed', category);
      }
    } catch (error) {
      logTest('CM_TC_007', 'Contract Creation - Authorized Roles (Manager)', 'FAIL', 
        error.response?.data?.message || error.message, category);
    }
  } else {
    logTest('CM_TC_007', 'Contract Creation - Authorized Roles (Manager)', 'SKIP', 
      'Manager token or test client not available', category);
  }
  
  // CM_TC_008: Contract Creation - Authorized Roles (Account Manager)
  logTest('CM_TC_008', 'Contract Creation - Authorized Roles (Account Manager)', 'MANUAL', 
    'Requires Account Manager user setup', category);
}

// II. Service Scopes & Dynamic Forms Tests
async function testServiceScopes() {
  logSection('II. SERVICE SCOPES & DYNAMIC FORMS');
  const category = 'Service Scopes & Dynamic Forms';
  
  // These tests require the frontend UI for dynamic form testing
  // We'll test the backend APIs that support these features
  
  // CM_TC_009: Add Service with Dynamic Scope Configuration
  if (CONFIG.TEST_TOKENS.admin && CONFIG.TEST_DATA.contracts.length > 0 && CONFIG.TEST_DATA.services.length > 0) {
    try {
      const serviceScopeData = {
        serviceId: CONFIG.TEST_DATA.services[0].id,
        scopeDetails: {
          log_sources: 'Firewalls\nServers\nWorkstations',
          eps_target: 500
        },
        price: 5000.00,
        quantity: 1,
        unit: 'monthly',
        safStatus: 'not_initiated',
        notes: 'Initial SIEM deployment'
      };
      
      const response = await axios.post(`${CONFIG.BACKEND_URL}/contracts/${CONFIG.TEST_DATA.contracts[0].id}/service-scopes`, serviceScopeData, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKENS.admin}` }
      });
      
      if (response.status === 201 && response.data.data.scopeDetails) {
        CONFIG.TEST_DATA.serviceScopes.push(response.data.data);
        logTest('CM_TC_009', 'Add Service with Dynamic Scope Configuration', 'PASS', 
          `Service scope created with dynamic details`, category);
      } else {
        logTest('CM_TC_009', 'Add Service with Dynamic Scope Configuration', 'FAIL', 
          'Service scope not created properly', category);
      }
    } catch (error) {
      logTest('CM_TC_009', 'Add Service with Dynamic Scope Configuration', 'FAIL', 
        error.response?.data?.message || error.message, category);
    }
  } else {
    logTest('CM_TC_009', 'Add Service with Dynamic Scope Configuration', 'SKIP', 
      'Prerequisites not available', category);
  }
  
  // Mark remaining service scope tests as manual since they require UI interaction
  for (let i = 10; i <= 16; i++) {
    const testId = `CM_TC_${i.toString().padStart(3, '0')}`;
    const titles = {
      'CM_TC_010': 'Add Service with Select Field Type',
      'CM_TC_011': 'Dynamic Form Validation - Required Fields',
      'CM_TC_012': 'Dynamic Form Validation - Field Constraints',
      'CM_TC_013': 'SAF Management - Update SAF Status',
      'CM_TC_014': 'SAF Document Upload',
      'CM_TC_015': 'Add Service - Insufficient Permissions (Engineer)',
      'CM_TC_016': 'Service Scope - Invalid Service ID'
    };
    logTest(testId, titles[testId], 'MANUAL', 'Requires frontend UI testing', category);
  }
}

// III. Proposal Management Tests
async function testProposalManagement() {
  logSection('III. PROPOSAL MANAGEMENT');
  const category = 'Proposal Management';
  
  // CM_TC_017: Add Technical Proposal
  if (CONFIG.TEST_TOKENS.admin && CONFIG.TEST_DATA.serviceScopes.length > 0) {
    try {
      const proposalData = {
        serviceScopeId: CONFIG.TEST_DATA.serviceScopes[0].id,
        proposalType: 'technical',
        documentLink: '/uploads/proposals/technical-proposal.pdf',
        version: '1.0',
        status: 'submitted',
        title: 'Technical Implementation Proposal',
        description: 'Comprehensive technical implementation plan for SIEM service',
        estimatedDurationDays: 90,
        notes: 'Initial technical proposal submission'
      };
      
      const response = await axios.post(`${CONFIG.BACKEND_URL}/proposals`, proposalData, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKENS.admin}` }
      });
      
      if (response.status === 201 && response.data.data.proposalType === 'technical') {
        CONFIG.TEST_DATA.proposals.push(response.data.data);
        logTest('CM_TC_017', 'Add Technical Proposal', 'PASS', 
          `Technical proposal created successfully`, category);
      } else {
        logTest('CM_TC_017', 'Add Technical Proposal', 'FAIL', 
          'Technical proposal not created properly', category);
      }
    } catch (error) {
      logTest('CM_TC_017', 'Add Technical Proposal', 'FAIL', 
        error.response?.data?.message || error.message, category);
    }
  } else {
    logTest('CM_TC_017', 'Add Technical Proposal', 'SKIP', 
      'Prerequisites not available', category);
  }
  
  // CM_TC_018: Add Financial Proposal
  if (CONFIG.TEST_TOKENS.admin && CONFIG.TEST_DATA.serviceScopes.length > 0) {
    try {
      const proposalData = {
        serviceScopeId: CONFIG.TEST_DATA.serviceScopes[0].id,
        proposalType: 'financial',
        documentLink: '/uploads/proposals/financial-proposal.pdf',
        version: '1.0',
        status: 'submitted',
        title: 'Financial Proposal for SIEM Service',
        description: 'Detailed pricing and financial terms',
        proposalValue: 150000.00,
        estimatedDurationDays: 365,
        notes: 'Initial financial proposal submission'
      };
      
      const response = await axios.post(`${CONFIG.BACKEND_URL}/proposals`, proposalData, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKENS.admin}` }
      });
      
      if (response.status === 201 && response.data.data.proposalType === 'financial') {
        CONFIG.TEST_DATA.proposals.push(response.data.data);
        logTest('CM_TC_018', 'Add Financial Proposal', 'PASS', 
          `Financial proposal created successfully`, category);
      } else {
        logTest('CM_TC_018', 'Add Financial Proposal', 'FAIL', 
          'Financial proposal not created properly', category);
      }
    } catch (error) {
      logTest('CM_TC_018', 'Add Financial Proposal', 'FAIL', 
        error.response?.data?.message || error.message, category);
    }
  } else {
    logTest('CM_TC_018', 'Add Financial Proposal', 'SKIP', 
      'Prerequisites not available', category);
  }
  
  // Mark remaining proposal tests as manual
  for (let i = 19; i <= 23; i++) {
    const testId = `CM_TC_${i.toString().padStart(3, '0')}`;
    const titles = {
      'CM_TC_019': 'Update Proposal Status Workflow',
      'CM_TC_020': 'Replace Proposal Document',
      'CM_TC_021': 'Proposal Creation - Missing Required Fields',
      'CM_TC_022': 'Proposal Management - Insufficient Permissions (Engineer)',
      'CM_TC_023': 'Multiple Proposals per Service Scope'
    };
    logTest(testId, titles[testId], 'MANUAL', 'Requires frontend UI testing', category);
  }
}

// IV. End-to-End Scenarios
async function testEndToEndScenarios() {
  logSection('IV. END-TO-END SCENARIOS');
  const category = 'End-to-End Scenarios';
  
  // CM_TC_024: Complete Contract Lifecycle (E2E)
  logTest('CM_TC_024', 'Complete Contract Lifecycle (E2E)', 'MANUAL', 
    'Comprehensive E2E test requires full UI workflow', category);
  
  // CM_TC_025: Multi-Service Contract (E2E)
  logTest('CM_TC_025', 'Multi-Service Contract (E2E)', 'MANUAL', 
    'Multi-service testing requires frontend UI', category);
}

// V. Data Integrity, RBAC, and Error Handling
async function testDataIntegrityAndRBAC() {
  logSection('V. DATA INTEGRITY, RBAC, AND ERROR HANDLING');
  const category = 'Data Integrity & RBAC';
  
  // CM_TC_026: Database Relationship Integrity
  if (CONFIG.TEST_DATA.contracts.length > 0) {
    try {
      const contractId = CONFIG.TEST_DATA.contracts[0].id;
      const response = await axios.get(`${CONFIG.BACKEND_URL}/contracts/${contractId}`, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKENS.admin}` }
      });
      
      if (response.data.data.client && response.data.data.serviceScopes) {
        logTest('CM_TC_026', 'Database Relationship Integrity', 'PASS', 
          'Contract relationships loaded correctly', category);
      } else {
        logTest('CM_TC_026', 'Database Relationship Integrity', 'FAIL', 
          'Contract relationships not loaded', category);
      }
    } catch (error) {
      logTest('CM_TC_026', 'Database Relationship Integrity', 'FAIL', 
        error.response?.data?.message || error.message, category);
    }
  } else {
    logTest('CM_TC_026', 'Database Relationship Integrity', 'SKIP', 
      'No test contracts available', category);
  }
  
  // CM_TC_027: RBAC - Admin Full Access
  if (CONFIG.TEST_TOKENS.admin) {
    try {
      const response = await axios.get(`${CONFIG.BACKEND_URL}/contracts/statistics`, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKENS.admin}` }
      });
      
      if (response.status === 200) {
        logTest('CM_TC_027', 'RBAC - Admin Full Access', 'PASS', 
          'Admin can access statistics endpoint', category);
      } else {
        logTest('CM_TC_027', 'RBAC - Admin Full Access', 'FAIL', 
          'Admin access denied', category);
      }
    } catch (error) {
      logTest('CM_TC_027', 'RBAC - Admin Full Access', 'FAIL', 
        error.response?.data?.message || error.message, category);
    }
  } else {
    logTest('CM_TC_027', 'RBAC - Admin Full Access', 'SKIP', 
      'Admin token not available', category);
  }
  
  // CM_TC_030: RBAC - Engineer Limited Access
  if (CONFIG.TEST_TOKENS.engineer) {
    try {
      await axios.get(`${CONFIG.BACKEND_URL}/contracts/statistics`, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKENS.engineer}` }
      });
      
      logTest('CM_TC_030', 'RBAC - Engineer Limited Access', 'FAIL', 
        'Engineer should not access admin endpoints', category);
    } catch (error) {
      if (error.response?.status === 403) {
        logTest('CM_TC_030', 'RBAC - Engineer Limited Access', 'PASS', 
          'Engineer correctly denied access to admin endpoint', category);
      } else {
        logTest('CM_TC_030', 'RBAC - Engineer Limited Access', 'FAIL', 
          `Unexpected error: ${error.message}`, category);
      }
    }
  } else {
    logTest('CM_TC_030', 'RBAC - Engineer Limited Access', 'SKIP', 
      'Engineer token not available', category);
  }
  
  // Mark remaining tests as manual
  const manualTests = [
    'CM_TC_028: RBAC - Manager Access',
    'CM_TC_029: RBAC - Account Manager Access',
    'CM_TC_031: Error Handling - Database Connection Loss',
    'CM_TC_032: Error Handling - Invalid File Uploads',
    'CM_TC_033: Error Handling - Concurrent Modifications',
    'CM_TC_034: File Upload Limits and Security',
    'CM_TC_035: Data Validation Edge Cases'
  ];
  
  manualTests.forEach((test, index) => {
    const testId = `CM_TC_${(28 + index).toString().padStart(3, '0')}`;
    if (index === 0 || index === 1) {
      logTest(testId, test.split(': ')[1], 'MANUAL', 'Requires specific user role setup', category);
    } else {
      logTest(testId, test.split(': ')[1], 'MANUAL', 'Requires manual testing or specific setup', category);
    }
  });
}

// Generate test report
function generateTestReport() {
  logSection('TEST EXECUTION SUMMARY');
  
  console.log(`📊 Overall Results:`);
  console.log(`   Total Tests: ${testResults.total}`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   📋 Manual: ${testResults.details.filter(t => t.status === 'MANUAL').length}`);
  console.log(`   ⏭️  Skipped: ${testResults.details.filter(t => t.status === 'SKIP').length}`);
  console.log(`   📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  console.log(`\n📋 Results by Category:`);
  Object.entries(testResults.categories).forEach(([category, results]) => {
    const executed = results.passed + results.failed;
    const successRate = executed > 0 ? ((results.passed / executed) * 100).toFixed(1) : 'N/A';
    console.log(`   ${category}: ${results.passed}/${executed} passed (${successRate}%)`);
  });
  
  if (testResults.failed > 0) {
    console.log('\n🔍 Failed Tests:');
    testResults.details
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        console.log(`   ${test.testId}: ${test.title}`);
        if (test.details) console.log(`      ${test.details}`);
      });
  }
  
  console.log('\n📝 Manual Testing Required:');
  console.log('   - File upload functionality (CM_TC_002, CM_TC_014, CM_TC_020)');
  console.log('   - Dynamic form rendering and validation (CM_TC_010-012)');
  console.log('   - Complete E2E workflows (CM_TC_024-025)');
  console.log('   - Frontend UI interactions and navigation');
  console.log('   - Browser-based testing for full user experience');
  
  console.log('\n🎯 Next Steps:');
  console.log('   1. Fix any failed automated tests');
  console.log('   2. Execute manual tests using the frontend UI');
  console.log('   3. Test file upload functionality');
  console.log('   4. Validate complete E2E workflows');
  console.log('   5. Perform cross-browser testing');
}

// Main test execution
async function runAllTests() {
  console.log('🚀 MSSP Platform Contract Management Test Execution');
  console.log('='.repeat(60));
  console.log(`Backend URL: ${CONFIG.BACKEND_URL}`);
  console.log(`Frontend URL: ${CONFIG.FRONTEND_URL}`);
  console.log(`Test Time: ${new Date().toISOString()}`);
  console.log(`Location: Riyadh, Saudi Arabia (+03)`);
  
  try {
    await setupTestData();
    await testCoreContractCreation();
    await testServiceScopes();
    await testProposalManagement();
    await testEndToEndScenarios();
    await testDataIntegrityAndRBAC();
    
    generateTestReport();
    
    console.log('\n✨ Test execution completed!');
    console.log('📋 See CONTRACT_MANAGEMENT_TEST_PLAN.md for detailed manual test instructions');
    
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