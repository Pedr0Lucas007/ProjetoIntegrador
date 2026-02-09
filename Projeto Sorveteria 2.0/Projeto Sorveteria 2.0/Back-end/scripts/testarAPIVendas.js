async function testarAPIVendas() {
    try {
        console.log('📝 Testando API de vendas...\n');
        
        // Dados da nova venda com IDs corretos
        const novaVenda = {
            cliente: 'Maria Silva',
            forma_pagamento: 'Cartão Crédito',
            desconto: 10.00,
            total: 80.00,
            produtos: [
                { produto_id: 2, quantidade: 2, preco: 30.00 },
                { produto_id: 3, quantidade: 1, preco: 20.00 }
            ]
        };
        
        console.log('Enviando venda para API:', JSON.stringify(novaVenda, null, 2));
        
        // Fazer POST para API
        const response = await fetch('http://localhost:3000/api/vendas/registrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novaVenda)
        });
        
        const data = await response.json();
        console.log('\n✅ Resposta da API:');
        console.log(JSON.stringify(data, null, 2));
        
        if (response.ok) {
            console.log('\n📡 Venda registrada com sucesso!');
            
            // Listar todas as vendas
            const vendas = await fetch('http://localhost:3000/api/vendas');
            const todasVendas = await vendas.json();
            
            console.log('\n📋 Total de vendas agora:', todasVendas.length);
            console.log('Última venda:');
            console.log(JSON.stringify(todasVendas[0], null, 2));
        } else {
            console.log('\n❌ Erro ao registrar venda');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

testarAPIVendas();
