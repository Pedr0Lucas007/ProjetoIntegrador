import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    user: 'postgres',
    password: '123456',
    host: 'localhost',
    port: 5432,
    database: 'projeto_sorveteria'
});

async function verificarEstrutura() {
    try {
        await client.connect();
        
        console.log('Tabelas existentes:');
        const tabelas = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        tabelas.rows.forEach(t => console.log('  -', t.table_name));
        
        console.log('\n═════════════════════════════════════════');
        console.log('Estrutura da tabela VENDAS:');
        const vendas = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'vendas'
            ORDER BY ordinal_position
        `);
        
        vendas.rows.forEach(col => {
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

verificarEstrutura();
