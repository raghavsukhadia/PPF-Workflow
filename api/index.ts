import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../server/routes';

const app = express();
const server = createServer(app);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Logging
app.use((req, res, next) => {
    console.log(`[Vercel Monolith] ${req.method} ${req.url}`);
    next();
});

// Health check - defined before route registration
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', source: 'api-index-monolith', time: new Date().toISOString() });
});

// Top-level await to ensure routes are registered before handling requests
try {
    console.log("[Vercel] Registering routes...");
    await registerRoutes(server, app);
    console.log("[Vercel] Routes registered successfully");
} catch (error: any) {
    console.error("[Vercel] FATAL: Failed to register routes:", error);

    // Error reporting route
    app.get('/api/startup-error', (req, res) => {
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    });
}

export default app;
