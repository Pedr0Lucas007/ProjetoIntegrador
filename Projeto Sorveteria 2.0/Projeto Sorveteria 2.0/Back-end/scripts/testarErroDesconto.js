async function testarAPIComErro() {
    try {
        console.log('📝 Testando API com dados simples...\n');
        
        const novaVenda = {
            cliente: 'Teste Desconto',
            forma_pagamento: 'Dinheiro',
            desconto: 10,  // 10%
            total: 4.50,   // 1x R$5 com 10% desc = 4.50
            produtos: [
                { 
                    produto_id: 3, 
                    quantidade: 1, 
                    preco: 5.00  // Sorvete de Chocolate = R$ 5
                }
            ]
        };
        
        console.log('Enviando para API:');
        console.log(JSON.stringify(novaVenda, null, 2));
        
        const response = await fetch('http://localhost:3000/api/vendas/registrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novaVenda)
        });
        
        const data = await response.json();
        console.log('\n✅ Resposta:', data);
        
        // Verificar no banco
        const vendas = await fetch('http://localhost:3000/api/vendas');
        const todasVendas = await vendas.json();
        const ultimaVenda = todasVendas[0];
        
        console.log('\n📦 Última venda salva:');
        console.log(`  Cliente: ${ultimaVenda.cliente}`);
        console.log(`  Desconto: ${ultimaVenda.desconto}%`);
        console.log(`  Total: R$ ${ultimaVenda.total}`);
        console.log(`  Esperado: R$ 4.50`);
        console.log(`  Diferença: ${parseFloat(ultimaVenda.total) - 4.50}`);
        
        if (parseFloat(ultimaVenda.total) !== 4.50) {
            console.log('\n⚠️  ERRO DETECTADO: Valor final incorreto!');
        } else {
            console.log('\n✅ CORRETO!');
        }
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

testarAPIComErro();
