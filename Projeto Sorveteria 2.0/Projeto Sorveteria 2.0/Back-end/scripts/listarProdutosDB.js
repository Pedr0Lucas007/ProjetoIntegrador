import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    user: 'postgres',
    password: '123456',
    host: 'localhost',
    port: 5432,
    database: 'projeto_sorveteria'
});

async function listarProdutos() {
    try {
        await client.connect();
        
        const resultado = await client.query('SELECT id, nome, categoria, preco FROM produtos LIMIT 10');
        
        console.log('📋 Produtos no banco:');
        resultado.rows.forEach(p => {
            console.log(`ID: ${p.id} | ${p.nome} | Categoria: ${p.categoria} | Preço: R$ ${p.preco}`);
        });
        
        await client.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

listarProdutos();
