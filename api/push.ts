import { neon } from '@neondatabase/serverless';

const VAPID_PUBLIC_KEY = 'BKnbcJPC7NQ37L87utz-N1KxskF6ta7sUCNHyDhIViJhil9HerhlIC75KLNZz08D4mv_AdzAQ0EeK23ueyF0P9k';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  // Idempotent table creation
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        subscription TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    console.error('Erro ao criar tabela push_subscriptions:', error);
  }

  if (req.method === 'GET') {
    return res.status(200).json({ publicKey: VAPID_PUBLIC_KEY });
  }

  if (req.method === 'POST') {
    const { userId, subscription } = req.body;
    if (!userId || !subscription) {
      return res.status(400).json({ error: 'Parâmetros userId e subscription são obrigatórios' });
    }

    try {
      const endpoint = subscription.endpoint;
      const subStr = JSON.stringify(subscription);

      // Clean duplicates for this specific device endpoint to prevent duplicate push sends
      await sql`
        DELETE FROM push_subscriptions 
        WHERE subscription LIKE ${'%' + endpoint + '%'}
      `;

      // Insert subscription
      const result = await sql`
        INSERT INTO push_subscriptions (user_id, subscription) 
        VALUES (${userId}, ${subStr}) 
        RETURNING id
      `;

      return res.status(201).json({ message: 'Inscrição salva com sucesso', id: result[0].id });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao salvar inscrição de push' });
    }
  }

  if (req.method === 'DELETE') {
    const { endpoint } = req.query;
    if (!endpoint) {
      return res.status(400).json({ error: 'O parâmetro endpoint é obrigatório' });
    }

    try {
      await sql`
        DELETE FROM push_subscriptions 
        WHERE subscription LIKE ${'%' + endpoint + '%'}
      `;
      return res.status(200).json({ message: 'Dispositivo removido com sucesso' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao remover inscrição' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
