let vendasRelatorio = [];
let chartInstances = {
    vendiasDia: null,
    pagamento: null,
    produtos: null,
    distribuicao: null
};

document.addEventListener('DOMContentLoaded', function() {
    carregarDadosRelatorio();
    inicializarGraficos();
    configurarFiltros();
});

async function carregarDadosRelatorio() {
    try {
        const response = await fetch('/api/relatorio');
        if (response.ok) {
            const dados = await response.json();
            vendasRelatorio = dados.map((item, idx) => ({
                id: idx + 1,
                cliente: 'Cliente',
                produtos: [{ produtoId: idx + 1, quantidade: item.total_vendido }],
                subtotal: item.total_vendas || 0,
                desconto: 0,
                total: item.total_vendas || 0,
                formaPagamento: 'dinheiro',
                data: new Date().toISOString(),
                nomeProduto: item.nome,
                quantidadeVendida: item.total_vendido,
                lucroTotal: item.lucro_total || 0,
                margemLucro: item.margem_lucro_percentual || 0
            }));
        }
    } catch (error) {
        console.log('Falha ao carregar dados do relatório; nenhum dado disponível');
        vendasRelatorio = [];
    }
    
    atualizarIndicadores();
    exibirTabelaDetalhada();
    atualizarGraficos();
}

function inicializarGraficos() {
    const ctx1 = document.getElementById('grafico-vendas-dia');
    if (ctx1) {
        chartInstances.vendiasDia = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Vendas (R$)',
                    data: [],
                    borderColor: '#256a8a',
                    backgroundColor: 'rgba(37, 106, 138, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#3393c1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    const ctx2 = document.getElementById('grafico-pagamento');
    if (ctx2) {
        chartInstances.pagamento = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Dinheiro', 'Crédito', 'Débito', 'PIX'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        '#256a8a',
                        '#3393c1',
                        '#4a5ac0',
                        '#27ae60'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    const ctx3 = document.getElementById('grafico-produtos');
    if (ctx3) {
        chartInstances.produtos = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Quantidade Vendida',
                    data: [],
                    backgroundColor: '#3393c1',
                    borderColor: '#256a8a',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    const ctx4 = document.getElementById('grafico-distribuicao');
    if (ctx4) {
        chartInstances.distribuicao = new Chart(ctx4, {
            type: 'pie',
            data: {
                labels: ['Vendas Completadas', 'Valor Total'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: [
                        '#256a8a',
                        '#27ae60'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

function atualizarIndicadores() {
    const totalVendas = vendasRelatorio.reduce((sum, v) => sum + v.total, 0);
    const numTransacoes = vendasRelatorio.length;
    const ticketMedio = numTransacoes > 0 ? totalVendas / numTransacoes : 0;
    const lucroGeral = vendasRelatorio.reduce((sum, v) => sum + v.lucroTotal, 0);
    const margemGeralMedia = vendasRelatorio.length > 0 
        ? vendasRelatorio.reduce((sum, v) => sum + v.margemLucro, 0) / vendasRelatorio.length 
        : 0;
    
    const produtosVendidos = {};
    vendasRelatorio.forEach(venda => {
        venda.produtos.forEach(p => {
            produtosVendidos[p.produtoId] = (produtosVendidos[p.produtoId] || 0) + p.quantidade;
        });
    });
    
    const produtoTop = Object.keys(produtosVendidos).length > 0
        ? Object.keys(produtosVendidos).reduce((a, b) => produtosVendidos[a] > produtosVendidos[b] ? a : b)
        : '-';
    const qtdTop = produtosVendidos[produtoTop] || 0;
    
    const elementos = {
        'total-vendas': `R$ ${totalVendas.toFixed(2)}`,
        'num-transacoes': numTransacoes,
        'ticket-medio': `R$ ${ticketMedio.toFixed(2)}`,
        'produto-top': `Produto ${produtoTop}`,
        'qtd-top': `${qtdTop} vendidos`,
        'margem-lucro': `${margemGeralMedia.toFixed(2)}%`,
        'lucro-total': `R$ ${lucroGeral.toFixed(2)} de lucro`
    };
    
    Object.entries(elementos).forEach(([id, valor]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    });
}

function atualizarGraficos() {
    if (!chartInstances.vendiasDia) return;
    
    const vendiasPorDia = {};
    vendasRelatorio.forEach(venda => {
        const data = new Date(venda.data).toLocaleDateString();
        vendiasPorDia[data] = (vendiasPorDia[data] || 0) + venda.total;
    });
    
    const LabelsData = Object.keys(vendiasPorDia).sort();
    const DadosData = Object.values(vendiasPorDia);
    
    if (chartInstances.vendiasDia) {
        chartInstances.vendiasDia.data.labels = LabelsData;
        chartInstances.vendiasDia.data.datasets[0].data = DadosData;
        chartInstances.vendiasDia.update();
    }
    
    const pagamentoPorForma = {
        dinheiro: 0,
        credito: 0,
        debito: 0,
        pix: 0
    };
    
    vendasRelatorio.forEach(venda => {
        const forma = venda.formaPagamento || 'dinheiro';
        pagamentoPorForma[forma] = (pagamentoPorForma[forma] || 0) + venda.total;
    });
    
    if (chartInstances.pagamento) {
        chartInstances.pagamento.data.datasets[0].data = [
            pagamentoPorForma.dinheiro,
            pagamentoPorForma.credito,
            pagamentoPorForma.debito,
            pagamentoPorForma.pix
        ];
        chartInstances.pagamento.update();
    }
    
    const produtosVendidos = {};
    vendasRelatorio.forEach(venda => {
        venda.produtos.forEach(p => {
            const nomeProduto = `Produto ${p.produtoId}`;
            produtosVendidos[nomeProduto] = (produtosVendidos[nomeProduto] || 0) + p.quantidade;
        });
    });
    
    const topProdutos = Object.entries(produtosVendidos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    if (chartInstances.produtos) {
        chartInstances.produtos.data.labels = topProdutos.map(p => p[0]);
        chartInstances.produtos.data.datasets[0].data = topProdutos.map(p => p[1]);
        chartInstances.produtos.update();
    }
}

function exibirTabelaDetalhada() {
    const tbody = document.getElementById('tbody-detalhes');
    if (!tbody) return;
    
    if (vendasRelatorio.length === 0) {
        tbody.innerHTML = '<tr class="vazio"><td colspan="10">Nenhuma venda encontrada</td></tr>';
        return;
    }
    
    tbody.innerHTML = vendasRelatorio.map((venda, idx) => `
        <tr>
            <td>#${idx + 1}</td>
            <td>${new Date(venda.data).toLocaleString('pt-BR')}</td>
            <td><strong>${venda.cliente}</strong></td>
            <td>${venda.produtos.length} item(ns)</td>
            <td>${venda.produtos.reduce((sum, p) => sum + p.quantidade, 0)}</td>
            <td>R$ ${venda.subtotal.toFixed(2)}</td>
            <td>${venda.desconto > 0 ? `-${venda.desconto.toFixed(2)}%` : '-'}</td>
            <td><strong>R$ ${venda.total.toFixed(2)}</strong></td>
            <td><span class="badge-pagamento">${venda.formaPagamento}</span></td>
            <td>
                <button class="btn-visualizar" onclick="visualizarDetalhes(${idx})">Ver</button>
            </td>
        </tr>
    `).join('');
}

function configurarFiltros() {
    const btnAplicar = document.querySelector('.btn-filtro');
    const btnLimpar = document.querySelector('.btn-filtro-limpo');
    
    if (btnAplicar) btnAplicar.addEventListener('click', aplicarFiltros);
    if (btnLimpar) btnLimpar.addEventListener('click', limparFiltros);
    
    const buscaDetalhes = document.getElementById('busca-detalhes');
    if (buscaDetalhes) {
        buscaDetalhes.addEventListener('input', function() {
            const busca = this.value.toLowerCase();
            const tbody = document.getElementById('tbody-detalhes');
            const linhas = tbody.querySelectorAll('tr:not(.vazio)');
            
            linhas.forEach(linha => {
                const cliente = linha.cells[2].textContent.toLowerCase();
                linha.style.display = cliente.includes(busca) ? '' : 'none';
            });
        });
    }
}

function aplicarFiltros() {
    const dataInicio = document.getElementById('filtro-data-inicio').value;
    const dataFinal = document.getElementById('filtro-data-final').value;
    const pagamento = document.getElementById('filtro-pagamento').value;
    
    let filtradas = vendasRelatorio;
    
    if (dataInicio) {
        filtradas = filtradas.filter(v => new Date(v.data) >= new Date(dataInicio));
    }
    
    if (dataFinal) {
        filtradas = filtradas.filter(v => new Date(v.data) <= new Date(dataFinal));
    }
    
    if (pagamento) {
        filtradas = filtradas.filter(v => v.formaPagamento === pagamento);
    }
    
    const tbody = document.getElementById('tbody-detalhes');
    if (filtradas.length === 0) {
        tbody.innerHTML = '<tr class="vazio"><td colspan="10">Nenhuma venda encontrada com os filtros aplicados</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtradas.map((venda, idx) => `
        <tr>
            <td>#${idx + 1}</td>
            <td>${new Date(venda.data).toLocaleString('pt-BR')}</td>
            <td><strong>${venda.cliente}</strong></td>
            <td>${venda.produtos.length} item(ns)</td>
            <td>${venda.produtos.reduce((sum, p) => sum + p.quantidade, 0)}</td>
            <td>R$ ${venda.subtotal.toFixed(2)}</td>
            <td>${venda.desconto > 0 ? `-${venda.desconto.toFixed(2)}%` : '-'}</td>
            <td><strong>R$ ${venda.total.toFixed(2)}</strong></td>
            <td><span class="badge-pagamento">${venda.formaPagamento}</span></td>
            <td>
                <button class="btn-visualizar" onclick="visualizarDetalhes(${idx})">Ver</button>
            </td>
        </tr>
    `).join('');
}

function limparFiltros() {
    document.getElementById('filtro-data-inicio').value = '';
    document.getElementById('filtro-data-final').value = '';
    document.getElementById('filtro-pagamento').value = '';
    document.getElementById('busca-detalhes').value = '';
    
    exibirTabelaDetalhada();
}

function visualizarDetalhes(idx) {
    const venda = vendasRelatorio[idx];
    const produtosTexto = venda.produtos.map(p => `Produto ${p.produtoId} (Qtd: ${p.quantidade})`).join('\n');
    
    alert(`
=== DETALHES DA VENDA ===

Cliente: ${venda.cliente}
Data: ${new Date(venda.data).toLocaleString('pt-BR')}

Produtos:
${produtosTexto}

Subtotal: R$ ${venda.subtotal.toFixed(2)}
Desconto: ${venda.desconto.toFixed(2)}%
Total: R$ ${venda.total.toFixed(2)}

Forma de Pagamento: ${venda.formaPagamento}
    `);
}

function exportarRelatorio() {
    let csv = 'ID,Data,Cliente,Produtos,Quantidade,Subtotal,Desconto,Total,Forma de Pagamento\n';
    
    vendasRelatorio.forEach((venda, idx) => {
        csv += `${idx + 1},"${new Date(venda.data).toLocaleString('pt-BR')}","${venda.cliente}",${venda.produtos.length},${venda.produtos.reduce((sum, p) => sum + p.quantidade, 0)},${venda.subtotal.toFixed(2)},${venda.desconto.toFixed(2)},${venda.total.toFixed(2)},${venda.formaPagamento}\n`;
    });
    
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `relatorio-vendas-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

const style = document.createElement('style');
style.textContent = `
.badge-pagamento {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: capitalize;
    background-color: #e8e8e8;
    color: #404040;
}
`;
document.head.appendChild(style);
