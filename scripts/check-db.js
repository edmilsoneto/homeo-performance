import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function run() {
  // Check what's in the DB
  const counts = await sql`SELECT user_id, COUNT(*) as total FROM shifts GROUP BY user_id`;
  console.log('Shifts per user in DB:', JSON.stringify(counts, null, 2));
  
  const athletes = await sql`SELECT id, name FROM users WHERE role = 'athlete'`;
  console.log('Athletes:', JSON.stringify(athletes, null, 2));
}

run().catch(console.error);
