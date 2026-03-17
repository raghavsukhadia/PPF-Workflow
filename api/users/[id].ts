import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../storage.js';

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
        return res.status(400).json({ message: 'User ID required' });
    }

    try {
        if (req.method === 'GET') {
            const user = await storage.getUser(id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            // Remove password from response
            const { password, ...userWithoutPassword } = user;
            return res.status(200).json(userWithoutPassword);
        }

        if (req.method === 'DELETE') {
            await storage.deleteUser(id);
            return res.status(200).json({ message: 'User deleted successfully' });
        }

        if (req.method === 'PATCH' || req.method === 'PUT') {
            // This could be implemented if needed to update users
            return res.status(501).json({ message: 'User update not implemented' });
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