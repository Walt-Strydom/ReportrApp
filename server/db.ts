import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Force use of your Supabase database to ensure authentic data
const databaseUrl = "postgresql://postgres:Xn7Lxen.3LCzYQJ@db.tnzyloggrqsmovjnytyb.supabase.co:5432/postgres";

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });