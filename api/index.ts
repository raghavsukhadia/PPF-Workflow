import express from 'express';
import { registerRoutes } from '../server/routes';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Initialize routes asynchronously for Vercel
(async () => {
    try {
        await registerRoutes(server, app);
        console.log("Routes registered successfully in Vercel environment");
    } catch (error) {
        console.error("Failed to register routes:", error);
    }
})();

export default app;
