import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

// All 365 days × 3 shifts = 1095 entries, split into chunks of 90
const CHUNK_SIZE = 90; // 30 days × 3 shifts per chunk

function getGroup(dayIndex, rand) {
  // Athlete profile: starts rough (C/D), builds through the year, 2 stress peaks
  const inPeak = (dayIndex >= 60 && dayIndex <= 80) || (dayIndex >= 230 && dayIndex <= 255);
  if (inPeak) {
    // Competition/stress peak: volatile, D spikes
    if (rand < 0.20) return 'Grupo A';
    if (rand < 0.40) return 'Grupo B';
    if (rand < 0.65) return 'Grupo C';
    return 'Grupo D';
  }
  if (dayIndex < 90) {
    // Q1: building base – C/B dominant
    if (rand < 0.10) return 'Grupo A';
    if (rand < 0.40) return 'Grupo B';
    if (rand < 0.75) return 'Grupo C';
    return 'Grupo D';
  }
  if (dayIndex < 180) {
    // Q2: improving – B/A growing
    if (rand < 0.30) return 'Grupo A';
    if (rand < 0.65) return 'Grupo B';
    if (rand < 0.88) return 'Grupo C';
    return 'Grupo D';
  }
  if (dayIndex < 270) {
    // Q3: strong – A/B dominant
    if (rand < 0.50) return 'Grupo A';
    if (rand < 0.80) return 'Grupo B';
    if (rand < 0.95) return 'Grupo C';
    return 'Grupo D';
  }
  // Q4: peak form – A dominant
  if (rand < 0.65) return 'Grupo A';
  if (rand < 0.88) return 'Grupo B';
  if (rand < 0.97) return 'Grupo C';
  return 'Grupo D';
}

async function run() {
  console.log('=== Criando atleta teste com 1 ano de simulação ===\n');

  // Check if already exists and clean up
  const existing = await sql`SELECT id FROM users WHERE name = 'Rafael Teste'`;
  if (existing.length > 0) {
    const id = existing[0].id;
    await sql`DELETE FROM shifts WHERE user_id = ${id}`;
    await sql`DELETE FROM users WHERE id = ${id}`;
    console.log('→ Atleta existente removido para recriação.');
  }

  // Create athlete
  const result = await sql`
    INSERT INTO users (name, role, pin) VALUES ('Rafael Teste', 'athlete', '9999')
    RETURNING id, name
  `;
  const athlete = result[0];
  console.log(`✓ Atleta criado: "${athlete.name}" (ID: ${athlete.id})`);

  // Build 1095 entries
  const shifts = ['Manhã', 'Tarde', 'Noite'];
  const now = new Date();
  const allEntries = [];

  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayIndex = 364 - i;

    shifts.forEach((shift, sIdx) => {
      const rand = Math.random();
      const feedback = getGroup(dayIndex, rand);
      const timestamp = new Date(dateStr + 'T06:00:00').getTime() + (sIdx * 1000 * 3600 * 6);
      allEntries.push([athlete.id, dateStr, shift, 0, feedback, timestamp]);
    });
  }

  // Insert in chunks of CHUNK_SIZE
  let totalInserted = 0;
  const chunks = Math.ceil(allEntries.length / CHUNK_SIZE);

  for (let c = 0; c < chunks; c++) {
    const chunk = allEntries.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
    const valueStrings = [];
    const params = [];
    let idx = 1;
    for (const [uid, date, shift, intensity, feedback, timestamp] of chunk) {
      valueStrings.push(`($${idx}, $${idx+1}, $${idx+2}, $${idx+3}, $${idx+4}, $${idx+5})`);
      params.push(uid, date, shift, intensity, feedback, timestamp);
      idx += 6;
    }
    const q = `INSERT INTO shifts (user_id, date, shift, intensity, feedback, timestamp) VALUES ${valueStrings.join(', ')}`;
    await sql.unsafe(q, params);
    totalInserted += chunk.length;
    process.stdout.write(`\r  Inserindo... ${totalInserted}/${allEntries.length} registros`);
  }

  console.log(`\n✓ ${totalInserted} registros inseridos com sucesso!`);
  console.log('\n=== PRONTO ===');
  console.log('Atleta: "Rafael Teste" | PIN: 9999');
  console.log('Perfil: progressão ao longo do ano + 2 picos de estresse (dias 60-80 e 230-255)');

  // Verify
  const count = await sql`SELECT COUNT(*) as total FROM shifts WHERE user_id = ${athlete.id}`;
  console.log(`\nVerificação no banco: ${count[0].total} registros encontrados para este atleta.`);
}

run().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
