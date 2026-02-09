let vendas = [];
let produtosDisponiveis = [];
let contagemProdutos = 0;

document.addEventListener('DOMContentLoaded', function() {
    carregarProdutos();
    carregarVendas();
    atualizarTotais();
    configurarEventos();
});

function configurarEventos() {
    const desconto = document.getElementById('desconto');
    if (desconto) {
        desconto.addEventListener('change', calcularTotais);
        desconto.addEventListener('input', calcularTotais);
    }

    const formVenda = document.getElementById('formVenda');
    if (formVenda) {
        formVenda.addEventListener('submit', registrarVenda);
    }

    const buscaVendas = document.getElementById('busca-vendas');
    if (buscaVendas) {
        buscaVendas.addEventListener('input', filtrarVendas);
    }
    
    // Adicionar listeners ao primeiro item (produto-0) que já existe no HTML
    const quantidade0 = document.getElementById('quantidade-0');
    const preco0 = document.getElementById('preco-0');
    const produto0 = document.getElementById('produto-0');
    
    if (quantidade0) {
        quantidade0.addEventListener('input', calcularTotais);
        quantidade0.addEventListener('change', calcularTotais);
    }
    if (preco0) {
        preco0.addEventListener('input', calcularTotais);
        preco0.addEventListener('change', calcularTotais);
    }
    if (produto0) {
        produto0.addEventListener('change', calcularTotais);
    }
}

async function carregarProdutos() {
    try {
        console.log('Carregando produtos...');
        const response = await fetch('/api/produtos');
        console.log('Resposta da API:', response.status);
        
        if (response.ok) {
            produtosDisponiveis = await response.json();
            console.log('Produtos carregados:', produtosDisponiveis);
            atualizarSelectProdutos(0);
        } else {
            console.error('Erro na API:', response.status);
            produtosDisponiveis = [];
            atualizarSelectProdutos(0);
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        produtosDisponiveis = [];
        atualizarSelectProdutos(0);
    }
}

function atualizarSelectProdutos(index) {
    const select = document.getElementById(`produto-${index}`);
    console.log(`Atualizando select produto-${index}:`, select);
    console.log('Produtos disponíveis:', produtosDisponiveis);
    
    if (select) {
        select.innerHTML = '<option value="">Selecione um produto</option>';
        
        produtosDisponiveis.forEach(produto => {
            const option = document.createElement('option');
            option.value = produto.id;
            const preco = typeof produto.preco === 'string' ? parseFloat(produto.preco) : produto.preco;
            option.textContent = `${produto.nome} - R$ ${preco.toFixed(2)}`;
            option.dataset.preco = preco;
            select.appendChild(option);
        });
        
        console.log(`Select produto-${index} populado com ${produtosDisponiveis.length} produtos`);
        
        select.addEventListener('change', function() {
            const preco = this.options[this.selectedIndex].dataset.preco;
            const precoInput = document.getElementById(`preco-${index}`);
            if (precoInput && preco) {
                precoInput.value = preco;
                calcularTotais();
            }
        });
    } else {
        console.warn(`Select produto-${index} não encontrado`);
    }
}

function adicionarProduto() {
    contagemProdutos++;
    const container = document.getElementById('lista-produtos');
    
    const novoItem = document.createElement('div');
    novoItem.className = 'item-produto';
    novoItem.id = `produto-item-${contagemProdutos}`;
    novoItem.innerHTML = `
        <div class="campo-input">
            <label for="produto-${contagemProdutos}">Produto *</label>
            <select id="produto-${contagemProdutos}" class="produto-select" required>
                <option value="">Selecione um produto</option>
            </select>
        </div>
        
        <div class="campo-input">
            <label for="quantidade-${contagemProdutos}">Quantidade *</label>
            <input type="number" id="quantidade-${contagemProdutos}" class="quantidade-input" min="1" value="1" required>
        </div>

        <div class="campo-input">
            <label for="preco-${contagemProdutos}">Preço Unitário *</label>
            <input type="number" id="preco-${contagemProdutos}" class="preco-input" step="0.01" min="0" placeholder="0.00" required>
        </div>

        <div class="campo-input">
            <label for="subtotal-${contagemProdutos}">Subtotal</label>
            <input type="number" id="subtotal-${contagemProdutos}" class="subtotal-input" disabled>
        </div>

        <button type="button" class="btn-remover" onclick="removerProduto(${contagemProdutos})" title="Remover produto">
            ✕
        </button>
    `;
    
    container.appendChild(novoItem);
    atualizarSelectProdutos(contagemProdutos);
    
    // Eventos para cálculo
    const quantidade = document.getElementById(`quantidade-${contagemProdutos}`);
    const preco = document.getElementById(`preco-${contagemProdutos}`);
    const select = document.getElementById(`produto-${contagemProdutos}`);
    
    if (quantidade) {
        quantidade.addEventListener('input', calcularTotais);
        quantidade.addEventListener('change', calcularTotais);
    }
    if (preco) {
        preco.addEventListener('input', calcularTotais);
        preco.addEventListener('change', calcularTotais);
    }
    if (select) {
        select.addEventListener('change', calcularTotais);
    }
}

function removerProduto(index) {
    const item = document.getElementById(`produto-item-${index}`);
    if (item) {
        item.remove();
        calcularTotais();
    }
}

function calcularTotais() {
    let subtotalGeral = 0;
    console.log('Calculando totais...');
    
    const itens = document.querySelectorAll('.item-produto');
    console.log('Total de itens:', itens.length);
    
    itens.forEach((item, idx) => {
        const quantidadeInput = item.querySelector('.quantidade-input');
        const precoInput = item.querySelector('.preco-input');
        const subtotalInput = item.querySelector('.subtotal-input');
        
        const quantidade = parseFloat(quantidadeInput?.value || 0);
        const preco = parseFloat(precoInput?.value || 0);
        const subtotal = quantidade * preco;
        
        console.log(`Item ${idx}: qtd=${quantidade}, preco=${preco}, subtotal=${subtotal}`);
        
        if (subtotalInput) {
            subtotalInput.value = subtotal.toFixed(2);
        }
        
        subtotalGeral += subtotal;
    });
    
    console.log('Subtotal geral:', subtotalGeral);
    
    const subtotalGeralElement = document.getElementById('subtotal-geral');
    if (subtotalGeralElement) {
        subtotalGeralElement.textContent = `R$ ${subtotalGeral.toFixed(2)}`;
    }
    
    const descontoInput = document.getElementById('desconto');
    const desconto = parseFloat(descontoInput?.value || 0);
    const valorDesconto = subtotalGeral * (desconto / 100);
    const totalVendas = subtotalGeral - valorDesconto;
    
    console.log('Desconto:', desconto, '% = R$', valorDesconto, 'Total:', totalVendas);
    
    const totalElement = document.getElementById('total-vendas');
    if (totalElement) {
        totalElement.textContent = `R$ ${totalVendas.toFixed(2)}`;
    }
}

async function registrarVenda(e) {
    e.preventDefault();
    
    const cliente = document.getElementById('cliente').value;
    const formaPagamento = document.getElementById('forma-pagamento').value;
    const desconto = parseFloat(document.getElementById('desconto')?.value || 0);
    
    if (!cliente || !formaPagamento) {
        alert('Preencha todos os campos obrigatórios');
        return;
    }
    
    const produtos = [];
    const itens = document.querySelectorAll('.item-produto');
    itens.forEach(item => {
        const selects = item.querySelectorAll('select');
        const inputs = item.querySelectorAll('input');
        
        const produtoId = selects[0]?.value;
        const quantidade = inputs[0]?.value;  // CORRIGIDO: era inputs[1]
        const preco = inputs[1]?.value;       // CORRIGIDO: era inputs[2]
        
        if (produtoId && quantidade && preco) {
            produtos.push({
                produto_id: parseInt(produtoId),
                quantidade: parseInt(quantidade),
                preco: parseFloat(preco)
            });
        }
    });
    
    if (produtos.length === 0) {
        alert('Adicione pelo menos um produto');
        return;
    }
    
    // Calcular total
    const total = produtos.reduce((sum, p) => sum + (p.quantidade * p.preco), 0);
    const totalComDesconto = total - (total * desconto / 100);
    
    console.log('Produto:', produtos);
    console.log('Subtotal:', total);
    console.log('Desconto:', desconto + '%');
    console.log('Total final:', totalComDesconto);
    
    try {
        // Registrar venda com todos os dados
        const response = await fetch('/api/vendas/registrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cliente,
                forma_pagamento: formaPagamento,
                desconto,
                total: totalComDesconto,
                produtos
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao registrar venda');
        }
        
        const resultado = await response.json();
        alert('Venda registrada com sucesso!');
        document.getElementById('formVenda').reset();
        document.getElementById('desconto').value = '0';
        
        // Limpar itens adicionados
        const itensDinamicos = document.querySelectorAll('.item-produto[id^="produto-item-"]');
        itensDinamicos.forEach(item => item.remove());
        
        carregarVendas();
        calcularTotais();
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao registrar venda: ' + error.message);
    }
}

function carregarVendas() {
    console.log('Carregando vendas...');
    fetch('/api/vendas')
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Erro ao carregar vendas');
        })
        .then(data => {
            console.log('Vendas carregadas:', data);
            vendas = data;
            exibirVendas();
            atualizarTotais();
        })
        .catch(error => {
            console.error('Erro ao carregar vendas:', error);
            vendas = [];
            exibirVendas();
        });
}

function exibirVendas() {
    const tbody = document.getElementById('tbody-vendas');
    if (!tbody) return;
    
    if (!vendas || vendas.length === 0) {
        tbody.innerHTML = '<tr class="vazio"><td colspan="6">Nenhuma venda registrada</td></tr>';
        return;
    }
    
    tbody.innerHTML = vendas.map((venda) => {
        const data = venda.data_venda ? new Date(venda.data_venda).toLocaleString('pt-BR') : 'N/A';
        const total = parseFloat(venda.total || 0).toFixed(2);
        
        // Nomes dos produtos (se disponíveis)
        let produtosHtml = '-';
        if (venda.produtos && venda.produtos.length > 0) {
            produtosHtml = venda.produtos.map(p => p.produto_nome).join(', ');
        }
        
        // Quantidade total de itens
        let quantidadeTotal = 0;
        if (venda.produtos && venda.produtos.length > 0) {
            quantidadeTotal = venda.produtos.reduce((sum, p) => sum + (p.quantidade || 0), 0);
        }
        
        return `
        <tr>
            <td><strong>${venda.cliente || 'Cliente Sem Nome'}</strong></td>
            <td>${produtosHtml}</td>
            <td>${quantidadeTotal}</td>
            <td><strong>R$ ${total}</strong></td>
            <td>${data}</td>
            <td>
                <button class="btn-visualizar" onclick="visualizarVenda(${venda.id})">Ver</button>
            </td>
        </tr>`;
    }).join('');
}

function filtrarVendas() {
    const busca = document.getElementById('busca-vendas').value.toLowerCase();
    const tbody = document.getElementById('tbody-vendas');
    
    const linhas = tbody.querySelectorAll('tr:not(.vazio)');
    linhas.forEach(linha => {
        const cliente = linha.cells[0].textContent.toLowerCase();
        linha.style.display = cliente.includes(busca) ? '' : 'none';
    });
}

function visualizarVenda(vendaId) {
    const venda = vendas.find(v => v.id === vendaId);
    
    if (!venda) {
        alert('Venda não encontrada');
        return;
    }
    
    const data = new Date(venda.data_venda).toLocaleString('pt-BR');
    const descontoPercent = Number(venda.desconto) || 0;
    const subtotalProdutos = Array.isArray(venda.produtos)
        ? venda.produtos.reduce((sum, p) => sum + (Number(p.quantidade) || 0) * (Number(p.preco) || 0), 0)
        : 0;
    const descontoValor = subtotalProdutos * (descontoPercent / 100);
    const totalCalculado = subtotalProdutos - descontoValor;
    
    let produtosHtml = '';
    if (venda.produtos && venda.produtos.length > 0) {
        produtosHtml = venda.produtos.map(p => `
            <div style="margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
                <strong>${p.produto_nome}</strong> (${p.categoria})<br/>
                Quantidade: ${p.quantidade}<br/>
                Preço Unitário: R$ ${parseFloat(p.preco).toFixed(2)}<br/>
                Subtotal: R$ ${(p.quantidade * p.preco).toFixed(2)}
            </div>
        `).join('');
    } else {
        produtosHtml = '<p>Nenhum produto registrado nesta venda</p>';
    }
    
    const detalhes = `
Detalhes da Venda
═══════════════════════════════════════

Cliente: ${venda.cliente}
Forma de Pagamento: ${venda.forma_pagamento}
Data: ${data}

Produtos:
───────────────────────────────────────
${venda.produtos ? venda.produtos.map(p => 
    `${p.produto_nome} (${p.categoria}): ${p.quantidade}x R$ ${parseFloat(p.preco).toFixed(2)} = R$ ${(p.quantidade * p.preco).toFixed(2)}`
).join('\n') : 'Nenhum produto'}

═══════════════════════════════════════
${descontoPercent > 0 ? `Desconto: ${descontoPercent.toFixed(2)}% (R$ ${descontoValor.toFixed(2)})` : ''}
Subtotal: R$ ${subtotalProdutos.toFixed(2)}
Total: R$ ${totalCalculado.toFixed(2)}
    `;
    
    alert(detalhes);
}

function atualizarTotais() {
    const hoje = new Date().toDateString();
    const vendasHoje = vendas.filter(v => {
        const dataVenda = v.data_venda ? new Date(v.data_venda).toDateString() : '';
        return dataVenda === hoje;
    });
    
    const totalVendas = vendasHoje.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
    
    const elementosHoje = document.getElementById('vendas-hoje');
    const elementosTotal = document.getElementById('total-hoje');
    
    if (elementosHoje) {
        elementosHoje.textContent = vendasHoje.length;
    }
    if (elementosTotal) {
        elementosTotal.textContent = `R$ ${totalVendas.toFixed(2)}`;
    }
}
