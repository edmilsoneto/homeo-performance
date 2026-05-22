import { neon } from '@neondatabase/serverless';
import 'dotenv/config'; // Requires dotenv to be installed for the script

const sql = neon(process.env.DATABASE_URL);

async function init() {
  console.log('Criando tabelas...');

  try {
    // Tabela de Usuários (Admin e Atletas)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'athlete')),
        pin TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Tabela de Registros de Turno (Shifts)
    await sql`
      CREATE TABLE IF NOT EXISTS shifts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        shift TEXT NOT NULL CHECK (shift IN ('Manhã', 'Tarde', 'Noite')),
        intensity INTEGER NOT NULL,
        feedback TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('Tabelas criadas com sucesso!');

    // Check if admin exists
    const admins = await sql`SELECT * FROM users WHERE role = 'admin' AND name = 'MatheusCordeiro'`;
    if (admins.length === 0) {
      await sql`
        INSERT INTO users (id, name, role, pin)
        VALUES (gen_random_uuid(), 'MatheusCordeiro', 'admin', '010902')
      `;
      console.log('Admin MatheusCordeiro criado.');
    } else {
      console.log('Admin já existe.');
    }

  } catch (err) {
    console.error('Erro ao inicializar o banco de dados:', err);
  }
}

init();
