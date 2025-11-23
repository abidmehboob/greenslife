const axios = require('axios');

async function debugTest() {
  console.log('🔍 Debug Test - Checking Server Connection\n');
  
  try {
    // First test if server is reachable
    console.log('1. Testing basic server connectivity...');
    const healthCheck = await axios.get('http://127.0.0.1:3001/');
    console.log('✅ Server is reachable');
  } catch (error) {
    console.log('❌ Server unreachable:', error.message);
    return;
  }
  
  try {
    // Test login endpoint
    console.log('\n2. Testing login endpoint...');
    const loginData = {
      email: 'wholesaler@test.com',
      password: 'password123'
    };
    
    console.log('Sending POST to: http://127.0.0.1:3001/api/auth/login');
    console.log('Data:', JSON.stringify(loginData));
    
    const response = await axios.post('http://127.0.0.1:3001/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Login successful!');
    console.log('Status:', response.status);
    console.log('Token received:', response.data.token ? 'YES' : 'NO');
    console.log('User type:', response.data.user?.userType);
    
  } catch (error) {
    console.log('❌ Login failed');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Status code:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('Request made but no response received');
      console.log('Request details:', error.request.method, error.request.path);
    } else {
      console.log('Error in request setup');
    }
  }
  
  try {
    // Test flowers endpoint
    console.log('\n3. Testing flowers endpoint...');
    const flowersResponse = await axios.get('http://127.0.0.1:3001/api/flowers', {
      timeout: 10000
    });
    console.log('✅ Flowers endpoint reachable');
    console.log('Status:', flowersResponse.status);
    console.log('Flowers count:', flowersResponse.data.flowers?.length || 0);
  } catch (error) {
    console.log('❌ Flowers endpoint failed:', error.message);
  }
}

debugTest();