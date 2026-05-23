import { neon } from '@neondatabase/serverless';

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

    // Return pending list (push notifications disabled — requires working web-push setup)
    return res.status(200).json({
      message: `Lembretes processados para o turno da ${targetShift}`,
      date: dateStr,
      shift: targetShift,
      stats: {
        athletesPendingCount: pendingAthletes.length,
        totalNotificationsSent: 0,
        totalNotificationsFailed: 0
      },
      pendingAthletes: pendingAthletes.map((a: any) => ({ id: a.id, name: a.name, whatsapp: a.whatsapp }))
    });
  } catch (error: any) {
    console.error('Erro na cron de lembretes:', error?.message || error);
    return res.status(500).json({ error: 'Erro interno ao processar lembretes' });
  }
}
