import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../storage.js';
import { verifyAuth } from '../../auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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
        if (req.method === 'POST') {
            const job = await storage.getJob(jobId);
            if (!job) {
                return res.status(404).json({ message: 'Job not found' });
            }

            const stages = typeof job.stages === 'string' ? JSON.parse(job.stages as string) : job.stages;
            if (stages && stages[10]) {
                stages[10] = {
                    ...stages[10],
                    status: 'completed',
                    completedAt: new Date().toISOString()
                };
            }

            const updatedJob = await storage.updateJob(jobId, {
                status: 'delivered',
                stages: JSON.stringify(stages)
            });

            return res.status(200).json(updatedJob);
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ message: error.message || 'Internal server error' });
    }
}
