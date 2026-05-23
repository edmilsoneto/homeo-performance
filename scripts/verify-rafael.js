import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  // Get Rafael's user ID
  const user = await pool.query("SELECT id, name FROM users WHERE name = 'Rafael Teste'");
  if (!user.rows.length) {
    console.log('Rafael Teste não encontrado no banco!');
    return;
  }
  const { id, name } = user.rows[0];
  console.log(`Atleta: ${name} | ID: ${id}`);
  
  // Count entries
  const count = await pool.query('SELECT COUNT(*) as total FROM shifts WHERE user_id = $1', [id]);
  console.log(`Total de shifts no banco: ${count.rows[0].total}`);
  
  // Sample a few entries
  const sample = await pool.query('SELECT date, shift, feedback FROM shifts WHERE user_id = $1 ORDER BY date ASC LIMIT 5', [id]);
  console.log('Primeiros 5 registros:', JSON.stringify(sample.rows, null, 2));
  
  const sample2 = await pool.query('SELECT date, shift, feedback FROM shifts WHERE user_id = $1 ORDER BY date DESC LIMIT 5', [id]);
  console.log('Últimos 5 registros:', JSON.stringify(sample2.rows, null, 2));
  
  await pool.end();
}

run().catch(console.error);
