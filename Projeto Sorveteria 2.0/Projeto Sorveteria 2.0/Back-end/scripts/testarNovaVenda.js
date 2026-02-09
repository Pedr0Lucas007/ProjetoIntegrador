import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    user: 'postgres',
    password: '123456',
    host: 'localhost',
    port: 5432,
    database: 'projeto_sorveteria'
});

async function testarNovaVenda() {
    try {
        await client.connect();
        console.log('📝 Testando registro de nova venda...\n');
        
        // Dados da venda
        const novaVenda = {
            cliente: 'João da Silva',
            forma_pagamento: 'Dinheiro',
            desconto: 5.00,
            total: 45.00,
            produtos: [
                { id: 1, produto_nome: 'Sorte Baunilha', categoria: 'Picolé', quantidade: 2, preco: 15.00 },
                { id: 2, produto_nome: 'Sorvete Chocolate', categoria: 'Pote', quantidade: 1, preco: 15.00 }
            ]
        };
        
        console.log('Enviando venda:', JSON.stringify(novaVenda, null, 2));
        
        // Registrar a venda
        const result = await client.query(
            `INSERT INTO vendas (cliente, forma_pagamento, desconto, precototal)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [novaVenda.cliente, novaVenda.forma_pagamento, novaVenda.desconto, novaVenda.total]
        );
        
        const venda_id = result.rows[0].id;
        console.log(`✅ Venda criada com ID: ${venda_id}\n`);
        
        // Atualizar estoque dos produtos
        for (const produto of novaVenda.produtos) {
            await client.query(
                `UPDATE produtos SET estoque = estoque - $1 WHERE id = $2`,
                [produto.quantidade, produto.id]
            );
            console.log(`✅ Estoque atualizado para produto ${produto.id}`);
        }
        
        // Buscar a venda registrada
        const vendaRegistrada = await client.query(
            `SELECT * FROM vendas WHERE id = $1`,
            [venda_id]
        );
        
        console.log('\n📦 Venda registrada no banco:');
        console.log(JSON.stringify(vendaRegistrada.rows[0], null, 2));
        
        // Listar todas as vendas
        const todasVendas = await client.query(
            `SELECT id, cliente, forma_pagamento, desconto, precototal, data_venda
             FROM vendas
             ORDER BY data_venda DESC
             LIMIT 5`
        );
        
        console.log('\n📋 Últimas 5 vendas no banco:');
        console.log(JSON.stringify(todasVendas.rows, null, 2));
        
        console.log('\n✅ Teste concluído com sucesso!');
        await client.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

testarNovaVenda();
