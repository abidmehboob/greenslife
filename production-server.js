const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'client/dist')));

// API proxy to backend
app.use('/api', (req, res) => {
  // Redirect API calls to backend server
  res.redirect(307, `http://localhost:3001${req.originalUrl}`);
});

// Handle React routing - send all other requests to React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Production server running on http://localhost:${PORT}`);
  console.log(`📋 Make sure backend is running on http://localhost:3001`);
});