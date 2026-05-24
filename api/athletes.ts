import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { verifyToken } from './_utils/auth';

// Vercel Serverless Function
export default async function handler(req, res) {
  let tokenUser;
  try {
    tokenUser = verifyToken(req);
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }

  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'GET') {
    try {
      const athletes = await sql`SELECT id, name, role, whatsapp FROM users WHERE role = 'athlete'`;
      return res.status(200).json(athletes);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar atletas' });
    }
  }

  if (req.method === 'POST') {
    if (tokenUser.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas admins podem criar atletas' });
    }
    const { name, pin, whatsapp } = req.body;
    try {
      const hashedPin = bcrypt.hashSync(pin, 10);
      const result = await sql`
        INSERT INTO users (name, role, pin, whatsapp) 
        VALUES (${name}, 'athlete', ${hashedPin}, ${whatsapp || null})
        RETURNING id, name, role, whatsapp
      `;
      return res.status(201).json(result[0]);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao cadastrar atleta' });
    }
  }

  if (req.method === 'DELETE') {
    if (tokenUser.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas admins podem remover atletas' });
    }
    const { id } = req.query;
    try {
      await sql`DELETE FROM users WHERE id = ${id} AND role = 'athlete'`;
      return res.status(200).json({ message: 'Atleta removido' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao remover atleta' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
