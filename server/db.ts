import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Check for DATABASE_URL but log warning instead of throwing immediately
if (!process.env.DATABASE_URL) {
  console.error("WARNING: DATABASE_URL is not set. Database operations will fail.");
  console.error("Please ensure DATABASE_URL is configured in your secrets.");
}

// Create pool with fallback to prevent immediate crash
const connectionString = process.env.DATABASE_URL || "";

export const pool = new Pool({ 
  connectionString,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 0,
  max: 20,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export const db = drizzle(pool, { schema });
