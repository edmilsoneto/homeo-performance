import { neon } from '@neondatabase/serverless';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BKnbcJPC7NQ37L87utz-N1KxskF6ta7sUCNHyDhIViJhil9HerhlIC75KLNZz08D4mv_AdzAQ0EeK23ueyF0P9k';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'ZcKeBKDp2zVBenLIOiGVTTwsJGWgj_q9zvyy3N1Ulg0';

webpush.setVapidDetails(
  'mailto:suporte@homeoperformance.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function sendPushNotification(userId: string, payload: { title: string, body: string, data?: any }) {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Get all active subscriptions for this user
    const rows = await sql`
      SELECT id, subscription 
      FROM push_subscriptions 
      WHERE user_id = ${userId}
    `;
    
    if (rows.length === 0) return { sent: 0, failed: 0 };
    
    let sent = 0;
    let failed = 0;
    
    for (const row of rows) {
      try {
        const sub = JSON.parse(row.subscription);
        await webpush.sendNotification(sub, JSON.stringify(payload));
        sent++;
      } catch (error: any) {
        console.error(`Erro ao enviar push para subscription ${row.id}:`, error);
        failed++;
        // If the push service returns 410 (Gone) or 404 (Not Found), delete the dead subscription
        if (error.statusCode === 410 || error.statusCode === 404) {
          await sql`DELETE FROM push_subscriptions WHERE id = ${row.id}`;
          console.log(`Subscrição expirada removida: ${row.id}`);
        }
      }
    }
    
    return { sent, failed };
  } catch (err) {
    console.error('Erro na função sendPushNotification:', err);
    return { sent: 0, failed: 0, error: err };
  }
}
