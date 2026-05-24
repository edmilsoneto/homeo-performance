import { neon } from '@neondatabase/serverless';
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

export default async function handler(req: any, res: any) {
  let tokenUser;
  try {
    tokenUser = verifyToken(req);
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }

  const sql = neon(process.env.DATABASE_URL!);

  // ── GET ──────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }
    if (tokenUser.role !== 'admin' && String(tokenUser.id) !== String(userId)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    try {
      const rows = await sql`
        SELECT id, user_id, date, shift, intensity, feedback, timestamp
        FROM shifts
        WHERE user_id = ${userId}
        ORDER BY timestamp ASC
      `;
      return res.status(200).json(rows);
    } catch (error: any) {
      console.error('GET /api/entries error:', error?.message || error);
      return res.status(500).json({ error: 'Erro ao buscar registros' });
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      // Batch insert (array of entries)
      if (Array.isArray(req.body)) {
        const entries = req.body;
        if (entries.length === 0) {
          return res.status(201).json({ count: 0, inserted: [] });
        }

        const insertedRows = await Promise.all(entries.map(e => sql`
          INSERT INTO shifts(user_id, date, shift, intensity, feedback, timestamp)
          VALUES (${e.userId}, ${e.date}, ${e.shift}, ${e.intensity ?? 0}, ${e.feedback}, ${e.timestamp})
          RETURNING id, user_id, date, shift, intensity, feedback, timestamp
        `));
        const flatInserted = insertedRows.map(r => r[0]);
        return res.status(201).json({ count: flatInserted.length, inserted: flatInserted });
      }

      // Single entry insert
      const { userId, date, shift, intensity, feedback, timestamp } = req.body;
      if (!userId || !date || !shift) {
        return res.status(400).json({ error: 'userId, date e shift são obrigatórios' });
      }
      if (tokenUser.role !== 'admin' && String(tokenUser.id) !== String(userId)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      const rows = await sql`
        INSERT INTO shifts(user_id, date, shift, intensity, feedback, timestamp)
        VALUES (${userId}, ${date}, ${shift}, ${intensity ?? 0}, ${feedback}, ${timestamp})
        RETURNING id, user_id, date, shift, intensity, feedback, timestamp
      `;
      return res.status(201).json(rows[0]);

    } catch (error: any) {
      console.error('POST /api/entries error:', error?.message || error);
      return res.status(500).json({ error: 'Erro ao salvar registro(s)' });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    if (tokenUser.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas admins podem apagar registros' });
    }
    const { userId } = req.query;
    try {
      if (userId) {
        await sql`DELETE FROM shifts WHERE user_id = ${userId}`;
      } else {
        await sql`DELETE FROM shifts`;
      }
      return res.status(200).json({ message: 'Registros apagados' });
    } catch (error: any) {
      console.error('DELETE /api/entries error:', error?.message || error);
      return res.status(500).json({ error: 'Erro ao apagar registros' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
