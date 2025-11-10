const axios = require('axios');

async function testLogin() {
  try {
    console.log('🧪 Testing login functionality...\n');
    
    const loginData = {
      email: 'wholesaler@test.com',
      password: 'password123'
    };
    
    console.log('📤 Sending login request...');
    console.log('URL:', 'http://localhost:5001/api/auth/login');
    console.log('Data:', JSON.stringify(loginData, null, 2));
    
    const response = await axios.post('http://localhost:5001/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Login Successful!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ Login Failed!');
    console.log('Error:', error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Network/Connection Error');
    }
  }
}

// Test all three users
async function testAllUsers() {
  const users = [
    { email: 'wholesaler@test.com', password: 'password123', type: 'Wholesaler' },
    { email: 'florist@test.com', password: 'password123', type: 'Florist' },
    { email: 'admin@test.com', password: 'admin123', type: 'Admin' }
  ];
  
  for (const user of users) {
    console.log(`\n🔐 Testing ${user.type} Login (${user.email})`);
    console.log('━'.repeat(50));
    
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email: user.email,
        password: user.password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`✅ ${user.type} Login Success`);
      console.log(`   Token: ${response.data.token ? 'Generated' : 'Missing'}`);
      console.log(`   User Type: ${response.data.user?.userType || 'Unknown'}`);
      console.log(`   Business: ${response.data.user?.businessName || 'N/A'}`);
      
    } catch (error) {
      console.log(`❌ ${user.type} Login Failed: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Error: ${error.response.data.message}`);
      }
    }
  }
}

if (require.main === module) {
  testAllUsers();
}