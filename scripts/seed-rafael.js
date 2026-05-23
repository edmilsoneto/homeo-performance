import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function getGroup(dayIndex) {
  const rand = Math.random();
  const inPeak = (dayIndex >= 60 && dayIndex <= 80) || (dayIndex >= 230 && dayIndex <= 255);
  if (inPeak) {
    if (rand < 0.20) return 'Grupo A';
    if (rand < 0.40) return 'Grupo B';
    if (rand < 0.65) return 'Grupo C';
    return 'Grupo D';
  }
  if (dayIndex < 90) {
    if (rand < 0.10) return 'Grupo A';
    if (rand < 0.40) return 'Grupo B';
    if (rand < 0.75) return 'Grupo C';
    return 'Grupo D';
  }
  if (dayIndex < 180) {
    if (rand < 0.30) return 'Grupo A';
    if (rand < 0.65) return 'Grupo B';
    if (rand < 0.88) return 'Grupo C';
    return 'Grupo D';
  }
  if (dayIndex < 270) {
    if (rand < 0.50) return 'Grupo A';
    if (rand < 0.80) return 'Grupo B';
    if (rand < 0.95) return 'Grupo C';
    return 'Grupo D';
  }
  if (rand < 0.65) return 'Grupo A';
  if (rand < 0.88) return 'Grupo B';
  if (rand < 0.97) return 'Grupo C';
  return 'Grupo D';
}

async function run() {
  console.log('=== Criando atleta "Rafael Teste" com 1 ano de simulação ===\n');

  // Clean up if already exists
  const existing = await pool.query("SELECT id FROM users WHERE name = 'Rafael Teste'");
  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    await pool.query('DELETE FROM shifts WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    console.log('→ Atleta existente removido.');
  }

  // Create athlete
  const insertUser = await pool.query(
    "INSERT INTO users (name, role, pin) VALUES ('Rafael Teste', 'athlete', '9999') RETURNING id, name"
  );
  const athlete = insertUser.rows[0];
  console.log(`✓ Atleta: "${athlete.name}" (ID: ${athlete.id})`);

  // Build 1095 entries
  const shifts = ['Manhã', 'Tarde', 'Noite'];
  const now = new Date();
  const valueStrings = [];
  const params = [];
  let idx = 1;

  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayIndex = 364 - i;

    shifts.forEach((shift, sIdx) => {
      const feedback = getGroup(dayIndex);
      const timestamp = new Date(dateStr + 'T06:00:00').getTime() + (sIdx * 1000 * 3600 * 6);
      valueStrings.push(`($${idx}, $${idx+1}, $${idx+2}, $${idx+3}, $${idx+4}, $${idx+5})`);
      params.push(athlete.id, dateStr, shift, 0, feedback, timestamp);
      idx += 6;
    });
  }

  const start = Date.now();
  const q = `INSERT INTO shifts (user_id, date, shift, intensity, feedback, timestamp) VALUES ${valueStrings.join(', ')} RETURNING id`;
  const result = await pool.query(q, params);
  const elapsed = Date.now() - start;

  console.log(`✓ ${result.rows.length} registros inseridos em ${elapsed}ms`);

  // Verify count
  const countCheck = await pool.query('SELECT COUNT(*) as total FROM shifts WHERE user_id = $1', [athlete.id]);
  console.log(`✓ Verificação: ${countCheck.rows[0].total} registros no banco para este atleta`);

  console.log('\n=== PRONTO ===');
  console.log('Login: nome "Rafael Teste" | PIN: 9999');

  await pool.end();
}

run().catch(err => {
  console.error('ERRO:', err.message);
  pool.end().catch(() => {});
  process.exit(1);
});
