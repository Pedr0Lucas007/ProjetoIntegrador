import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'projeto_sorveteria',
  password: '123456',
  port: 5432,
});

async function testarProduto() {
  try {
    await client.connect();
    console.log('✓ Conectado ao banco de dados');

    // Teste: inserir um produto
    const resultado = await client.query(
      `
      INSERT INTO produtos (nome, categoria, preco, custo, lucro, margem, estoque, descricao, ativo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
      `,
      ['Sorvete de Baunilha', 'sorvete', 5.00, 2.00, 3.00, 150.00, 10, 'Delicioso sorvete', true]
    );

    console.log('✓ Produto inserido com sucesso:', resultado.rows[0]);

  } catch (erro) {
    console.error('✗ Erro ao inserir produto:', erro.message);
    console.error('Detalhes:', erro);
  } finally {
    await client.end();
  }
}

testarProduto();
