#!/usr/bin/env node

/**
 * Create Admin User Script
 * Creates an admin user for the MSSP Platform
 */

const axios = require('axios');

// Configuration
const CONFIG = {
  BACKEND_URL: 'http://localhost:3001',
  ADMIN_USER: {
    firstName: 'Yasser',
    lastName: 'Admin',
    email: 'yasser@mssp.com',
    password: '123123123',
    role: 'admin'
  }
};

// Utility functions
function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.log(`❌ ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

async function checkBackendConnection() {
  try {
    const response = await axios.get(CONFIG.BACKEND_URL);
    logSuccess('Backend connection successful');
    return true;
  } catch (error) {
    logError(`Backend connection failed: ${error.message}`);
    logInfo('Make sure the backend is running on http://localhost:3001');
    return false;
  }
}

async function createAdminUser() {
  try {
    logInfo('Creating admin user...');
    
    const response = await axios.post(`${CONFIG.BACKEND_URL}/auth/register`, CONFIG.ADMIN_USER);
    
    if (response.status === 201) {
      logSuccess('Admin user created successfully!');
      logInfo(`Email: ${CONFIG.ADMIN_USER.email}`);
      logInfo(`Password: ${CONFIG.ADMIN_USER.password}`);
      logInfo(`Role: ${CONFIG.ADMIN_USER.role}`);
      return true;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      logError('User already exists with this email address');
      logInfo('Try logging in with the existing credentials or use a different email');
    } else if (error.response?.data?.message) {
      logError(`Failed to create user: ${error.response.data.message}`);
    } else {
      logError(`Failed to create user: ${error.message}`);
    }
    return false;
  }
}

async function testLogin() {
  try {
    logInfo('Testing login with created credentials...');
    
    const response = await axios.post(`${CONFIG.BACKEND_URL}/auth/login`, {
      email: CONFIG.ADMIN_USER.email,
      password: CONFIG.ADMIN_USER.password
    });
    
    if (response.data.access_token) {
      logSuccess('Login test successful!');
      logInfo('You can now use these credentials to log into the application');
      return true;
    }
  } catch (error) {
    logError(`Login test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 MSSP Platform - Admin User Creation Script\n');
  
  // Check backend connection
  const backendConnected = await checkBackendConnection();
  if (!backendConnected) {
    process.exit(1);
  }
  
  console.log('');
  
  // Create admin user
  const userCreated = await createAdminUser();
  if (!userCreated) {
    process.exit(1);
  }
  
  console.log('');
  
  // Test login
  await testLogin();
  
  console.log('\n🎉 Admin user setup completed!');
  console.log('\nYou can now:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Click "Login" and use the credentials above');
  console.log('3. Access admin features like custom fields management');
}

// Run the script
main().catch(error => {
  logError(`Script failed: ${error.message}`);
  process.exit(1);
}); 