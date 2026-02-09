import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'projeto_sorveteria',
  password: '123456',
  port: 5432,
});

async function alterarTabela() {
  try {
    await client.connect();
    console.log('✓ Conectado ao banco de dados');

    // Verificar estrutura da tabela
    const resultado = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'produtos'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Colunas atuais na tabela produtos:');
    resultado.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Adicionar colunas que faltam
    const colunasParaAdicionar = [
      { nome: 'categoria', tipo: 'VARCHAR(100)' },
      { nome: 'margem', tipo: 'DECIMAL(10, 2)' },
      { nome: 'descricao', tipo: 'TEXT' },
      { nome: 'ativo', tipo: 'BOOLEAN DEFAULT true' }
    ];

    console.log('\n➕ Adicionando colunas faltantes...');
    for (const coluna of colunasParaAdicionar) {
      try {
        await client.query(`ALTER TABLE produtos ADD COLUMN ${coluna.nome} ${coluna.tipo};`);
        console.log(`  ✓ Coluna '${coluna.nome}' adicionada`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`  ✓ Coluna '${coluna.nome}' já existe`);
        } else {
          console.log(`  ✗ Erro ao adicionar '${coluna.nome}': ${err.message}`);
        }
      }
    }

    console.log('\n✓ Tabela ajustada com sucesso!');

  } catch (erro) {
    console.error('✗ Erro:', erro.message);
  } finally {
    await client.end();
  }
}

alterarTabela();
