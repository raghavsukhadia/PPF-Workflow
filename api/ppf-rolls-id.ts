import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from './storage.js';
import { verifyAuth } from './auth.js';
import { z } from 'zod';

const updatePpfRollSchema = z.object({
    status: z.enum(['active', 'depleted', 'disposed']).optional(),
    batchNo: z.string().optional(),
    imageUrl: z.string().optional(),
}).strict();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    const auth = await verifyAuth(req, res);
    if (!auth) return;

    const { id } = req.query;
    const rollId = Array.isArray(id) ? id[0] : id;
    if (!rollId) return res.status(400).json({ message: 'Roll ID required' });

    try {
        if (req.method === 'PATCH') {
            const validated = updatePpfRollSchema.parse(req.body);
            const roll = await storage.updatePpfRoll(rollId, validated);
            if (!roll) return res.status(404).json({ message: 'PPF roll not found' });
            return res.status(200).json(roll);
        }

        if (req.method === 'DELETE') {
            await storage.deletePpfRoll(rollId);
            return res.status(200).json({ message: 'PPF roll deleted successfully' });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ message: error.message || 'Internal server error' });
    }
}
