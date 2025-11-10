const https = require('https');
const http = require('http');

function testLoginAPI() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: "wholesaler@test.com",
      password: "password123"
    });

    const options = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('🔍 Testing login API...');
    console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);
    console.log('Method:', options.method);
    console.log('Headers:', JSON.stringify(options.headers, null, 2));
    console.log('Body:', postData);
    console.log('─'.repeat(50));

    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Response Body:', data);
        
        if (res.statusCode === 200) {
          console.log('✅ Login Success!');
          try {
            const parsed = JSON.parse(data);
            console.log('Token:', parsed.token ? 'Generated' : 'Missing');
            console.log('User:', parsed.user ? parsed.user.email : 'Missing');
          } catch (e) {
            console.log('Could not parse response as JSON');
          }
        } else {
          console.log('❌ Login Failed!');
        }
        resolve(data);
      });
    });

    req.on('error', (e) => {
      console.log('❌ Request Error:', e.message);
      reject(e);
    });

    req.on('timeout', () => {
      console.log('❌ Request Timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    // Set timeout
    req.setTimeout(10000);

    // Write data to request body
    req.write(postData);
    req.end();
  });
}

// Run the test
testLoginAPI()
  .then(() => {
    console.log('\n🎉 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.log('\n💥 Test failed:', error.message);
    process.exit(1);
  });