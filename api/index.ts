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
        env: {
            hasDb: !!process.env.DATABASE_URL,
            hasSupabase: !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL),
            hasSupabaseKey: !!(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY),
            nodeEnv: process.env.NODE_ENV
        }
    });
});

// Vercel serverless function handler
export default async function handler(req: Request, res: Response) {
    try {
        return app(req, res);
    } catch (error: any) {
        console.error('Vercel Handler Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
