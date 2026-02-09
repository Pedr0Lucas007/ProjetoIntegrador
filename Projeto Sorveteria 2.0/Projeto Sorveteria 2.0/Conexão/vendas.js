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
    }

    const formVenda = document.getElementById('formVenda');
    if (formVenda) {
        formVenda.addEventListener('submit', registrarVenda);
    }

    const buscaVendas = document.getElementById('busca-vendas');
    if (buscaVendas) {
        buscaVendas.addEventListener('input', filtrarVendas);
    }
}

async function carregarProdutos() {
    try {
        const response = await fetch('/api/produtos');
        if (response.ok) {
            produtosDisponiveis = await response.json();
            atualizarSelectProdutos(0);
        }
    } catch (error) {
        console.log('Falha ao carregar produtos do servidor; listagem ficará vazia');
        produtosDisponiveis = [];
        atualizarSelectProdutos(0);
    }
}

function atualizarSelectProdutos(index) {
    const select = document.getElementById(`produto-${index}`);
    if (select) {
        select.innerHTML = '<option value="">Selecione um produto</option>';
        produtosDisponiveis.forEach(produto => {
            const option = document.createElement('option');
            option.value = produto.id;
            option.textContent = `${produto.nome} - R$ ${produto.preco.toFixed(2)}`;
            option.dataset.preco = produto.preco;
            select.appendChild(option);
        });
        
        select.addEventListener('change', function() {
            const preco = this.options[this.selectedIndex].dataset.preco;
            const precoInput = document.getElementById(`preco-${index}`);
            if (precoInput && preco) {
                precoInput.value = preco;
                calcularTotais();
            }
        });
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
    
    if (quantidade) quantidade.addEventListener('change', calcularTotais);
    if (preco) preco.addEventListener('change', calcularTotais);
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
    
    const itens = document.querySelectorAll('.item-produto');
    itens.forEach((item, idx) => {
        const inputs = item.querySelectorAll('input');
        const quantidade = inputs[1]?.value || 0;
        const preco = inputs[2]?.value || 0;
        const subtotal = parseFloat(quantidade) * parseFloat(preco) || 0;
        
        const subtotalInput = item.querySelector('.subtotal-input');
        if (subtotalInput) {
            subtotalInput.value = subtotal.toFixed(2);
        }
        
        subtotalGeral += subtotal;
    });
    
    const subtotalGeralElement = document.getElementById('subtotal-geral');
    if (subtotalGeralElement) {
        subtotalGeralElement.textContent = `R$ ${subtotalGeral.toFixed(2)}`;
    }
    
    const descontoInput = document.getElementById('desconto');
    const desconto = parseFloat(descontoInput?.value || 0);
    const valorDesconto = subtotalGeral * (desconto / 100);
    const totalVendas = subtotalGeral - valorDesconto;
    
    const totalElement = document.getElementById('total-vendas');
    if (totalElement) {
        totalElement.textContent = `R$ ${totalVendas.toFixed(2)}`;
    }
}

async function registrarVenda(e) {
    e.preventDefault();
    
    const cliente = document.getElementById('cliente').value;
    const formaPagamento = document.getElementById('forma-pagamento').value;
    
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
        const quantidade = inputs[1]?.value;
        
        if (produtoId && quantidade) {
            produtos.push({
                produto_id: parseInt(produtoId),
                quantidade: parseInt(quantidade)
            });
        }
    });
    
    if (produtos.length === 0) {
        alert('Adicione pelo menos um produto');
        return;
    }
    
    try {
        for (const produto of produtos) {
            const response = await fetch('/api/vendas/registrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(produto)
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao registrar produto ${produto.produto_id}`);
            }
        }
        
        alert('Venda registrada com sucesso!');
        document.getElementById('formVenda').reset();
        carregarVendas();
        atualizarTotais();
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao registrar venda: ' + error.message);
    }
}

function carregarVendas() {
    console.log('Função carregarVendas - implementar endpoint GET /api/vendas');
}

function exibirVendas() {
    const tbody = document.getElementById('tbody-vendas');
    if (!tbody) return;
    
    if (vendas.length === 0) {
        tbody.innerHTML = '<tr class="vazio"><td colspan="6">Nenhuma venda registrada</td></tr>';
        return;
    }
    
    tbody.innerHTML = vendas.map((venda, idx) => `
        <tr>
            <td><strong>${venda.cliente}</strong></td>
            <td>${venda.produtos.length} produto(s)</td>
            <td>${venda.produtos.reduce((sum, p) => sum + p.quantidade, 0)}</td>
            <td><strong>R$ ${venda.total.toFixed(2)}</strong></td>
            <td>${new Date(venda.data).toLocaleString('pt-BR')}</td>
            <td>
                <button class="btn-visualizar" onclick="visualizarVenda(${idx})">Ver</button>
            </td>
        </tr>
    `).join('');
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

function visualizarVenda(idx) {
    const venda = vendas[idx];
    alert(`
Cliente: ${venda.cliente}
Total: R$ ${venda.total.toFixed(2)}
Forma de Pagamento: ${venda.formaPagamento}
Data: ${new Date(venda.data).toLocaleString('pt-BR')}
Observações: ${venda.observacoes || 'Nenhuma'}
    `);
}

function atualizarTotais() {
    const hoje = new Date().toDateString();
    const vendasHoje = vendas.filter(v => new Date(v.data).toDateString() === hoje);
    
    const totalVendas = vendasHoje.reduce((sum, v) => sum + v.total, 0);
    
    const elementos = document.querySelectorAll('#vendas-hoje, #total-hoje');
    if (elementos.length >= 2) {
        elementos[0].textContent = vendasHoje.length;
        elementos[1].textContent = `R$ ${totalVendas.toFixed(2)}`;
    }
}
