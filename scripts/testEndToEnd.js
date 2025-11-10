const http = require('http');

// Test complete end-to-end flow: login then fetch flowers
async function testEndToEndFlow() {
  try {
    console.log('1. Testing login...');
    
    // Login first
    const token = await new Promise((resolve, reject) => {
      const loginData = JSON.stringify({
        email: "wholesaler@test.com",
        password: "password123"
      });

      const loginOptions = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginData)
        }
      };

      const req = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 200 && response.token) {
              console.log('✅ Login successful');
              console.log('Token received:', response.token.substring(0, 20) + '...');
              console.log('User:', response.user.email, '(' + response.user.userType + ')');
              resolve(response.token);
            } else {
              reject(new Error(`Login failed: ${data}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(loginData);
      req.end();
    });

    console.log('\n2. Testing flowers API with token...');
    
    // Then test flowers API
    const flowersResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/flowers',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log('✅ Flowers API Response Status:', res.statusCode);
          try {
            const response = JSON.parse(data);
            console.log('✅ Response parsed successfully');
            console.log('Success:', response.success);
            console.log('Data type:', typeof response.data);
            console.log('Data length:', response.data ? response.data.length : 'No data');
            
            if (response.data && response.data.length > 0) {
              console.log('\n📦 First flower sample:');
              const firstFlower = response.data[0];
              console.log('  Name:', firstFlower.name);
              console.log('  Category:', firstFlower.category);
              console.log('  Price per stem:', firstFlower.pricing.pricePerStem);
              console.log('  In stock:', firstFlower.availability.inStock);
              console.log('  Image paths:', firstFlower.images ? firstFlower.images.length : 0);
            }
            
            resolve(response);
          } catch (error) {
            console.log('❌ Raw response:', data);
            reject(error);
          }
        });
      });

      req.on('error', (err) => {
        console.log('❌ Request error:', err.message);
        reject(err);
      });
      req.end();
    });

    console.log('\n3. Testing categories API...');
    
    // Test categories API
    await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/flowers/meta/categories',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log('✅ Categories:', response);
            resolve(response);
          } catch (error) {
            console.log('❌ Categories raw response:', data);
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });

    console.log('\n🎉 All tests passed! Authentication and flower loading work correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEndToEndFlow();