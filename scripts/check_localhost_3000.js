const http = require('http');
const options = { hostname: '127.0.0.1', port: 3000, path: '/', method: 'GET', timeout: 5000 };
const req = http.request(options, res => {
  console.log('Status:', res.statusCode, res.statusMessage);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (data.length > 1000) console.log(data.slice(0,1000) + '\n... [truncated]');
    else console.log(data);
  });
});
req.on('error', e => console.error('Request failed:', e.message));
req.on('timeout', () => { console.error('Request timed out'); req.abort(); });
req.end();

