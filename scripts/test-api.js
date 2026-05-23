// Test the production API directly
const VERCEL_URL = 'https://homeo-performance.vercel.app';

async function run() {
  console.log('=== Testando API de produção ===\n');

  // Test GET /api/athletes
  console.log('1. GET /api/athletes...');
  try {
    const r = await fetch(`${VERCEL_URL}/api/athletes`);
    const data = await r.json();
    console.log(`   Status: ${r.status}`);
    console.log(`   Atletas: ${JSON.stringify(data)}\n`);
  } catch (e) {
    console.log(`   ERRO: ${e.message}\n`);
  }

  // Test GET /api/entries (all)
  console.log('2. GET /api/entries (all)...');
  try {
    const r = await fetch(`${VERCEL_URL}/api/entries`);
    const text = await r.text();
    console.log(`   Status: ${r.status}`);
    try {
      const data = JSON.parse(text);
      console.log(`   Total entries: ${Array.isArray(data) ? data.length : 'N/A'}`);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`   Exemplo: ${JSON.stringify(data[0])}`);
        // Group by user_id
        const byUser = {};
        data.forEach(e => {
          const uid = e.user_id || e.userId;
          byUser[uid] = (byUser[uid] || 0) + 1;
        });
        console.log(`   Por usuário: ${JSON.stringify(byUser)}`);
      }
    } catch {
      console.log(`   Resposta não é JSON: ${text.substring(0, 200)}`);
    }
    console.log('');
  } catch (e) {
    console.log(`   ERRO: ${e.message}\n`);
  }
}

run();
