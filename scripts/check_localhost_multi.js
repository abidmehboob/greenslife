const http = require('http');
const hosts = ['127.0.0.1','::1','localhost'];
function check(host){
  return new Promise(resolve => {
    const options = { hostname: host, port: 3000, path: '/', method: 'GET', timeout: 3000 };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ host, status: res.statusCode, body: data.slice(0,1000) }));
    });
    req.on('error', e => resolve({ host, error: e.message }));
    req.on('timeout', () => { req.abort(); resolve({ host, error: 'timeout' }); });
    req.end();
  });
}
(async ()=>{
  for (const h of hosts){
    const r = await check(h);
    console.log('---', h, '---');
    if (r.error) console.log('Error:', r.error);
    else {
      console.log('Status:', r.status);
      console.log('Body snippet:');
      console.log(r.body + (r.body.length>=1000 ? '\n... [truncated]' : ''));
    }
  }
})();

