import { VercelRequest, VercelResponse } from '@vercel/node';

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

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const diagnostic: any = {
        timestamp: new Date().toISOString(),
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            has_DATABASE_URL: !!process.env.DATABASE_URL,
            has_VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
            has_VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
        },
        vercel: {
            isVercel: !!process.env.VERCEL,
            vercelEnv: process.env.VERCEL_ENV,
            vercelUrl: process.env.VERCEL_URL,
            vercelRegion: process.env.VERCEL_REGION,
        }
    };

    // Test database connection
    try {
        const { db } = await import('./db');
        diagnostic.database = { connectionAttempted: true };
        // Try a simple query
        const result = await db.execute('SELECT 1 as test');
        diagnostic.database.connectionSuccessful = true;
        diagnostic.database.testResult = result;
    } catch (dbError: any) {
        diagnostic.database = {
            connectionAttempted: true,
            connectionSuccessful: false,
            error: dbError.message,
            errorType: dbError.constructor.name
        };
    }

    return res.status(200).json(diagnostic);
}