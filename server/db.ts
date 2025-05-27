import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Direct connection to your Supabase database
const supabaseConnectionString = "postgresql://postgres:Xn7Lxen.3LCzYQJ@db.tnzyloggrqsmovjnytyb.supabase.co:5432/postgres";

export const pool = new Pool({ 
  connectionString: supabaseConnectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });