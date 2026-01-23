import type { Request, Response } from 'express';
import express from 'express';
import { registerRoutes } from '../server/routes';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize routes
registerRoutes(server, app);

// Vercel serverless function handler
export default async function handler(req: Request, res: Response) {
    // Wait for routes to be registered if needed (registerRoutes is async)
    // But here we rely on the side effects or internal setups. 
    // Ideally registerRoutes should be awaited if it does async setup.
    // Since we called it above, it returns a promise. We should probably await it inside the handler
    // or at top level if supported. Best practice for Vercel:

    // Note: Vercel caches the module, so top level execution happens once per cold start.

    return app(req, res);
}
