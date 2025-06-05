const express = require('express');
const os = require('os');

const app = express();
const port = process.env.PORT || 8080;

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/api/data', (req, res) => {
  const hostname = os.hostname();
  res.json({
    message: 'Hello from API service!',
    hostname: hostname,
    service: 'api-service'
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API service listening on port ${port}`);
});