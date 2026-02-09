import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    user: 'postgres',
    password: '123456',
    host: 'localhost',
    port: 5432,
    database: 'projeto_sorveteria'
});

async function criarTabelaItensVenda() {
    try {
        await client.connect();
        
        console.log('Criando tabela itens_venda...\n');
        
        // Criar tabela itens_venda
        await client.query(`
            CREATE TABLE IF NOT EXISTS itens_venda (
                id SERIAL PRIMARY KEY,
                venda_id INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
                produto_id INTEGER NOT NULL REFERENCES produtos(id),
                quantidade INTEGER NOT NULL,
                preco_unitario NUMERIC(10, 2) NOT NULL,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('✅ Tabela itens_venda criada com sucesso!');
        
        // Criar índice para melhorar performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_itens_venda_id 
            ON itens_venda(venda_id);
        `);
        
        console.log('✅ Índice criado com sucesso!');
        
        // Listar estrutura
        const estrutura = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'itens_venda'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Estrutura da tabela itens_venda:');
        estrutura.rows.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            console.log(`  ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | ${nullable}`);
        });
        
        await client.end();
        process.exit(0);
    } catch (error) {
        console.error('Erro:', error.message);
        process.exit(1);
    }
}

criarTabelaItensVenda();
