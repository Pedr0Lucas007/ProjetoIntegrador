import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    user: 'postgres',
    password: '123456',
    host: 'localhost',
    port: 5432,
    database: 'projeto_sorveteria'
});

async function testarQuery() {
    try {
        await client.connect();
        
        console.log('📝 Testando query de listagem de vendas...\n');
        
        // Query exata do listarVendas
        const resultado = await client.query(`
            SELECT id, cliente, forma_pagamento, desconto, precototal as total, 
                   data_venda, (SELECT COUNT(*) FROM vendas v2 WHERE v2.id = v1.id) as produtos_count
            FROM vendas v1
            ORDER BY data_venda DESC
            LIMIT 5
        `);
        
        console.log('Resultado da query:');
        console.log(JSON.stringify(resultado.rows, null, 2));
        
        await client.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

testarQuery();
