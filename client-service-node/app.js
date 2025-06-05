const express = require('express');
const axios = require('axios');
const os = require('os');

const app = express();
const port = process.env.PORT || 8080;
const API_SERVICE_URL = process.env.API_SERVICE_URL || 'http://api-service';

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/', (req, res) => {
  const hostname = os.hostname();
  res.json({
    message: 'Hello from Client service!',
    hostname: hostname,
    service: 'client-service'
  });
});

app.get('/call-api', async (req, res) => {
  try {
    const apiUrl = `${API_SERVICE_URL}/api/data`;
    console.log(`Calling API at: ${apiUrl}`);
    
    const response = await axios.get(apiUrl, { timeout: 5000 });
    const apiData = response.data;
    
    res.json({
      client_service: {
        hostname: os.hostname(),
        service: 'client-service'
      },
      api_response: apiData
    });
  } catch (error) {
    console.error(`Error calling API: ${error.message}`);
    res.status(500).json({
      error: error.message,
      client_service: {
        hostname: os.hostname(),
        service: 'client-service'
      }
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Client service listening on port ${port}`);
});