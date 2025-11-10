const http = require('http');

// First login to get token
const login = () => {
  return new Promise((resolve, reject) => {
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
};

// Then test flowers API with token
const testFlowersAPI = (token) => {
  return new Promise((resolve, reject) => {
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
        console.log(`Flowers API Status: ${res.statusCode}`);
        console.log('Response Headers:', res.headers);
        try {
          const response = JSON.parse(data);
          console.log('Flowers API Response:');
          console.log('Success:', response.success);
          console.log('Data length:', response.data ? response.data.length : 'No data');
          if (response.data && response.data.length > 0) {
            console.log('First flower:', {
              name: response.data[0].name,
              category: response.data[0].category,
              price: response.data[0].pricing.pricePerStem
            });
          }
          resolve(response);
        } catch (error) {
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

// Run the test
(async () => {
  try {
    console.log('Testing flowers API after login...');
    const token = await login();
    console.log('Login successful, token received');
    
    const flowersResponse = await testFlowersAPI(token);
    console.log('Flowers API test completed successfully');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
})();