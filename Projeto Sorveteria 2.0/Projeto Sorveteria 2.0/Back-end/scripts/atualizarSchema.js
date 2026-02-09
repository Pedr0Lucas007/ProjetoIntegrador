import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    user: 'postgres',
    password: '123456',
    host: 'localhost',
    port: 5432,
    database: 'projeto_sorveteria'
});

async function alterarSchema() {
    try {
        await client.connect();
        
        console.log('🔧 Atualizando esquema da tabela vendas...\n');
        
        // Tornar quantidade como nullable e com default
        await client.query(`
            ALTER TABLE vendas 
            ALTER COLUMN quantidade SET DEFAULT 1,
            ALTER COLUMN quantidade DROP NOT NULL
        `);
        console.log('✅ Coluna quantidade: agora aceita NULL com default 1');
        
        // Tornar produto_id como nullable
        await client.query(`
            ALTER TABLE vendas 
            ALTER COLUMN produto_id DROP NOT NULL
        `);
        console.log('✅ Coluna produto_id: agora aceita NULL');
        
        // Verificar a estrutura atualizada
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'vendas'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Estrutura atualizada da tabela vendas:');
        console.log('═══════════════════════════════════════════════════════════════');
        result.rows.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = col.column_default ? ` DEFAULT: ${col.column_default}` : '';
            console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(20)} | ${nullable}${defaultVal}`);
        });
        
        console.log('\n✅ Schema atualizado com sucesso!');
        await client.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

alterarSchema();
