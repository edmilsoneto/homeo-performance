import { neon } from '@neondatabase/serverless';
import { sendPushNotification } from './_push_service';

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
      console.error('GET /api/entries error:', error);
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

        // Build parameterized bulk INSERT using neon's sql.unsafe for dynamic queries
        const valueStrings: string[] = [];
        const params: any[] = [];
        let index = 1;

        for (const entry of entries) {
          const { userId, date, shift, intensity, feedback, timestamp } = entry;
          valueStrings.push(`($${index}, $${index+1}, $${index+2}, $${index+3}, $${index+4}, $${index+5})`);
          params.push(userId, date, shift, intensity ?? 0, feedback, timestamp);
          index += 6;
        }

        const queryText = `INSERT INTO shifts (user_id, date, shift, intensity, feedback, timestamp) VALUES ${valueStrings.join(', ')} RETURNING *`;
        const inserted = await sql.unsafe(queryText, params);
        return res.status(201).json({ count: inserted.length, inserted });

      } else {
        // Single entry insert
        const { userId, date, shift, intensity, feedback, timestamp } = req.body;
        const result = await sql`
          INSERT INTO shifts (user_id, date, shift, intensity, feedback, timestamp)
          VALUES (${userId}, ${date}, ${shift}, ${intensity}, ${feedback}, ${timestamp})
          RETURNING *
        `;
        const insertedEntry = result[0];

        // Fire-and-forget push notification to coach
        (async () => {
          try {
            const athleteRows = await sql`SELECT name FROM users WHERE id = ${userId}`;
            const athleteName = athleteRows[0]?.name || 'Um atleta';
            const adminRows = await sql`SELECT id FROM users WHERE role = 'admin'`;
            for (const admin of adminRows) {
              await sendPushNotification(admin.id, {
                title: 'Novo Registro de Turno',
                body: `${athleteName} respondeu o turno da ${shift} com nota ${intensity}/10.`,
                data: { url: '/' }
              });
            }
          } catch (pushErr) {
            console.error('Push notification error:', pushErr);
          }
        })();

        return res.status(201).json(insertedEntry);
      }
    } catch (error) {
      console.error('POST /api/entries error:', error);
      return res.status(500).json({ error: 'Erro ao salvar registro(s)' });
    }
  }

  if (req.method === 'DELETE') {
    const { userId } = req.query;
    try {
      if (userId) {
        await sql`DELETE FROM shifts WHERE user_id = ${userId}`;
      } else {
        await sql`DELETE FROM shifts`;
      }
      return res.status(200).json({ message: 'Registros apagados' });
    } catch (error) {
      console.error('DELETE /api/entries error:', error);
      return res.status(500).json({ error: 'Erro ao apagar registros' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
