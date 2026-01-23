import type { Request, Response } from 'express';
import express from 'express';
import { registerRoutes } from '../server/routes';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Initialize only once
let isInitialized = false;
const initPromise = (async () => {
    await registerRoutes(server, app);
    isInitialized = true;
})();

export default async function handler(req: Request, res: Response) {
    try {
        await initPromise;

        const originalUrl = req.url || '';

        // Normalize URL for routing: ensure it starts with /api if it doesn't
        // This handles cases where Vercel might strip the /api prefix when routing to this function
        if (!originalUrl.startsWith('/api')) {
            req.url = '/api' + (originalUrl.startsWith('/') ? '' : '/') + originalUrl;
        }

        console.log(`[Vercel] ${req.method} ${originalUrl} -> ${req.url}`);

        // Error handling middleware
        app.use((err: any, _req: any, res: any, _next: any) => {
            console.error('Express Error:', err);
            res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
        });

        return app(req, res);
    } catch (error: any) {
        console.error("Critical Handler Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
