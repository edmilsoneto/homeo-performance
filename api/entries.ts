import { Pool } from '@neondatabase/serverless';
import { sendPushNotification } from './_push_service';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { userId } = req.query;
    try {
      let entries;
      if (userId) {
        const result = await pool.query('SELECT * FROM shifts WHERE user_id = $1 ORDER BY timestamp ASC', [userId]);
        entries = result.rows;
      } else {
        const result = await pool.query('SELECT * FROM shifts ORDER BY timestamp ASC');
        entries = result.rows;
      }
      return res.status(200).json(entries);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar registros' });
    }
  }

  if (req.method === 'POST') {
    try {
      if (Array.isArray(req.body)) {
        const entries = req.body;
        if (entries.length === 0) {
          return res.status(201).json({ count: 0, inserted: [] });
        }

        const valueStrings = [];
        const params = [];
        let index = 1;

        for (const entry of entries) {
          const { userId, date, shift, intensity, feedback, timestamp } = entry;
          valueStrings.push(`($${index}, $${index+1}, $${index+2}, $${index+3}, $${index+4}, $${index+5})`);
          params.push(userId, date, shift, intensity || 0, feedback, timestamp);
          index += 6;
        }

        const queryText = `
          INSERT INTO shifts (user_id, date, shift, intensity, feedback, timestamp)
          VALUES ${valueStrings.join(', ')}
          RETURNING *
        `;

        const result = await pool.query(queryText, params);
        return res.status(201).json({ count: result.rows.length, inserted: result.rows });
      } else {
        const { userId, date, shift, intensity, feedback, timestamp } = req.body;
        const result = await pool.query(
          'INSERT INTO shifts (user_id, date, shift, intensity, feedback, timestamp) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [userId, date, shift, intensity, feedback, timestamp]
        );
        const insertedEntry = result.rows[0];

        // Notify Coach (all admin users)
        try {
          const athleteResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
          const athleteName = athleteResult.rows[0]?.name || 'Um atleta';
          const adminResult = await pool.query("SELECT id FROM users WHERE role = 'admin'");
          for (const admin of adminResult.rows) {
            await sendPushNotification(admin.id, {
              title: 'Novo Registro de Turno',
              body: `${athleteName} respondeu o turno da ${shift} com nota ${intensity}/10.`,
              data: { url: '/' }
            });
          }
        } catch (pushErr) {
          console.error('Erro ao processar notificações push do treinador:', pushErr);
        }

        return res.status(201).json(insertedEntry);
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
        await pool.query('DELETE FROM shifts WHERE user_id = $1', [userId]);
      } else {
        await pool.query('DELETE FROM shifts');
      }
      return res.status(200).json({ message: 'Registros apagados' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao apagar registros' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
