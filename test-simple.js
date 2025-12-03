// Test Vercel minimal
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Test minimal OK', timestamp: new Date().toISOString() });
});

module.exports = app;
