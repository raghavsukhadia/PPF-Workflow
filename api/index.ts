import type { Request, Response } from 'express';
import express from 'express';
import { registerRoutes } from '../server/routes';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Initialize routes
registerRoutes(server, app);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        url: req.url,
        env: {
            hasDb: !!process.env.DATABASE_URL,
            hasSupabase: !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL),
            hasSupabaseKey: !!(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY),
            nodeEnv: process.env.NODE_ENV
        }
    });
});

// Logging and normalization for troubleshooting
app.use((req, res, next) => {
    const originalUrl = req.url;
    // Normalize URL for routing: ensure it starts with /api if it doesn't
    // This handles cases where Vercel might strip the /api prefix when routing to this function
    if (!req.url.startsWith('/api')) {
        req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
    }
    console.log(`Vercel Routing: ${req.method} ${originalUrl} -> ${req.url}`);
    next();
});

export default app;
