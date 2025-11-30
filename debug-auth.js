const express = require('express');
const { authenticateToken } = require('./middleware/auth');

const app = express();
app.use(express.json());

// Test endpoint to debug user object
app.get('/debug-user', authenticateToken, (req, res) => {
  res.json({
    user: req.user,
    userType: req.user.userType,
    id: req.user.id,
    email: req.user.email
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
});