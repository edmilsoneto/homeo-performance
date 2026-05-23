import { neon } from '@neondatabase/serverless';
import { sendPushNotification } from './_push_service';

export default async function handler(req, res) {
  // We can restrict to GET or POST (Cron jobs in Vercel usually invoke GET)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // 1. Get current date and hour in São Paulo timezone (GMT-3)
    const now = new Date();
    // Brazil timezone offset is typically -3 hours (180 minutes)
    const brazilTime = new Date(now.getTime() - (3 * 3600 * 1000));
    const brazilHour = brazilTime.getUTCHours();
    const dateStr = brazilTime.toISOString().split('T')[0];

    // 2. Determine target shift to check
    let targetShift: 'Manhã' | 'Tarde' | 'Noite' = 'Manhã';
    const queryShift = req.query.shift || req.body?.shift;

    if (queryShift && ['Manhã', 'Tarde', 'Noite'].includes(queryShift)) {
      targetShift = queryShift;
    } else {
      // Auto-detect based on São Paulo hour
      // Manhã shift (6h-12h) ends at 12h. Remind between 11h and 17h.
      // Tarde shift (12h-18h) ends at 18h. Remind between 17h and 23h.
      // Noite shift (18h-00h) ends at 00h. Remind between 23h and 5h.
      if (brazilHour >= 11 && brazilHour < 17) {
        targetShift = 'Manhã';
      } else if (brazilHour >= 17 && brazilHour < 23) {
        targetShift = 'Tarde';
      } else {
        targetShift = 'Noite';
      }
    }

    // 3. Get all athletes
    const athletes = await sql`
      SELECT id, name, whatsapp 
      FROM users 
      WHERE role = 'athlete'
    `;

    if (athletes.length === 0) {
      return res.status(200).json({ message: 'Nenhum atleta cadastrado no sistema', stats: { sent: 0, failed: 0 } });
    }

    // 4. Get all entries recorded for the target shift today
    const entries = await sql`
      SELECT user_id 
      FROM shifts 
      WHERE date = ${dateStr} AND shift = ${targetShift}
    `;

    const completedUserIds = new Set(entries.map(e => e.user_id));

    // 5. Filter athletes who are pending
    const pendingAthletes = athletes.filter(a => !completedUserIds.has(a.id));

    if (pendingAthletes.length === 0) {
      return res.status(200).json({
        message: `Todos os atletas já responderam o turno da ${targetShift} hoje!`,
        shift: targetShift,
        date: dateStr,
        stats: { sent: 0, failed: 0 }
      });
    }

    // 6. Dispatch push notifications to pending athletes
    let totalSent = 0;
    let totalFailed = 0;
    const notifiedAthletes = [];

    for (const athlete of pendingAthletes) {
      const result = await sendPushNotification(athlete.id, {
        title: `Lembrete do Turno da ${targetShift}`,
        body: `Olá ${athlete.name.split(' ')[0]}, lembrete para preencher sua nota do turno da ${targetShift} no app Homeo Performance!`,
        data: { url: '/' }
      });

      totalSent += result.sent;
      totalFailed += result.failed;
      notifiedAthletes.push({
        name: athlete.name,
        userId: athlete.id,
        whatsapp: athlete.whatsapp,
        devicesSent: result.sent
      });
    }

    return res.status(200).json({
      message: `Lembretes enviados para o turno da ${targetShift}`,
      date: dateStr,
      shift: targetShift,
      stats: {
        athletesPendingCount: pendingAthletes.length,
        totalNotificationsSent: totalSent,
        totalNotificationsFailed: totalFailed
      },
      notifiedAthletes
    });
  } catch (error) {
    console.error('Erro na cron de lembretes:', error);
    return res.status(500).json({ error: 'Erro interno ao processar lembretes de turnos' });
  }
}
