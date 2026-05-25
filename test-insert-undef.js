import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const name = 'TestUndef ' + Date.now();
    const whatsapp = undefined;
    const result = await sql`
        INSERT INTO users (name, role, pin, whatsapp) 
        VALUES (${name}, 'athlete', '1234', ${whatsapp || null})
        RETURNING id, name, role, whatsapp
      `;
    console.log("Success:", result);
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}

run();
