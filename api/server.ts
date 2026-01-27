import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../server/routes';

const app = express();
const server = createServer(app);

// Request body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// 1. Synchronous diagnostic route
app.get('/api/ping', (req, res) => {
    res.json({
        status: 'pong',
        time: new Date().toISOString(),
        env: 'vercel-server'
    });
});

// 2. Top-level await for full route registration
// This ensures that by the time Vercel invokes this function, 
// all API routes from server/routes.ts are already attached to 'app'.
try {
    console.log("[Vercel] Registering routes...");
    await registerRoutes(server, app);
    console.log("[Vercel] Route registration complete");
} catch (error: any) {
    console.error("[Vercel] Failed to register routes during startup:", error);

    // Fallback error route
    app.get('/api/startup-error', (req, res) => {
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    });
}

export default app;
