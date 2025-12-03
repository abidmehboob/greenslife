const express = require('express');
const app = express();

app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Test server working!' });
});

app.post('/test-login', (req, res) => {
  console.log('Test login request received:', req.body);
  res.json({ success: true, message: 'Test login endpoint working!' });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});