import express from 'express';
import { registerRoutes } from '../server/routes';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

// Request logging for Vercel debugging
app.use((req, res, next) => {
    console.log(`[Vercel] ${req.method} ${req.url}`);
    next();
});

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Initialize routes synchronously
// Even though registerRoutes is async, it adds routes to 'app' immediately in its body
registerRoutes(server, app).catch(err => {
    console.error("Error during route registration:", err);
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: 'vercel' });
});

export default app;
