import express from 'express';
import { registerRoutes } from '../server/routes';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

// Request logging for Vercel debugging
app.use((req, res, next) => {
    console.log(`[Vercel] ${req.method} ${req.url}`);
    next();
});

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Initialize routes synchronously
registerRoutes(server, app).catch(err => {
    console.error("[Vercel] Error during route registration:", err);
});

// Health check route and root-level paths for debugging
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: 'vercel',
        time: new Date().toISOString(),
        url: req.url,
        path: req.path
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: 'vercel',
        context: 'root-health',
        url: req.url
    });
});

export default app;
