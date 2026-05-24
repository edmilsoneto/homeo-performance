import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL);

  console.log("Inicializando banco de dados...");

  try {
    // Criar tabela se não existir
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        role VARCHAR(20) NOT NULL,
        pin VARCHAR(255) NOT NULL
      )
    `;
    console.log("Tabela 'users' verificada/criada com sucesso.");

    // Adicionar colunas adicionais
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50)`;
    console.log("Coluna 'whatsapp' verificada com sucesso.");

    console.log("Banco de dados atualizado!");
    process.exit(0);
  } catch (err) {
    console.error("Erro ao inicializar banco de dados:", err);
    process.exit(1);
  }
}

main();
