import cors from 'cors';
import express from "express";
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT =process.env.PORT || 3001;

app.use(cors())
app.use(express.json());


const validateAPI = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const apiKey = req.headers['smolhog-api-key'];
    if (!apiKey || apiKey!== "smolhog-ding-dong"){
        return res.status(403).json({ message: "Invalid API Credentials" });
    }
    next();
}


app.get('/', (req, res) => {
    res.json({ message: "Welcome to SmolHog API Gateway" });
})



app.use('/api/events', validateAPI, createProxyMiddleware({
  target: process.env.EVENT_PROCESSOR_URL || 'http://localhost:8000',
  changeOrigin: true,
  pathRewrite: {
    '^/api/events': '/events'
  }
}));

app.use('/api/analytics', validateAPI, createProxyMiddleware({
  target: process.env.EVENT_PROCESSOR_URL || 'http://localhost:8000',
  changeOrigin: true,
  pathRewrite: {
    '^/api/analytics': '/analytics'
  }
}));

app.listen(PORT, () => {
  console.log(`SmolHog Gateway listening on http://localhost:${PORT}`);
});