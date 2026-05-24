import jwt from 'jsonwebtoken';

export function verifyToken(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token ausente ou inválido');
  }

  const token = authHeader.split(' ')[1];
  try {
    // IMPORTANTE: Defina JWT_SECRET no painel da Vercel
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_troque_em_producao');
    return decoded as { id: string | number, role: string };
  } catch (err) {
    throw new Error('Token expirado ou inválido');
  }
}
