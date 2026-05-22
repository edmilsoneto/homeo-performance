import { neon } from '@neondatabase/serverless';
import 'dotenv/config'; 

const sql = neon(process.env.DATABASE_URL);

async function updatePassword() {
  try {
    await sql`
      UPDATE users 
      SET pin = '010902' 
      WHERE role = 'admin' AND name = 'MatheusCordeiro'
    `;
    console.log('Senha do administrador atualizada com sucesso!');
  } catch (err) {
    console.error('Erro ao atualizar a senha:', err);
  }
}

updatePassword();
