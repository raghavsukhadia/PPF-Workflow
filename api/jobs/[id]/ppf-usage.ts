import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../storage.js';
import { verifyAuth } from '../../auth.js';
import { insertJobPpfUsageSchema } from '../../schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
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

    const { id } = req.query;
    const jobId = Array.isArray(id) ? id[0] : id;

    if (!jobId) {
        return res.status(400).json({ message: 'Job ID required' });
    }

    try {
        if (req.method === 'GET') {
            const usage = await storage.getJobPpfUsage(jobId);
            return res.status(200).json(usage);
        }

        if (req.method === 'POST') {
            const validatedData = insertJobPpfUsageSchema.parse({
                ...req.body,
                jobId: jobId
            });
            const usage = await storage.createJobPpfUsage(validatedData);
            return res.status(201).json(usage);
        }

        return res.status(405).json({ message: 'Method not allowed' });

    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({
            message: error.message || 'Internal server error'
        });
    }
}
