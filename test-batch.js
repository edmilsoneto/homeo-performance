import 'dotenv/config';
import fetch from 'node-fetch';

async function run() {
  console.log('Logging in...');
  const loginRes = await fetch('https://homeo-performance.vercel.app/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'MatheusCordeiro', pin: '010902' })
  });
  
  if (!loginRes.ok) return console.error('Login failed');
  const auth = await loginRes.json();
  
  console.log('Inserting batch...');
  const res = await fetch('https://homeo-performance.vercel.app/api/entries', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + auth.token
    },
    body: JSON.stringify([
      { userId: '26e4747d-ae3e-4f7c-8548-facdccbeab68', date: '2026-05-24', shift: 'Manhã', intensity: 5, feedback: 'B', timestamp: Date.now() }
    ])
  });
  
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}

run();
