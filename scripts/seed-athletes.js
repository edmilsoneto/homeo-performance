import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 3 athletes with distinct behavioral profiles
const ATHLETES = [
  {
    name: 'Atleta Teste 1',
    pin: '1234',
    // Profile: stable overall, with 2 major stress spikes (competitions)
    profile: 'estavel-com-picos',
  },
  {
    name: 'Atleta Teste 2',
    pin: '2345',
    // Profile: progressive improvement over the year (adaptation)
    profile: 'progressao',
  },
  {
    name: 'Atleta Teste 3',
    pin: '3456',
    // Profile: high volatility throughout (chaotic/irregular athlete)
    profile: 'volatil',
  },
];

function getFeedbackForDay(profile, dayIndex, sIdx) {
  const rand = Math.random();

  if (profile === 'estavel-com-picos') {
    // Two competition stress peaks: days 60-75 and 240-255
    const inSpike = (dayIndex >= 60 && dayIndex <= 75) || (dayIndex >= 240 && dayIndex <= 255);
    if (inSpike) {
      // During competitions: erratic scoring
      if (rand < 0.25) return 'Grupo A';
      if (rand < 0.50) return 'Grupo D';
      if (rand < 0.75) return 'Grupo B';
      return 'Grupo C';
    } else {
      // Stable base: mostly A and B
      if (rand < 0.45) return 'Grupo A';
      if (rand < 0.80) return 'Grupo B';
      if (rand < 0.95) return 'Grupo C';
      return 'Grupo D';
    }
  }

  if (profile === 'progressao') {
    // First quarter: low (D and C dominate)
    if (dayIndex < 90) {
      if (rand < 0.10) return 'Grupo A';
      if (rand < 0.35) return 'Grupo B';
      if (rand < 0.65) return 'Grupo C';
      return 'Grupo D';
    }
    // Second quarter: improving (C and B)
    if (dayIndex < 180) {
      if (rand < 0.20) return 'Grupo A';
      if (rand < 0.55) return 'Grupo B';
      if (rand < 0.85) return 'Grupo C';
      return 'Grupo D';
    }
    // Third quarter: good (A and B)
    if (dayIndex < 270) {
      if (rand < 0.40) return 'Grupo A';
      if (rand < 0.75) return 'Grupo B';
      if (rand < 0.92) return 'Grupo C';
      return 'Grupo D';
    }
    // Fourth quarter: excellent (A dominant)
    if (rand < 0.60) return 'Grupo A';
    if (rand < 0.88) return 'Grupo B';
    if (rand < 0.97) return 'Grupo C';
    return 'Grupo D';
  }

  if (profile === 'volatil') {
    // Completely erratic: all groups equally likely with no pattern
    if (rand < 0.25) return 'Grupo A';
    if (rand < 0.50) return 'Grupo B';
    if (rand < 0.75) return 'Grupo C';
    return 'Grupo D';
  }

  return 'Grupo B';
}

async function createAthlete(name, pin) {
  // Remove if already exists (clean re-run)
  const existing = await pool.query('SELECT id FROM users WHERE name = $1', [name]);
  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    await pool.query('DELETE FROM shifts WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    console.log(`  → Atleta existente "${name}" removido para recriação.`);
  }

  const result = await pool.query(
    "INSERT INTO users (name, role, pin) VALUES ($1, 'athlete', $2) RETURNING id, name",
    [name, pin]
  );
  return result.rows[0];
}

async function insertYearOfData(userId, profile) {
  const now = new Date();
  const shifts = ['Manhã', 'Tarde', 'Noite'];

  const valueStrings = [];
  const params = [];
  let index = 1;

  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayIndex = 364 - i;

    shifts.forEach((shift, sIdx) => {
      const feedback = getFeedbackForDay(profile, dayIndex, sIdx);
      const timestamp = new Date(dateStr + 'T06:00:00').getTime() + (sIdx * 1000 * 3600 * 6);

      valueStrings.push(`($${index}, $${index+1}, $${index+2}, $${index+3}, $${index+4}, $${index+5})`);
      params.push(userId, dateStr, shift, 0, feedback, timestamp);
      index += 6;
    });
  }

  const queryText = `
    INSERT INTO shifts (user_id, date, shift, intensity, feedback, timestamp)
    VALUES ${valueStrings.join(', ')}
    RETURNING id
  `;

  const result = await pool.query(queryText, params);
  return result.rows.length;
}

async function run() {
  console.log('=== Gerando 3 atletas teste com 1 ano de simulação ===\n');

  for (const config of ATHLETES) {
    console.log(`\n▶ Criando "${config.name}" (perfil: ${config.profile})...`);
    const athlete = await createAthlete(config.name, config.pin);
    console.log(`  ✓ Atleta criado: ID=${athlete.id}`);

    const start = Date.now();
    const count = await insertYearOfData(athlete.id, config.profile);
    const elapsed = Date.now() - start;
    console.log(`  ✓ ${count} registros inseridos em ${elapsed}ms`);
    console.log(`  ✓ Login → Nome: "${config.name}" | PIN: ${config.pin}`);
  }

  console.log('\n✅ Todos os 3 atletas de teste criados com sucesso!');
  console.log('\nCredenciais de acesso:');
  console.log('  Atleta Teste 1 → PIN: 1234 (estável com picos de competição)');
  console.log('  Atleta Teste 2 → PIN: 2345 (progressão ao longo do ano)');
  console.log('  Atleta Teste 3 → PIN: 3456 (alta volatilidade/caótico)');

  await pool.end();
}

run().catch(err => {
  console.error('Erro fatal:', err);
  pool.end();
  process.exit(1);
});
