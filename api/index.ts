import express from 'express';
import { registerRoutes } from '../server/routes';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Initialize routes
// Note: registerRoutes is async but synchronously adds routes to 'app'
registerRoutes(server, app);

export default app;
