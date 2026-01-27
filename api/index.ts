import express from 'express';
import { registerRoutes } from '../server/routes';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

// Request logging for Vercel debugging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [Vercel] ${req.method} ${req.url}`);
    next();
});

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Health check route - defined BEFORE external routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API is working',
        environment: 'vercel',
        url: req.url,
        timestamp: new Date().toISOString()
    });
});

// Initialize routes synchronously
console.log("[Vercel] Starting route registration...");
registerRoutes(server, app)
    .then(() => {
        console.log("[Vercel] Route registration completed");
    })
    .catch(err => {
        console.error("[Vercel] Error during route registration:", err);
    });

// Catch-all for API routes that didn't match
app.use('/api/*', (req, res) => {
    console.log(`[Vercel] API 404: ${req.method} ${req.url}`);
    res.status(404).json({
        message: `API route not found: ${req.method} ${req.url}`,
        suggestion: "Check your route definitions in server/routes.ts"
    });
});

export default app;
