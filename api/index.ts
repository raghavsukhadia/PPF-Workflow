import express from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Logging
app.use((req, res, next) => {
    console.log(`[Vercel Monolith] ${req.method} ${req.url}`);
    next();
});

// Health check - always available
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', source: 'api-index-monolith', time: new Date().toISOString() });
});

// Track route registration status
let routesRegistered = false;
let registrationError: Error | null = null;

// Register routes asynchronously but don't block export
(async () => {
    try {
        console.log("[Vercel] Registering routes...");
        const { registerRoutes } = await import('../server/routes.js');
        await registerRoutes(server, app);
        routesRegistered = true;
        console.log("[Vercel] Routes registered successfully");
    } catch (error: any) {
        registrationError = error;
        console.error("[Vercel] FATAL: Failed to register routes:", error);

        // Add error reporting route
        app.get('/api/startup-error', (req, res) => {
            res.status(500).json({
                error: error.message,
                stack: error.stack,
                routesRegistered: false
            });
        });
    }
})();

// Status endpoint to check if routes are ready
app.get('/api/status', (req, res) => {
    res.json({
        routesRegistered,
        error: registrationError ? registrationError.message : null
    });
});

export default app;
