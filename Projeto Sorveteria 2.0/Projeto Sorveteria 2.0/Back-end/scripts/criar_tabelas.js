import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'projeto_sorveteria',
  password: '123456',
  port: 5432,
});

async function criarTabelas() {
  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // Criar tabela de produtos
    const sqlProdutos = `
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        categoria VARCHAR(100),
        preco DECIMAL(10, 2) NOT NULL,
        custo DECIMAL(10, 2) NOT NULL,
        lucro DECIMAL(10, 2),
        margem DECIMAL(10, 2),
        estoque INTEGER DEFAULT 0,
        descricao TEXT,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(sqlProdutos);
    console.log('✓ Tabela de produtos criada/verificada com sucesso');

    // Criar índices
    await client.query('CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);');
    console.log('✓ Índices criados com sucesso');

    console.log('\n✓ Banco de dados configurado com sucesso!');
  } catch (erro) {
    console.error('✗ Erro ao criar tabelas:', erro.message);
  } finally {
    await client.end();
  }
}

criarTabelas();
