import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'GET') {
    const { userId } = req.query;
    try {
      let entries;
      if (userId) {
        entries = await sql`SELECT * FROM shifts WHERE user_id = ${userId} ORDER BY timestamp ASC`;
      } else {
        entries = await sql`SELECT * FROM shifts ORDER BY timestamp ASC`;
      }
      return res.status(200).json(entries);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar registros' });
    }
  }

  if (req.method === 'POST') {
    try {
      if (Array.isArray(req.body)) {
        const entries = req.body;
        const inserted = [];
        for (const entry of entries) {
          const { userId, date, shift, intensity, feedback, timestamp } = entry;
          const result = await sql`
            INSERT INTO shifts (user_id, date, shift, intensity, feedback, timestamp)
            VALUES (${userId}, ${date}, ${shift}, ${intensity}, ${feedback}, ${timestamp})
            RETURNING *
          `;
          inserted.push(result[0]);
        }
        return res.status(201).json({ count: inserted.length, inserted });
      } else {
        const { userId, date, shift, intensity, feedback, timestamp } = req.body;
        const result = await sql`
          INSERT INTO shifts (user_id, date, shift, intensity, feedback, timestamp)
          VALUES (${userId}, ${date}, ${shift}, ${intensity}, ${feedback}, ${timestamp})
          RETURNING *
        `;
        return res.status(201).json(result[0]);
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao salvar registro(s)' });
    }
  }

  if (req.method === 'DELETE') {
    const { userId } = req.query;
    try {
      if (userId) {
        await sql`DELETE FROM shifts WHERE user_id = ${userId}`;
      } else {
        await sql`DELETE FROM shifts`; // clear all (for demo purposes if needed, maybe protect this)
      }
      return res.status(200).json({ message: 'Registros apagados' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao apagar registros' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
