import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../server/routes';

const app = express();
const server = createServer(app);

// Request parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Logging
app.use((req, res, next) => {
    console.log(`[Vercel] ${req.method} ${req.url}`);
    next();
});

// Health check with multiple possible path matches for Vercel
app.get(['/api/health', '/health'], (req, res) => {
    res.json({
        status: 'ok',
        url: req.url,
        path: req.path,
        context: 'flexible-health'
    });
});

// Debug route to see what path Express is actually receiving
app.get('/api/debug-path', (req, res) => {
    res.json({
        url: req.url,
        path: req.path,
        params: req.params,
        query: req.query,
        baseUrl: req.baseUrl
    });
});

// Initialize routes synchronously
registerRoutes(server, app).catch(err => {
    console.error("[Vercel] Initialization error during route registration:", err);
});

export default app;
