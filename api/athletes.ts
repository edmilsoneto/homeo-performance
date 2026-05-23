import { neon } from '@neondatabase/serverless';

// Vercel Serverless Function
export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'GET') {
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50)`;
      const athletes = await sql`SELECT id, name, role, whatsapp FROM users WHERE role = 'athlete'`;
      return res.status(200).json(athletes);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar atletas' });
    }
  }

  if (req.method === 'POST') {
    const { name, pin, whatsapp } = req.body;
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50)`;
      const result = await sql`
        INSERT INTO users (name, role, pin, whatsapp) 
        VALUES (${name}, 'athlete', ${pin}, ${whatsapp || null})
        RETURNING id, name, role, whatsapp
      `;
      return res.status(201).json(result[0]);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao cadastrar atleta' });
    }
  }

  if (req.method === 'DELETE') {
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
