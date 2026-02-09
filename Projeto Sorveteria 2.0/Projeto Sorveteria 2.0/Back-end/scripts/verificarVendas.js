import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    user: 'postgres',
    password: '123456',
    host: 'localhost',
    port: 5432,
    database: 'projeto_sorveteria'
});

async function verificarVendas() {
    try {
        await client.connect();
        
        const resultado = await client.query(`
            SELECT id, cliente, forma_pagamento, desconto, precototal, data_venda
            FROM vendas
            ORDER BY data_venda DESC
            LIMIT 10
        `);
        
        console.log('═══════════════════════════════════════════════════════');
        console.log('Últimas 10 vendas');
        console.log('═══════════════════════════════════════════════════════');
        resultado.rows.forEach(v => {
            console.log(`
ID: ${v.id}
Cliente: ${v.cliente}
Forma Pagamento: ${v.forma_pagamento}
Desconto: ${v.desconto}%
Total: R$ ${v.precototal}
Data: ${new Date(v.data_venda).toLocaleString('pt-BR')}
─────────────────────────────────────────────────────────`);
        });
        
        await client.end();
        process.exit(0);
    } catch (error) {
        console.error('Erro:', error.message);
        process.exit(1);
    }
}

verificarVendas();
