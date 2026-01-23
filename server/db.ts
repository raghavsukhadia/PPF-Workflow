import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    "DATABASE_URL is not set. Database operations will fail.",
  );
}

export const pool = databaseUrl
  ? new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.com") ? { rejectUnauthorized: false } : false,
    max: 1 // Recommended for serverless to avoid too many connections
  })
  : null;

export const db = pool ? drizzle(pool, { schema }) : null as any;
