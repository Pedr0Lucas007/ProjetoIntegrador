import pkg from "pg";
const { Client } = pkg;

const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "projeto_sorveteria",
  password: "123456",
  port: 5432
});

client.connect();

// CADASTRAR PRODUTO
export const cadastrarProduto = async (req, res) => {
  const { nome, categoria, preco, custo, estoque, descricao, ativo } = req.body;

  if (!nome || !preco || !custo) {
    return res.status(400).json({ mensagem: "Campos obrigatórios faltando" });
  }

  const lucro = Number(preco) - Number(custo);
  const margem = ((Number(preco) - Number(custo)) / Number(custo) * 100).toFixed(2);

  try {
    const resultado = await client.query(
      `
      INSERT INTO produtos (nome, categoria, preco, custo, lucro, margem, estoque, descricao, ativo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
      `,
      [nome, categoria, preco, custo, lucro, margem, estoque || 0, descricao || '', ativo !== false]
    );

    res.status(201).json({
      mensagem: "Produto cadastrado com sucesso",
      produto: resultado.rows[0]
    });

  } catch (erro) {
    console.error('ERRO AO CADASTRAR PRODUTO:', erro.message);
    console.error('Detalhes completos:', erro);
    res.status(500).json({ mensagem: "Erro ao cadastrar produto: " + erro.message });
  }
};

// LISTAR PRODUTOS
export const listarProdutos = async (req, res) => {
  try {
    const resultado = await client.query("SELECT * FROM produtos");
    res.json(resultado.rows);
  } catch (erro) {
    res.status(500).json({ mensagem: "Erro ao listar produtos" });
  }
};

// DELETAR PRODUTO
export const deletarProduto = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ mensagem: "ID do produto não fornecido" });
  }

  try {
    // Primeiro, verifica se produto existe
    const verificacao = await client.query(
      "SELECT * FROM produtos WHERE id = $1;",
      [id]
    );

    if (verificacao.rows.length === 0) {
      return res.status(404).json({ mensagem: "Produto não encontrado" });
    }

    const produtoAntigo = verificacao.rows[0];

    // Deletar o produto
    await client.query(
      "DELETE FROM produtos WHERE id = $1;",
      [id]
    );

    res.json({
      mensagem: "Produto deletado com sucesso",
      produto: produtoAntigo
    });

  } catch (erro) {
    console.error('ERRO AO DELETAR PRODUTO:', erro.message);
    res.status(500).json({ mensagem: "Erro ao deletar produto: " + erro.message });
  }
};
