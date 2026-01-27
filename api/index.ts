import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("[Vercel] Starting Express server...");

const app = express();
const server = createServer(app);

// Request logging
app.use((req, res, next) => {
    console.log(`[Vercel] ${req.method} ${req.url}`);
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: 'vercel', time: new Date().toISOString() });
});

// Import and register routes
async function start() {
    try {
        const { registerRoutes } = await import('../server/routes');
        await registerRoutes(server, app);
        console.log("[Vercel] Routes registered");

        // Serve static files from dist/public
        // Note: We use process.cwd() to find the root directory in Vercel
        const publicPath = path.join(process.cwd(), 'dist', 'public');

        if (fs.existsSync(publicPath)) {
            console.log(`[Vercel] Serving static files from ${publicPath}`);
            app.use(express.static(publicPath));

            // Catch-all for SPA routing
            app.get('*', (req, res, next) => {
                if (req.path.startsWith('/api')) return next();
                res.sendFile(path.join(publicPath, 'index.html'));
            });
        } else {
            console.error(`[Vercel] Static path not found: ${publicPath}`);
            // List files in current directory to help debug
            console.log("[Vercel] Current Dir Content:", fs.readdirSync(process.cwd()));
        }
    } catch (error) {
        console.error("[Vercel] Initialization error:", error);
    }
}

start();

export default app;
