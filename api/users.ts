import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from './storage.js';
import { insertUserSchema } from './schema.js';

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
            const users = await storage.getAllUsers();
            // Remove passwords from response
            const usersWithoutPasswords = users.map(({ password, ...user }) => user);
            return res.status(200).json(usersWithoutPasswords);
        }

        if (req.method === 'POST') {
            // Note: In production, user creation should go through Supabase Auth
            // This is just for admin operations
            const validatedData = insertUserSchema.parse(req.body);
            const user = await storage.createUser(validatedData);
            // Remove password from response
            const { password, ...userWithoutPassword } = user;
            return res.status(201).json(userWithoutPassword);
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