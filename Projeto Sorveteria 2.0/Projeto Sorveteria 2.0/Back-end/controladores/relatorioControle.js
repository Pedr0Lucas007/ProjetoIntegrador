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

const relatorioControle = async (req, res) => {
  try {
    // Relatório por produtos vendidos
    const resultado = await client.query(`
      SELECT 
        p.id,
        p.nome, 
        p.categoria,
        SUM(iv.quantidade) AS total_vendido,
        SUM(iv.quantidade * iv.preco_unitario) AS total_vendas,
        SUM(iv.quantidade * (iv.preco_unitario - COALESCE(p.custo, 0))) AS lucro_total,
        CASE 
          WHEN SUM(iv.quantidade * iv.preco_unitario) > 0 
          THEN ROUND((SUM(iv.quantidade * (iv.preco_unitario - COALESCE(p.custo, 0))) / SUM(iv.quantidade * iv.preco_unitario) * 100)::numeric, 2)
          ELSE 0 
        END AS margem_lucro_percentual
      FROM itens_venda iv
      JOIN produtos p ON p.id = iv.produto_id
      GROUP BY p.id, p.nome, p.categoria
      ORDER BY total_vendas DESC
    `);

    res.status(200).json(resultado.rows);
  } catch (error) {
    console.error('Erro ao gerar relatório:', error.message);
    res.status(500).json({ error: 'Erro ao gerar relatório: ' + error.message });
  }
};

export { relatorioControle };