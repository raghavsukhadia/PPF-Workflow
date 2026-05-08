import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from './storage.js';
import { verifyAuth } from './auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    const auth = await verifyAuth(req, res);
    if (!auth) return;

    const { id } = req.query;
    const usageId = Array.isArray(id) ? id[0] : id;
    if (!usageId) return res.status(400).json({ message: 'Usage ID required' });

    try {
        if (req.method === 'DELETE') {
            await storage.deleteJobPpfUsage(usageId);
            return res.status(200).json({ message: 'PPF usage deleted successfully' });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ message: error.message || 'Internal server error' });
    }
}
