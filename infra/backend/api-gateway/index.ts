const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const EVENT_PROCESSOR_URL = process.env.EVENT_PROCESSOR_URL || 'http://localhost:8000';

// Middleware
app.use(cors());
app.use(express.json());

// API Key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['smolhog-api-key'];
  
  if (!apiKey || apiKey !== 'smolhog-ding-dong') {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway' });
});

// Events endpoint - explicitly handle POST requests
app.post('/api/events', validateApiKey, createProxyMiddleware({
  target: EVENT_PROCESSOR_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/events': '/events'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} to ${EVENT_PROCESSOR_URL}/events`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
}));

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Event Processor URL: ${EVENT_PROCESSOR_URL}`);
});