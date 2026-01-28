import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from './storage.js';
import { insertServicePackageSchema } from '../shared/schema';

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

    try {
        if (req.method === 'GET') {
            const packages = await storage.getAllServicePackages();
            return res.status(200).json(packages);
        }

        if (req.method === 'POST') {
            const validatedData = insertServicePackageSchema.parse(req.body);
            const pkg = await storage.createServicePackage(validatedData);
            return res.status(201).json(pkg);
        }

        if (req.method === 'DELETE') {
            const id = req.query.id as string;
            if (!id) {
                return res.status(400).json({ message: 'Package ID required' });
            }
            await storage.deleteServicePackage(id);
            return res.status(200).json({ message: 'Package deleted successfully' });
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
