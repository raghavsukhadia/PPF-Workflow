import express from 'express';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';

const app = express();
const server = createServer(app);

// Request logging for Vercel debugging
app.use((req, res, next) => {
    console.log(`[Vercel Monolith] ${req.method} ${req.url}`);
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// 1. Health check route - always responds
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        context: 'monolith-api-health',
        time: new Date().toISOString()
    });
});

// 2. Initialize API routes
(async () => {
    try {
        console.log("[Vercel Monolith] Loading API routes...");
        const { registerRoutes } = await import('../server/routes');
        await registerRoutes(server, app);
        console.log("[Vercel Monolith] API routes registered successfully");

        // 3. Serve Static Files from dist/public
        // In the monolith approach, Express serves the frontend too.
        const publicPath = path.join(process.cwd(), 'dist', 'public');

        if (fs.existsSync(publicPath)) {
            console.log(`[Vercel Monolith] Serving static files from: ${publicPath}`);
            app.use(express.static(publicPath));

            // 4. Catch-all for SPA routing (Frontend)
            app.get('*', (req, res, next) => {
                // Skip if it's an API route that somehow didn't match (already handled in registerRoutes)
                if (req.path.startsWith('/api')) {
                    return res.status(404).json({ message: `API route not found: ${req.path}` });
                }

                const indexPath = path.join(publicPath, 'index.html');
                if (fs.existsSync(indexPath)) {
                    res.sendFile(indexPath);
                } else {
                    res.status(404).send("Frontend assets not found. Build may have failed.");
                }
            });
        } else {
            console.warn(`[Vercel Monolith] Static path NOT FOUND: ${publicPath}`);
            console.log("[Vercel Monolith] Current Dir Content:", fs.readdirSync(process.cwd()));
        }
    } catch (error: any) {
        console.error("[Vercel Monolith] FATAL ERROR during startup:", error);

        // Error reporting route
        app.get('/api/debug-error', (req, res) => {
            res.status(500).json({
                error: error.message,
                stack: error.stack,
                cwd: process.cwd()
            });
        });
    }
})();

export default app;
