import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Direct connection to your Supabase database using transaction pooler
const supabaseConnectionString = "postgresql://postgres.wcyrbgcgbynigibbmchn:Xn7Lxen.3LCzYQJ@aws-0-eu-west-2.pooler.supabase.com:6543/postgres";

export const pool = new Pool({ 
  connectionString: supabaseConnectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });