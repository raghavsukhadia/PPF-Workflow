import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from './storage.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Job ID required' });
    }

    try {
        if (req.method === 'GET') {
            const job = await storage.getJob(id);
            if (!job) {
                return res.status(404).json({ message: 'Job not found' });
            }
            return res.status(200).json(job);
        }

        if (req.method === 'PATCH') {
            const job = await storage.updateJob(id, req.body);
            if (!job) {
                return res.status(404).json({ message: 'Job not found' });
            }
            return res.status(200).json(job);
        }

        if (req.method === 'DELETE') {
            await storage.deleteJob(id);
            return res.status(200).json({ message: 'Job deleted successfully' });
        }

        return res.status(405).json({ message: 'Method not allowed' });

    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({
            message: error.message || 'Internal server error',
            type: error.constructor.name,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
