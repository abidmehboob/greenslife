const http = require('http');

function testLogin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'wholesaler@test.com',
      password: 'password123'
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

    console.log('🔍 Testing login with:');
    console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);
    console.log('Data:', postData);
    console.log('Headers:', options.headers);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('\n📨 Response received:');
        console.log('Status:', res.statusCode);
        console.log('Headers:', res.headers);
        console.log('Body:', data);

        if (res.statusCode === 200) {
          console.log('\n✅ Login Successful!');
          resolve(JSON.parse(data));
        } else {
          console.log('\n❌ Login Failed!');
          reject(new Error(`Status: ${res.statusCode}, Body: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      console.log('\n🚫 Connection Error:');
      console.error(err.message);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    await testLogin();
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

if (require.main === module) {
  main();
}