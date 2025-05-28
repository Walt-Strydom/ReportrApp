import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Supabase database connection - your authentic production database
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required for Supabase connection");
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });