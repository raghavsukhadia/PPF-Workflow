import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../storage.js';
import { verifyAuth } from '../auth.js';
import { insertJobSchema } from '../schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const auth = await verifyAuth(req, res);
    if (!auth) return;

    try {
        if (req.method === 'GET') {
            const jobs = await storage.getAllJobs();
            return res.status(200).json(jobs);
        }

        if (req.method === 'POST') {
            const validatedData = insertJobSchema.parse(req.body);
            const job = await storage.createJob(validatedData);
            return res.status(201).json(job);
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ message: error.message || 'Internal server error' });
    }
}
