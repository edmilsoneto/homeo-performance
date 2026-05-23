import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    console.log('Verificando estrutura da tabela shifts...');
    
    // Columns query
    const columnsRes = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'shifts'
    `);
    console.log('\n--- Colunas de shifts ---');
    console.table(columnsRes.rows);

    // Constraints query
    const constraintsRes = await pool.query(`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'shifts'::regclass
    `);
    console.log('\n--- Restrições (Constraints) de shifts ---');
    console.table(constraintsRes.rows);

    // Let's check how many entries are there for test athlete if any
    const countRes = await pool.query(`
      SELECT user_id, COUNT(*) 
      FROM shifts 
      GROUP BY user_id
    `);
    console.log('\n--- Contagem de registros por usuário ---');
    console.table(countRes.rows);

  } catch (err) {
    console.error('Erro ao verificar DB:', err);
  } finally {
    await pool.end();
  }
}

run();
