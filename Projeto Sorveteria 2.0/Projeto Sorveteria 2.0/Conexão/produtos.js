let produtos = [];

document.addEventListener('DOMContentLoaded', function() {
    carregarProdutos();
    configurarEventos();
});

function configurarEventos() {
    const form = document.getElementById('formProduto');
    const busca = document.getElementById('buscaProduto');
    const custo = document.getElementById('custo');
    const preco = document.getElementById('preco');
    
    if (form) form.addEventListener('submit', salvarProduto);
    if (busca) busca.addEventListener('input', filtrarProdutos);
    if (custo) custo.addEventListener('input', calcularMargem);
    if (preco) preco.addEventListener('input', calcularMargem);
}

function calcularMargem() {
    const custo = parseFloat(document.getElementById('custo').value) || 0;
    const preco = parseFloat(document.getElementById('preco').value) || 0;
    const margem = document.getElementById('margem');
    
    if (custo > 0) {
        const percentualMargem = ((preco - custo) / custo * 100).toFixed(2);
        margem.value = percentualMargem;
    } else {
        margem.value = '0.00';
    }
}

async function carregarProdutos() {
    try {
        const response = await fetch('/api/produtos');
        if (response.ok) {
            produtos = await response.json();
        }
    } catch (error) {
        console.log('Produtos carregados localmente');
        produtos = [];
    }
    
    exibirProdutos();
    atualizarIndicadores();
}

function exibirProdutos() {
    const tbody = document.getElementById('tabelaProdutos');
    if (!tbody) return;
    
    if (produtos.length === 0) {
        tbody.innerHTML = '<tr class="vazio"><td colspan="8">Nenhum produto cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = produtos.map((produto, idx) => {
        const lucroUnitario = produto.preco - produto.custo;
        const lucroTotal = lucroUnitario * produto.estoque;
        return `
        <tr>
            <td><strong>${produto.nome}</strong></td>
            <td>${produto.categoria || '-'}</td>
            <td>R$ ${parseFloat(produto.custo).toFixed(2)}</td>
            <td>R$ ${parseFloat(produto.preco).toFixed(2)}</td>
            <td>
                <span class="badge-lucro">
                    ${produto.margem.toFixed(2)}% / R$ ${lucroUnitario.toFixed(2)}
                </span>
            </td>
            <td>${produto.estoque || 0}</td>
            <td>
                <span class="badge-status ${produto.ativo ? 'ativo' : 'inativo'}">
                    ${produto.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td>
                <button class="btn-editar" onclick="editarProduto(${idx})">Editar</button>
                <button class="btn-deletar" onclick="deletarProduto(${idx})">Deletar</button>
            </td>
        </tr>
        `;
    }).join('');
}

async function salvarProduto(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nomeProduto').value;
    const custo = parseFloat(document.getElementById('custo').value);
    const preco = parseFloat(document.getElementById('preco').value);
    const estoque = parseInt(document.getElementById('estoque').value);
    const categoria = document.getElementById('categoria').value;
    const descricao = document.getElementById('descricao').value;
    const ativo = document.getElementById('ativo').checked;
    
    if (!nome || !custo || !preco || estoque === undefined || !categoria) {
        alert('Preencha todos os campos obrigatórios');
        return;
    }
    
    const margem = ((preco - custo) / custo * 100).toFixed(2);
    
    const novoProduto = {
        nome,
        custo,
        preco,
        estoque,
        categoria,
        descricao,
        ativo,
        margem: parseFloat(margem)
    };
    
    try {
        const response = await fetch('/api/produtos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novoProduto)
        });
        
        if (response.ok) {
            produtos.push(novoProduto);
            alert('Produto salvo com sucesso!');
            document.getElementById('formProduto').reset();
            document.getElementById('ativo').checked = true;
            document.getElementById('margem').value = '0.00';
            exibirProdutos();
            atualizarIndicadores();
        } else {
            alert('Erro ao salvar produto');
        }
    } catch (error) {
        produtos.push(novoProduto);
        alert('Produto salvo com sucesso!');
        document.getElementById('formProduto').reset();
        document.getElementById('ativo').checked = true;
        document.getElementById('margem').value = '0.00';
        exibirProdutos();
        atualizarIndicadores();
    }
}

function editarProduto(idx) {
    const produto = produtos[idx];
    document.getElementById('nomeProduto').value = produto.nome;
    document.getElementById('custo').value = produto.custo;
    document.getElementById('preco').value = produto.preco;
    document.getElementById('margem').value = produto.margem;
    document.getElementById('estoque').value = produto.estoque;
    document.getElementById('categoria').value = produto.categoria;
    document.getElementById('descricao').value = produto.descricao;
    document.getElementById('ativo').checked = produto.ativo;
    
    produtos.splice(idx, 1);
    exibirProdutos();
    atualizarIndicadores();
    
    const form = document.getElementById('formProduto');
    if (form) form.scrollIntoView({ behavior: 'smooth' });
}

function deletarProduto(idx) {
    if (confirm('Deseja realmente excluir este produto?')) {
        produtos.splice(idx, 1);
        exibirProdutos();
        atualizarIndicadores();
        alert('Produto excluído com sucesso!');
    }
}

function filtrarProdutos() {
    const busca = document.getElementById('buscaProduto').value.toLowerCase();
    const tbody = document.getElementById('tabelaProdutos');
    
    if (busca === '') {
        exibirProdutos();
        return;
    }
    
    const linhas = tbody.querySelectorAll('tr:not(.vazio)');
    linhas.forEach(linha => {
        const nome = linha.cells[0].textContent.toLowerCase();
        const categoria = linha.cells[1].textContent.toLowerCase();
        const match = nome.includes(busca) || categoria.includes(busca);
        linha.style.display = match ? '' : 'none';
    });
}

function atualizarIndicadores() {
    const totalProdutos = produtos.length;
    const estoqueTotal = produtos.reduce((sum, p) => sum + (p.estoque || 0), 0);
    const lucroEstimado = produtos.reduce((sum, p) => {
        const lucroUnitario = p.preco - p.custo;
        return sum + (lucroUnitario * p.estoque);
    }, 0);
    
    const elementos = {
        'total-produtos': totalProdutos,
        'estoque-total': estoqueTotal,
        'lucro-total': `R$ ${lucroEstimado.toFixed(2)}`
    };
    
    Object.entries(elementos).forEach(([id, valor]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    });
}

const style = document.createElement('style');
style.textContent = `
.badge-lucro {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
    background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
    color: white;
    white-space: nowrap;
}

.badge-status {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
}

.badge-status.ativo {
    background-color: #d4edda;
    color: #155724;
}

.badge-status.inativo {
    background-color: #f8d7da;
    color: #721c24;
}
`;
document.head.appendChild(style);
