import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../server/routes';

const app = express();
const server = createServer(app);

// Simple logging
app.use((req, res, next) => {
    console.log(`[Vercel] ${req.method} ${req.url}`);
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Health check DIRECTLY on app for maximum visibility
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', context: 'direct-api-health', time: new Date().toISOString() });
});

// Initialize routes synchronously
// Note: We don't await here to ensure 'app' is fully configured before export
registerRoutes(server, app).catch(err => {
    console.error("[Vercel] Initialization error:", err);
});

export default app;
