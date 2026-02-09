import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pkg;

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'projeto_sorveteria',
  password: '123456',
  port: 5432,
});

async function main() {
  await client.connect();
  console.log('Conectado ao banco');

  // Seleciona usuários cuja senha não parece ser bcrypt (não começa com $2)
  const res = await client.query("SELECT id, email, senha FROM usuario WHERE senha IS NOT NULL AND senha NOT LIKE '$2%'");

  if (res.rows.length === 0) {
    console.log('Nenhuma senha não-hash encontrada. Nada a fazer.');
    await client.end();
    return;
  }

  console.log(`Encontrados ${res.rows.length} usuário(s) com senha não-hashada.`);

  for (const row of res.rows) {
    try {
      const plain = String(row.senha);
      const hash = await bcrypt.hash(plain, 10);
      await client.query('UPDATE usuario SET senha = $1 WHERE id = $2', [hash, row.id]);
      console.log(`Atualizado id=${row.id} (${row.email})`);
    } catch (err) {
      console.error('Erro ao atualizar id=', row.id, err);
    }
  }

  console.log('Migração concluída.');
  await client.end();
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
