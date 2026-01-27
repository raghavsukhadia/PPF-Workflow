import express from 'express';
import { createServer } from 'http';

// diagnostic info
console.log("[Vercel] Function starting...");
console.log("[Vercel] Filesystem check:", __dirname);

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
        time: new Date().toISOString()
    });
});

// Wrap route registration in a way that catches initialization errors
async function initialize() {
    try {
        console.log("[Vercel] Importing routes...");
        const { registerRoutes } = await import('../server/routes');
        console.log("[Vercel] Registering routes...");
        await registerRoutes(server, app);
        console.log("[Vercel] Route registration completed");
    } catch (err: any) {
        console.error("[Vercel] FATAL ERROR during initialization:", err);

        // Add a fallback route to report the error if we are in development/debug
        app.get('/api/error-debug', (req, res) => {
            res.status(500).json({
                error: err.message,
                stack: err.stack,
                context: "Initialization failure"
            });
        });
    }
}

initialize();

export default app;
