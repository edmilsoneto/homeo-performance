import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const users = await sql`SELECT id, name FROM users WHERE name = 'teste'`;
  if (users.length > 0) {
    const id = users[0].id;
    const count = await sql`SELECT COUNT(*) FROM shifts WHERE user_id = ${id}`;
    console.log("Entries for teste:", count);
  }
  process.exit(0);
}

run();
