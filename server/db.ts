import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "FATAL: DATABASE_URL is not set. Database operations will fail absolutely.",
  );
} else {
  console.log("DATABASE_URL found, initializing pool...");
}

export const pool = databaseUrl
  ? new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.com") || databaseUrl.includes("pooler.supabase.com")
      ? { rejectUnauthorized: false }
      : false,
    max: 1 // Recommended for serverless to avoid too many connections
  })
  : null;

// Add error handler to the pool
if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
}

export const db = pool ? drizzle(pool, { schema }) : null as any;
