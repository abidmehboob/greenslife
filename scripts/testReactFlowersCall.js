const http = require('http');

// Simulate exactly what the React app does when calling flowers API
async function testReactFlowersCall() {
  try {
    console.log('Simulating React flowers API call...');
    
    // First, login to get token (as React would)
    const loginResponse = await new Promise((resolve, reject) => {
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
            resolve(response);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(loginData);
      req.end();
    });

    console.log('Login successful, token:', loginResponse.token.substring(0, 20) + '...');

    // Now call flowers API exactly as React would (with URLSearchParams)
    const params = new URLSearchParams();
    // Default filters as React would send them
    params.append('page', '1');
    params.append('limit', '12');

    const flowersResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5001,
        path: `/api/flowers?${params.toString()}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginResponse.token}`,
          'Content-Type': 'application/json'
        }
      };

      console.log('Calling:', `http://localhost:5001${options.path}`);

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log('Response status:', res.statusCode);
          console.log('Response headers:', res.headers);
          
          try {
            const response = JSON.parse(data);
            console.log('Parsed response structure:');
            console.log('- success:', response.success);
            console.log('- data type:', typeof response.data);
            console.log('- data length:', response.data ? response.data.length : 'N/A');
            
            // Check if response matches expected FlowersResponse interface
            if (response.success && response.data) {
              console.log('\n✅ Response matches expected structure');
              console.log('Sample flower:');
              const flower = response.data[0];
              console.log('  _id:', flower._id);
              console.log('  name:', flower.name);
              console.log('  category:', flower.category);
              console.log('  pricing.pricePerStem:', flower.pricing.pricePerStem);
              console.log('  pricing.minQuantity:', flower.pricing.minQuantity);
              console.log('  availability.inStock:', flower.availability.inStock);
              
              // Check if this would work with React's expected structure
              const reactExpectedStructure = {
                flowers: response.data,
                pagination: response.pagination || {
                  current: 1,
                  limit: 12,
                  total: response.data.length,
                  pages: 1
                }
              };
              
              console.log('\n📦 React expected structure:');
              console.log('- flowers count:', reactExpectedStructure.flowers.length);
              console.log('- pagination:', reactExpectedStructure.pagination);
              
              resolve(reactExpectedStructure);
            } else {
              console.log('❌ Response does not match expected structure');
              console.log('Raw response:', JSON.stringify(response, null, 2));
              resolve(response);
            }
          } catch (error) {
            console.log('❌ JSON parse error:', error.message);
            console.log('Raw response:', data);
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

    console.log('\n🎉 React flowers API simulation complete!');

  } catch (error) {
    console.error('❌ Simulation failed:', error.message);
    console.error(error.stack);
  }
}

testReactFlowersCall();