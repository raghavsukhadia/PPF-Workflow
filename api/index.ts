import express from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

app.use(express.json({ limit: '50mb' }));

// Health check that doesn't depend on ANYTHING
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', source: 'minimal-api-index' });
});

// Diagnostic route
app.get('/api/diagnostic', async (req, res) => {
    const info: any = {
        env: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        cwd: process.cwd(),
        dir: __dirname,
    };

    try {
        const { db } = await import('../server/db');
        info.dbImported = true;
        info.hasPool = !!db;
    } catch (e: any) {
        info.dbError = e.message;
    }

    res.json(info);
});

// Lazy load routes to prevent startup crash
const initRoutes = async () => {
    try {
        console.log("[Vercel] Attempting to load routes...");
        const { registerRoutes } = await import('../server/routes');
        await registerRoutes(server, app);
        console.log("[Vercel] Routes loaded successfully");
    } catch (err: any) {
        console.error("[Vercel] CRITICAL: Failed to load routes:", err);
    }
};

initRoutes();

export default app;
