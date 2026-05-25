import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const users = await sql`SELECT id, name, role, pin, whatsapp FROM users`;
  console.log(users);
  process.exit(0);
}

run();
