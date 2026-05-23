import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    // 1. Find a test user (athlete)
    const userRes = await pool.query("SELECT id, name FROM users WHERE role = 'athlete' LIMIT 1");
    if (userRes.rows.length === 0) {
      console.log('Nenhum atleta cadastrado para testar.');
      return;
    }
    const athlete = userRes.rows[0];
    console.log(`Atleta de teste: ${athlete.name} (${athlete.id})`);

    // 2. Prepare 365 days of entries
    const entries = [];
    const now = new Date();
    const shifts = ['Manhã', 'Tarde', 'Noite'];
    
    for (let i = 364; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      shifts.forEach((shift, sIdx) => {
        entries.push({
          userId: athlete.id,
          date: dateStr,
          shift,
          intensity: 0,
          feedback: 'Grupo A',
          timestamp: now.getTime() - (i * 86400000) + (sIdx * 3600000)
        });
      });
    }

    console.log(`Gerados ${entries.length} registros para inserção.`);

    // 3. Try to bulk insert
    const valueStrings = [];
    const params = [];
    let index = 1;

    for (const entry of entries) {
      const { userId, date, shift, intensity, feedback, timestamp } = entry;
      valueStrings.push(`($${index}, $${index+1}, $${index+2}, $${index+3}, $${index+4}, $${index+5})`);
      params.push(userId, date, shift, intensity || 0, feedback, timestamp);
      index += 6;
    }

    const queryText = `
      INSERT INTO shifts (user_id, date, shift, intensity, feedback, timestamp)
      VALUES ${valueStrings.join(', ')}
      RETURNING *
    `;

    console.log('Executando query de inserção em lote (1095 registros)...');
    const startTime = Date.now();
    const result = await pool.query(queryText, params);
    const endTime = Date.now();
    console.log(`Sucesso! Registros inseridos: ${result.rows.length} em ${endTime - startTime}ms`);

    // Let's delete the test entries we just created
    await pool.query("DELETE FROM shifts WHERE user_id = $1", [athlete.id]);
    console.log('Registros de teste excluídos para limpar o banco.');

  } catch (err) {
    console.error('ERRO DETECTADO NO BANCO:', err);
  } finally {
    await pool.end();
  }
}

run();
