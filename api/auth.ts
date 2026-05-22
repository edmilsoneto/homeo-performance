import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { name, pin } = req.body;
  const sql = neon(process.env.DATABASE_URL);

  try {
    const users = await sql`
      SELECT id, name, role 
      FROM users 
      WHERE name = ${name} AND pin = ${pin}
      LIMIT 1
    `;

    if (users.length > 0) {
      return res.status(200).json(users[0]);
    } else {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erro de servidor' });
  }
}
