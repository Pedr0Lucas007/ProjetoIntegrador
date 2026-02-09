import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    user: 'postgres',
    password: '123456',
    host: 'localhost',
    port: 5432,
    database: 'projeto_sorveteria'
});

async function verificarSchema() {
    try {
        await client.connect();
        
        // Verificar estrutura da tabela vendas
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'vendas'
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Estrutura da tabela vendas:');
        console.log('═══════════════════════════════════════════════════════════════');
        result.rows.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = col.column_default ? ` DEFAULT: ${col.column_default}` : '';
            console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(20)} | ${nullable}${defaultVal}`);
        });
        
        await client.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

verificarSchema();
