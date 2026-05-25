import fetch from 'node-fetch';

async function run() {
  console.log('Logging in...');
  const loginRes = await fetch('https://homeo-performance.vercel.app/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'admin', pin: '010902' })
  });
  
  if (!loginRes.ok) {
    const text = await loginRes.text();
    console.error('Login failed', text);
    return;
  }
  
  const auth = await loginRes.json();
  console.log('Login success, token:', auth.token.substring(0, 20) + '...');
  
  console.log('Registering athlete...');
  const regRes = await fetch('https://homeo-performance.vercel.app/api/athletes', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`
    },
    body: JSON.stringify({ name: `Test ${Date.now()}`, pin: '1234', whatsapp: '11999999999' })
  });
  
  const text = await regRes.text();
  console.log('Status:', regRes.status);
  console.log('Response:', text);
}

run();
