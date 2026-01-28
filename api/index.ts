import express from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Logging
app.use((req, res, next) => {
    console.log(`[Vercel] ${req.method} ${req.url}`);
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', source: 'express-monolith', time: new Date().toISOString() });
});

// Lazy load and register routes
let routesLoaded = false;
(async () => {
    try {
        console.log("[Vercel] Loading routes...");
        // Dynamic import with .js extension for ESM
        const routesModule = await import('../server/routes.js');
        await routesModule.registerRoutes(server, app);
        routesLoaded = true;
        console.log("[Vercel] Routes loaded successfully");
    } catch (error: any) {
        console.error("[Vercel] Failed to load routes:", error);
        app.get('/api/error', (req, res) => {
            res.status(500).json({ error: error.message, stack: error.stack });
        });
    }
})();

export default app;
