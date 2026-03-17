import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export interface AuthContext {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        username: string;
    };
}

export async function verifyAuth(req: VercelRequest, res: VercelResponse): Promise<AuthContext | null> {
    if (!supabase) {
        console.error("Supabase client not initialized.");
        res.status(500).json({ message: "Auth service unavailable" });
        return null;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ message: "No authorization header" });
        return null;
    }

    const token = authHeader.replace("Bearer ", "");
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            res.status(401).json({ message: "Invalid token" });
            return null;
        }

        return {
            user: {
                id: user.id,
                email: user.email || '',
                name: user.user_metadata?.name || user.email || 'Unknown',
                role: user.user_metadata?.role || "user",
                username: user.user_metadata?.username || user.email || 'Unknown',
            }
        };
    } catch (e) {
        res.status(401).json({ message: "Auth verification failed" });
        return null;
    }
}
