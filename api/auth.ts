import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { name, pin } = req.body;
  const sql = neon(process.env.DATABASE_URL);

  try {
    const users = await sql`
      SELECT id, name, role, pin
      FROM users 
      WHERE name = ${name}
      LIMIT 1
    `;

    if (users.length > 0) {
      const user = users[0];
      let isValid = false;

      // Verifica se a senha armazenada já é um hash do bcrypt
      if (user.pin.startsWith('$2')) {
        isValid = bcrypt.compareSync(pin, user.pin);
      } else {
        // Fallback para texto puro (senhas antigas)
        if (user.pin === pin) {
          isValid = true;
          // Migração silenciosa: criptografa e atualiza o PIN no banco
          const hashedPin = bcrypt.hashSync(pin, 10);
          await sql`UPDATE users SET pin = ${hashedPin} WHERE id = ${user.id}`;
        }
      }

      if (isValid) {
        return res.status(200).json({ id: user.id, name: user.name, role: user.role });
      } else {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
    } else {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({ error: 'Erro de servidor' });
  }
}
