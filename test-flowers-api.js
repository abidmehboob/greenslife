// Test script to verify flowers API
const https = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/flowers',
  method: 'GET'
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('API Response received');
      console.log('Number of flowers:', json.flowers ? json.flowers.length : 'No flowers array');
      if (json.flowers && json.flowers.length > 0) {
        console.log('First flower:', json.flowers[0].name);
        console.log('Has images?', json.flowers[0].images ? 'Yes' : 'No');
      }
    } catch (e) {
      console.error('JSON Parse Error:', e);
      console.log('Raw response:', data.substring(0, 200));
    }
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e.message);
});

req.end();