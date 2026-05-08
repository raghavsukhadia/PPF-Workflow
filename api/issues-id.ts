import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from './storage.js';
import { verifyAuth } from './auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    const auth = await verifyAuth(req, res);
    if (!auth) return;

    const { id } = req.query;
    const issueId = Array.isArray(id) ? id[0] : id;
    if (!issueId) return res.status(400).json({ message: 'Issue ID required' });

    try {
        if (req.method === 'PATCH') {
            const updateData = { ...req.body };
            if (updateData.status === 'resolved' && !updateData.resolvedBy) {
                updateData.resolvedBy = auth.user.name || auth.user.username || 'Unknown';
                updateData.resolvedAt = new Date().toISOString();
            }
            const issue = await storage.updateJobIssue(issueId, updateData);
            if (!issue) return res.status(404).json({ message: 'Issue not found' });
            return res.status(200).json(issue);
        }

        if (req.method === 'DELETE') {
            await storage.deleteJobIssue(issueId);
            return res.status(200).json({ message: 'Issue deleted successfully' });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ message: error.message || 'Internal server error' });
    }
}
