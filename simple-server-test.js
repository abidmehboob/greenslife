const express = require('express');

const app = express();
const PORT = 3001;

app.get('/', (req, res) => {
  console.log('Received request!');
  res.json({ message: 'Simple test server is working!' });
});

console.log('Starting simple test server...');

app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`✓ Simple test server running on port ${PORT}`);
  console.log(`✓ Test it at: http://localhost:${PORT}/`);
});

console.log('Server setup completed - waiting for connections...');