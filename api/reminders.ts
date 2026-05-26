import { neon } from '@neondatabase/serverless';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BKnbcJPC7NQ37L87utz-N1KxskF6ta7sUCNHyDhIViJhil9HerhlIC75KLNZz08D4mv_AdzAQ0EeK23ueyF0P9k';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'ZcKeBKDp2zVBenLIOiGVTTwsJGWgj_q9zvyy3N1Ulg0';

webpush.setVapidDetails(
  'mailto:suporte@homeoperformance.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

async function sendPushNotification(sql: any, userId: string, payload: any) {
  try {
    const rows = await sql`SELECT id, subscription FROM push_subscriptions WHERE user_id = ${userId}`;
    if (rows.length === 0) return { sent: 0, failed: 0 };
    
    let sent = 0, failed = 0;
    for (const row of rows) {
      try {
        const sub = JSON.parse(row.subscription);
        await webpush.sendNotification(sub, JSON.stringify(payload));
        sent++;
      } catch (error: any) {
        failed++;
        if (error.statusCode === 410 || error.statusCode === 404) {
          await sql`DELETE FROM push_subscriptions WHERE id = ${row.id}`;
        }
      }
    }
    return { sent, failed };
  } catch (err) {
    console.error('Erro na função sendPushNotification:', err);
    return { sent: 0, failed: 0, error: err };
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const sql = neon(process.env.DATABASE_URL!);

  try {
    // Current date/time in São Paulo timezone (GMT-3)
    const now = new Date();
    const brazilTime = new Date(now.getTime() - (3 * 3600 * 1000));
    const brazilHour = brazilTime.getUTCHours();
    const dateStr = brazilTime.toISOString().split('T')[0];

    // Determine target shift
    let targetShift: 'Manhã' | 'Tarde' | 'Noite' = 'Manhã';
    const queryShift = req.query?.shift || req.body?.shift;

    if (queryShift && ['Manhã', 'Tarde', 'Noite'].includes(queryShift)) {
      targetShift = queryShift;
    } else {
      if (brazilHour >= 11 && brazilHour < 17) targetShift = 'Manhã';
      else if (brazilHour >= 17 && brazilHour < 23) targetShift = 'Tarde';
      else targetShift = 'Noite';
    }

    // Get all athletes
    const athletes = await sql`
      SELECT id, name, whatsapp FROM users WHERE role = 'athlete'
    `;

    if (athletes.length === 0) {
      return res.status(200).json({ message: 'Nenhum atleta cadastrado', stats: { sent: 0, failed: 0 } });
    }

    // Get entries for this shift today
    const entries = await sql`
      SELECT user_id FROM shifts WHERE date = ${dateStr} AND shift = ${targetShift}
    `;
    const completedUserIds = new Set(entries.map((e: any) => e.user_id));

    // Filter pending athletes
    const pendingAthletes = athletes.filter((a: any) => !completedUserIds.has(a.id));

    if (pendingAthletes.length === 0) {
      return res.status(200).json({
        message: `Todos os atletas já responderam o turno da ${targetShift} hoje!`,
        shift: targetShift,
        date: dateStr,
        stats: { sent: 0, failed: 0 }
      });
    }

    let totalSent = 0;
    let totalFailed = 0;

    // Send push notifications to all pending athletes
    for (const athlete of pendingAthletes) {
      const payload = {
        title: `Lembrete: Turno da ${targetShift}`,
        body: `Não esqueça de registrar como você se sentiu no turno da ${targetShift} hoje. Leva só 10 segundos!`,
        data: { url: '/atleta' }
      };

      const result = await sendPushNotification(sql, String(athlete.id), payload);
      totalSent += result.sent || 0;
      totalFailed += result.failed || 0;
    }

    return res.status(200).json({
      message: `Lembretes processados para o turno da ${targetShift}`,
      date: dateStr,
      shift: targetShift,
      stats: {
        athletesPendingCount: pendingAthletes.length,
        totalNotificationsSent: totalSent,
        totalNotificationsFailed: totalFailed
      },
      pendingAthletes: pendingAthletes.map((a: any) => ({ id: a.id, name: a.name, whatsapp: a.whatsapp }))
    });
  } catch (error: any) {
    console.error('Erro na cron de lembretes:', error?.message || error);
    return res.status(500).json({ error: 'Erro interno ao processar lembretes' });
  }
}
