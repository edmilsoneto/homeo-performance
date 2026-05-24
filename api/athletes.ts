import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function verifyToken(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token ausente ou inválido');
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_troque_em_producao');
    return decoded as { id: string | number, role: string };
  } catch (err) {
    throw new Error('Token expirado ou inválido');
  }
}

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
