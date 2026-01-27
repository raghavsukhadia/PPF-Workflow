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

// Health check DIRECTLY on app for maximum visibility
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', context: 'api-index-health', time: new Date().toISOString() });
});

// Initialize routes synchronously
// We don't await here to ensure 'app' is fully configured and exported immediately
registerRoutes(server, app).catch(err => {
    console.error("[Vercel] Initialization error during route registration:", err);
});

export default app;
