import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "projeto_sorveteria",
  password: "123456",
  port: 5432,
});

client.connect();

const registroVendas = async (req, res) => {
  const { cliente, forma_pagamento, desconto, total, produtos } = req.body;

  if (!cliente || !forma_pagamento || !produtos || produtos.length === 0) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    // Inserir venda principal
    const vendaResult = await client.query(
      `INSERT INTO vendas (cliente, forma_pagamento, desconto, precototal) 
       VALUES ($1, $2, $3, $4)
       RETURNING id;`,
      [cliente, forma_pagamento, desconto || 0, total || 0]
    );

    const vendaId = vendaResult.rows[0].id;
    console.log('Venda inserida com ID:', vendaId);

    // Inserir produtos da venda e atualizar estoque
    for (const produto of produtos) {
      const { produto_id, quantidade, preco } = produto;

      // Verificar se produto existe
      const produtoCheck = await client.query(
        'SELECT nome, categoria FROM produtos WHERE id = $1',
        [produto_id]
      );

      if (produtoCheck.rows.length === 0) {
        throw new Error(`Produto ${produto_id} não encontrado`);
      }

      // Inserir item da venda
      await client.query(
        `INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario)
         VALUES ($1, $2, $3, $4)`,
        [vendaId, produto_id, quantidade, preco]
      );

      // Atualizar estoque (decrementar)
      await client.query(
        'UPDATE produtos SET estoque = estoque - $1 WHERE id = $2',
        [quantidade, produto_id]
      );

      console.log(`Estoque atualizado. Produto ${produto_id}: -${quantidade}`);
    }

    res.status(201).json({ 
      mensagem: 'Venda registrada com sucesso',
      venda_id: vendaId 
    });

  } catch (error) {
    console.error('ERRO NA VENDA:', error.message);
    res.status(500).json({ error: 'Erro ao registrar venda: ' + error.message });
  }
};

// LISTAR VENDAS
const listarVendas = async (req, res) => {
  try {
    // Buscar vendas com seus itens e informações de produtos
    const resultado = await client.query(`
      SELECT 
        v.id,
        v.cliente,
        v.forma_pagamento,
        v.desconto,
        v.precototal as total,
        v.data_venda,
        json_agg(
          json_build_object(
            'id', iv.id,
            'produto_id', iv.produto_id,
            'produto_nome', p.nome,
            'categoria', p.categoria,
            'quantidade', iv.quantidade,
            'preco', iv.preco_unitario
          ) ORDER BY iv.id
        ) as produtos
      FROM vendas v
      LEFT JOIN itens_venda iv ON v.id = iv.venda_id
      LEFT JOIN produtos p ON iv.produto_id = p.id
      GROUP BY v.id, v.cliente, v.forma_pagamento, v.desconto, v.precototal, v.data_venda
      ORDER BY v.data_venda DESC
      LIMIT 100
    `);
    
    res.json(resultado.rows);
  } catch (error) {
    console.error('ERRO AO LISTAR VENDAS:', error);
    res.status(500).json({ error: 'Erro ao listar vendas' });
  }
};

export { registroVendas, listarVendas };
