import cors from 'cors';
import express from "express";
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3001;
const API_URL = process.env.EVENT_PROCESSOR_URL || 'http://localhost:8000';

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', "OPTIONS"],
    allowedHeaders: ['Content-Type', 'Authorization', 'smolhog-api-key']
}));

app.use(express.json());
app.get('/', (req, res) => {
    res.json({ message: "Welcome to SmolHog API Gateway" });
});


const createProxyOptions = (pathRewrite: { [key: string]: string }) => ({
    target: API_URL,
    changeOrigin: true,
    pathRewrite,
    onError: (err: Error, req: express.Request, res: express.Response) => {
        console.error('Proxy Error:', err.message);
        console.error('Target URL:', API_URL);
        console.error('Request URL:', req.url);
        res.status(500).json({ error: 'Proxy error', message: err.message });
    },
    onProxyReq: (proxyReq: any, req: express.Request, res: express.Response) => {
        Object.keys(req.headers).forEach(key => {
            proxyReq.setHeader(key, req.headers[key]);
        });
        console.log(`Proxying ${req.method} ${req.url} to ${API_URL}${proxyReq.path}`);
        console.log('Headers being forwarded:', req.headers);
    },
    onProxyRes: (proxyRes: any, req: express.Request, res: express.Response) => {
        console.log(`Proxy response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
    }
});


app.use((req, res, next) => {
    const startTime = Date.now();

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
    console.log(`Query: ${JSON.stringify(req.query, null, 2)}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`Body: ${JSON.stringify(req.body, null, 2)}`);
    }

    const originalEnd = res.end;
    res.end = function (chunk, encoding, cb) {
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);

        if (res.statusCode >= 400) {
            console.error(`Error Response: Status ${res.statusCode}`);
            if (chunk) {
                console.error(`Error Body: ${chunk.toString()}`);
            }
        }

        return originalEnd.call(this, chunk, encoding, cb);
    };

    next();
});


app.use('/api/events', createProxyMiddleware(createProxyOptions({
    '^/': '/events'
})));

app.use('/api/analytics/events', createProxyMiddleware(createProxyOptions({
    '^/': '/analytics/events'
})));

app.use('/api/analytics/stats', createProxyMiddleware(createProxyOptions({
    '^/': '/analytics/stats'
})));

app.listen(PORT, () => {
    console.log(`SmolHog Gateway listening on http://localhost:${PORT}`);
    console.log(`Proxying requests to: ${API_URL}`);
});