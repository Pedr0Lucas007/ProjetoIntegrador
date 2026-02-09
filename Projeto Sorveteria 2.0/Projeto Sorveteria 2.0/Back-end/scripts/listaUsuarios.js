import pkg from 'pg';

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

  const res = await client.query("SELECT id, email, senha, LENGTH(senha) as senha_len FROM usuario ORDER BY id DESC LIMIT 100");

  console.log('id | email | senha_len | senha_prefix');
  res.rows.forEach(r => {
    const prefix = r.senha ? String(r.senha).slice(0,4) : '';
    console.log(`${r.id} | ${r.email} | ${r.senha_len} | ${prefix}${r.senha_len>4? '...' : ''}`);
  });

  await client.end();
}

main().catch(err => {
  console.error('Erro ao listar usuários:', err);
  process.exit(1);
});
