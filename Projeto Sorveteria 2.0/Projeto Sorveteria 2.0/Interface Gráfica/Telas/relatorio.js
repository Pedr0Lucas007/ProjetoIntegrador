let vendasRelatorio = [];
let vendasDados = [];
let chartInstances = {
    vendiasDia: null,
    pagamento: null,
    produtos: null,
    distribuicao: null
};

function construirRelatorioDeVendas(vendas) {
    const agregados = new Map();
    (vendas || []).forEach((venda) => {
        const itens = Array.isArray(venda.produtos) ? venda.produtos : [];
        itens.forEach((item) => {
            const id = item.produto_id;
            if (!agregados.has(id)) {
                agregados.set(id, {
                    id,
                    nomeProduto: item.produto_nome || 'Produto',
                    categoria: item.categoria || 'Sem categoria',
                    quantidadeVendida: 0,
                    totalVendas: 0,
                    lucroTotal: 0,
                    margemLucro: 0
                });
            }
            const registro = agregados.get(id);
            const qtd = Number(item.quantidade) || 0;
            const preco = Number(item.preco) || 0;
            registro.quantidadeVendida += qtd;
            registro.totalVendas += qtd * preco;
        });
    });

    return Array.from(agregados.values());
}

function obterTotalVenda(venda) {
    const total = venda && (venda.total ?? venda.precototal);
    return Number(total) || 0;
}

document.addEventListener('DOMContentLoaded', function() {
    carregarDadosRelatorio();
    inicializarGraficos();
    configurarFiltros();

    const btnExportar = document.querySelector('.btn-exportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', function(event) {
            event.preventDefault();
            exportarRelatorio();
        });
    }
});

async function carregarDadosRelatorio() {
    try {
        console.log('=== INICIANDO CARREGAMENTO DE DADOS ===');
        
        // Fazer ambas as requisições em paralelo
        const [responseRelatorio, responseVendas] = await Promise.all([
            fetch('/api/relatorio'),
            fetch('/api/vendas')
        ]);
        
        // Carregar dados de relatório (produtos)
        if (responseRelatorio.ok) {
            const dados = await responseRelatorio.json();
            console.log('✅ Relatório carregado. Total:', dados.length, 'dados:', dados);
            
            vendasRelatorio = dados.map((item) => ({
                id: item.id,
                nomeProduto: item.nome,
                categoria: item.categoria,
                quantidadeVendida: parseInt(item.total_vendido) || 0,
                totalVendas: parseFloat(item.total_vendas) || 0,
                lucroTotal: parseFloat(item.lucro_total) || 0,
                margemLucro: parseFloat(item.margem_lucro_percentual) || 0
            }));
            
            console.log('✅ vendasRelatorio processado:', vendasRelatorio);
        } else {
            console.error('❌ Erro GET /api/relatorio. Status:', responseRelatorio.status);
            vendasRelatorio = [];
        }
        
        // Carregar dados de vendas
        if (responseVendas.ok) {
            const dados = await responseVendas.json();
            console.log('✅ Vendas carregadas. Total:', dados.length, 'dados:', dados);
            vendasDados = dados;
        } else {
            console.error('❌ Erro GET /api/vendas. Status:', responseVendas.status);
            vendasDados = [];
        }

        if (vendasRelatorio.length === 0 && vendasDados.length > 0) {
            console.warn('Relatorio vazio. Gerando relatorio a partir das vendas...');
            vendasRelatorio = construirRelatorioDeVendas(vendasDados);
        }
        
        console.log('=== DADOS FINAIS ===');
        console.log('vendasRelatorio:', vendasRelatorio);
        console.log('vendasDados:', vendasDados);
        
    } catch (error) {
        console.error('❌ ERRO ao carregar dados:', error);
        vendasRelatorio = [];
        vendasDados = [];
    }
    
    console.log('=== ATUALIZANDO UI ===');
    atualizarIndicadores();
    exibirTabelaDetalhada();
    atualizarGraficos();
    console.log('=== ATUALIZAÇÃO CONCLUÍDA ===');
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
    console.log('atualizarIndicadores chamado. vendasRelatorio:', vendasRelatorio);
    
    const totalVendas = vendasRelatorio.reduce((sum, p) => sum + p.totalVendas, 0);
    const totalQuantidade = vendasRelatorio.reduce((sum, p) => sum + p.quantidadeVendida, 0);
    const lucroGeral = vendasRelatorio.reduce((sum, p) => sum + p.lucroTotal, 0);
    const margemGeralMedia = vendasRelatorio.length > 0 
        ? vendasRelatorio.reduce((sum, p) => sum + p.margemLucro, 0) / vendasRelatorio.length 
        : 0;
    
    // Encontrar produto mais vendido
    const produtoTop = vendasRelatorio.length > 0
        ? vendasRelatorio.reduce((prev, curr) => 
            curr.quantidadeVendida > prev.quantidadeVendida ? curr : prev
          )
        : null;
    
    const elementos = {
        'total-vendas': `R$ ${totalVendas.toFixed(2)}`,
        'num-transacoes': totalQuantidade,
        'ticket-medio': `R$ ${totalQuantidade > 0 ? (totalVendas / totalQuantidade).toFixed(2) : '0.00'}`,
        'produto-top': produtoTop ? produtoTop.nomeProduto : '-',
        'qtd-top': produtoTop ? `${produtoTop.quantidadeVendida} vendidos` : '-',
        'margem-lucro': `${margemGeralMedia.toFixed(2)}%`,
        'lucro-total': `R$ ${lucroGeral.toFixed(2)}`
    };
    
    console.log('Atualizando indicadores:', elementos);
    
    Object.entries(elementos).forEach(([id, valor]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    });

    // Variacoes percentuais (periodo atual vs anterior)
    const periodo = obterPeriodoRelatorio();
    const vendasAtual = filtrarVendasPorPeriodo(vendasDados, periodo.inicio, periodo.fim);
    const vendasAnterior = filtrarVendasPorPeriodo(vendasDados, periodo.inicioAnterior, periodo.fimAnterior);

    const metricasAtual = calcularMetricasVendas(vendasAtual);
    const metricasAnterior = calcularMetricasVendas(vendasAnterior);

    atualizarVariacao('variacao-vendas', metricasAtual.total, metricasAnterior.total);
    atualizarVariacao('variacao-transacoes', metricasAtual.transacoes, metricasAnterior.transacoes);
    atualizarVariacao('variacao-ticket', metricasAtual.ticket, metricasAnterior.ticket);
}

function obterPeriodoRelatorio() {
    const dataInicioInput = document.getElementById('filtro-data-inicio');
    const dataFinalInput = document.getElementById('filtro-data-final');
    const agora = new Date();

    let inicio = dataInicioInput && dataInicioInput.value ? new Date(`${dataInicioInput.value}T00:00:00`) : null;
    let fim = dataFinalInput && dataFinalInput.value ? new Date(`${dataFinalInput.value}T23:59:59`) : null;

    if (!inicio && !fim) {
        fim = agora;
        inicio = new Date(agora);
        inicio.setDate(inicio.getDate() - 30);
    } else if (inicio && !fim) {
        fim = agora;
    } else if (!inicio && fim) {
        inicio = new Date(fim);
        inicio.setDate(inicio.getDate() - 30);
    }

    const duracaoMs = fim.getTime() - inicio.getTime();
    const inicioAnterior = new Date(inicio.getTime() - duracaoMs);
    const fimAnterior = new Date(inicio.getTime());

    return { inicio, fim, inicioAnterior, fimAnterior };
}

function filtrarVendasPorPeriodo(vendas, inicio, fim) {
    return (vendas || []).filter((venda) => {
        if (!venda.data_venda) return false;
        const dataVenda = new Date(venda.data_venda);
        return dataVenda >= inicio && dataVenda <= fim;
    });
}

function calcularMetricasVendas(vendas) {
    const total = (vendas || []).reduce((sum, v) => sum + obterTotalVenda(v), 0);
    const transacoes = (vendas || []).length;
    const ticket = transacoes > 0 ? total / transacoes : 0;
    return { total, transacoes, ticket };
}

function atualizarVariacao(elementId, atual, anterior) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let percentual = 0;
    if (anterior === 0) {
        percentual = atual > 0 ? 100 : 0;
    } else {
        percentual = ((atual - anterior) / anterior) * 100;
    }

    const seta = percentual >= 0 ? '↑' : '↓';
    const texto = `${seta} ${Math.abs(percentual).toFixed(2)}% vs periodo anterior`;
    el.textContent = texto;
}

function atualizarGraficos() {
    console.log('atualizarGraficos chamado');
    console.log('vendasRelatorio:', vendasRelatorio);
    console.log('vendasDados:', vendasDados);
    console.log('chartInstances:', chartInstances);
    
    // Gráfico 1: Produtos mais vendidos (top 5)
    if (vendasRelatorio.length > 0) {
        const topProdutos = [...vendasRelatorio]
            .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
            .slice(0, 5);
        
        if (chartInstances.vendiasDia) {
            chartInstances.vendiasDia.data.labels = topProdutos.map(p => p.nomeProduto);
            chartInstances.vendiasDia.data.datasets[0].data = topProdutos.map(p => p.quantidadeVendida);
            chartInstances.vendiasDia.update();
            console.log('Gráfico 1 (Top Produtos) atualizado');
        }
    } else {
        console.warn('Sem dados para gráfico 1 (vendasRelatorio vazio)');
    }
    
    // Gráfico 2: Distribuição por forma de pagamento
    const formasPagamento = {
        'dinheiro': 0,
        'credito': 0,
        'debito': 0,
        'pix': 0
    };
    
    if (vendasDados && Array.isArray(vendasDados) && vendasDados.length > 0) {
        vendasDados.forEach(venda => {
            let forma = (venda.forma_pagamento || 'dinheiro').toLowerCase();
            // Normalizar nomes
            if (forma === 'crédito') forma = 'credito';
            if (forma === 'débito') forma = 'debito';
            
            if (formasPagamento.hasOwnProperty(forma)) {
                formasPagamento[forma]++;
            }
        });
        
        if (chartInstances.pagamento) {
            chartInstances.pagamento.data.labels = ['Dinheiro', 'Crédito', 'Débito', 'PIX'];
            chartInstances.pagamento.data.datasets[0].data = [
                formasPagamento['dinheiro'],
                formasPagamento['credito'],
                formasPagamento['debito'],
                formasPagamento['pix']
            ];
            chartInstances.pagamento.update();
            console.log('Gráfico 2 (Formas de Pagamento) atualizado:', formasPagamento);
        }
    } else {
        console.warn('Sem dados para gráfico 2 (vendasDados vazio ou inválido)');
    }
    
    // Gráfico 3: Lucro por produto (top 5)
    if (vendasRelatorio.length > 0) {
        const topLucro = [...vendasRelatorio]
            .sort((a, b) => b.lucroTotal - a.lucroTotal)
            .slice(0, 5);
        
        if (chartInstances.produtos) {
            chartInstances.produtos.data.labels = topLucro.map(p => p.nomeProduto);
            chartInstances.produtos.data.datasets[0].data = topLucro.map(p => p.lucroTotal);
            chartInstances.produtos.update();
            console.log('Gráfico 3 (Top Lucro) atualizado');
        }
    } else {
        console.warn('Sem dados para gráfico 3 (vendasRelatorio vazio)');
    }

    // Gráfico 4: Distribuição geral (Receita vs Lucro)
    if (vendasRelatorio.length > 0) {
        const totalVendas = vendasRelatorio.reduce((sum, p) => sum + p.totalVendas, 0);
        const totalLucro = vendasRelatorio.reduce((sum, p) => sum + p.lucroTotal, 0);
        
        if (chartInstances.distribuicao) {
            chartInstances.distribuicao.data.labels = ['Receita', 'Lucro'];
            chartInstances.distribuicao.data.datasets[0].data = [totalVendas, totalLucro];
            chartInstances.distribuicao.update();
            console.log('Gráfico 4 (Distribuição) atualizado');
        }
    } else {
        console.warn('Sem dados para gráfico 4 (vendasRelatorio vazio)');
    }
}

function exibirTabelaDetalhada() {
    const tbody = document.getElementById('tbody-detalhes');
    if (!tbody) return;
    
    console.log('Exibindo tabela detalhada. vendasDados:', vendasDados);
    
    if (!vendasDados || vendasDados.length === 0) {
        console.warn('Nenhuma venda disponível para exibir');
        tbody.innerHTML = '<tr class="vazio"><td colspan="10">Nenhuma venda encontrada</td></tr>';
        return;
    }
    
    tbody.innerHTML = vendasDados.map((venda, idx) => {
        // Formatar produtos
        const produtosNomes = venda.produtos && Array.isArray(venda.produtos) 
            ? venda.produtos.map(p => p.produto_nome).join(', ')
            : '-';
        
        // Calcular quantidade total
        const quantidadeTotal = venda.produtos && Array.isArray(venda.produtos)
            ? venda.produtos.reduce((sum, p) => sum + p.quantidade, 0)
            : 0;
        
        // Calcular subtotal (total sem desconto)
        const totalVenda = obterTotalVenda(venda);
        const descontoValor = Number(venda.desconto) || 0;
        const subtotal = totalVenda + descontoValor;
        
        // Data formatada
        const data = venda.data_venda ? new Date(venda.data_venda).toLocaleDateString('pt-BR') : '-';
        const hora = venda.data_venda ? new Date(venda.data_venda).toLocaleTimeString('pt-BR') : '-';
        const dataHora = `${data} ${hora}`;
        
        return `
        <tr>
            <td>#${venda.id}</td>
            <td>${dataHora}</td>
            <td><strong>${venda.cliente || '-'}</strong></td>
            <td>${produtosNomes}</td>
            <td>${quantidadeTotal}</td>
            <td>R$ ${subtotal.toFixed(2)}</td>
            <td>R$ ${descontoValor.toFixed(2)}</td>
            <td><strong>R$ ${totalVenda.toFixed(2)}</strong></td>
            <td>${venda.forma_pagamento || '-'}</td>
            <td>
                <button class="btn-visualizar" onclick="visualizarVendaDetalhes(${venda.id})">Ver</button>
            </td>
        </tr>`;
    }).join('');
    
    console.log('Tabela atualizada com ' + vendasDados.length + ' vendas');
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
    
    let filtradas = vendasDados;
    
    if (dataInicio) {
        filtradas = filtradas.filter(v => {
            const dataVenda = new Date(v.data_venda).toISOString().split('T')[0];
            return dataVenda >= dataInicio;
        });
    }
    
    if (dataFinal) {
        filtradas = filtradas.filter(v => {
            const dataVenda = new Date(v.data_venda).toISOString().split('T')[0];
            return dataVenda <= dataFinal;
        });
    }
    
    if (pagamento) {
        filtradas = filtradas.filter(v => (v.forma_pagamento || '').toLowerCase() === pagamento.toLowerCase());
    }
    
    const tbody = document.getElementById('tbody-detalhes');
    if (filtradas.length === 0) {
        tbody.innerHTML = '<tr class="vazio"><td colspan="10">Nenhuma venda encontrada com os filtros aplicados</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtradas.map((venda) => {
        // Formatar produtos
        const produtosNomes = venda.produtos && Array.isArray(venda.produtos) 
            ? venda.produtos.map(p => p.produto_nome).join(', ')
            : '-';
        
        // Calcular quantidade total
        const quantidadeTotal = venda.produtos && Array.isArray(venda.produtos)
            ? venda.produtos.reduce((sum, p) => sum + p.quantidade, 0)
            : 0;
        
        // Calcular subtotal (total sem desconto)
        const totalVenda = obterTotalVenda(venda);
        const descontoValor = Number(venda.desconto) || 0;
        const subtotal = totalVenda + descontoValor;
        
        // Data formatada
        const data = venda.data_venda ? new Date(venda.data_venda).toLocaleDateString('pt-BR') : '-';
        const hora = venda.data_venda ? new Date(venda.data_venda).toLocaleTimeString('pt-BR') : '-';
        const dataHora = `${data} ${hora}`;
        
        return `
        <tr>
            <td>#${venda.id}</td>
            <td>${dataHora}</td>
            <td><strong>${venda.cliente || '-'}</strong></td>
            <td>${produtosNomes}</td>
            <td>${quantidadeTotal}</td>
            <td>R$ ${subtotal.toFixed(2)}</td>
            <td>R$ ${descontoValor.toFixed(2)}</td>
            <td><strong>R$ ${totalVenda.toFixed(2)}</strong></td>
            <td>${venda.forma_pagamento || '-'}</td>
            <td>
                <button class="btn-visualizar" onclick="visualizarVendaDetalhes(${venda.id})">Ver</button>
            </td>
        </tr>`;
    }).join('');
}

function limparFiltros() {
    document.getElementById('filtro-data-inicio').value = '';
    document.getElementById('filtro-data-final').value = '';
    document.getElementById('filtro-pagamento').value = '';
    document.getElementById('busca-detalhes').value = '';
    
    exibirTabelaDetalhada();
}

function visualizarDetalhes(idx) {
    const produto = vendasRelatorio[idx];
    
    alert(`
=== DETALHES DO PRODUTO ===

Produto: ${produto.nomeProduto}
Categoria: ${produto.categoria}

Quantidade Vendida: ${produto.quantidadeVendida} unidades
Receita Total: R$ ${produto.totalVendas.toFixed(2)}
Lucro Total: R$ ${produto.lucroTotal.toFixed(2)}
Margem de Lucro: ${produto.margemLucro.toFixed(2)}%

Preço Médio: R$ ${(produto.totalVendas / produto.quantidadeVendida).toFixed(2)}
Custo Médio: R$ ${((produto.totalVendas - produto.lucroTotal) / produto.quantidadeVendida).toFixed(2)}
    `);
}

function visualizarVendaDetalhes(vendaId) {
    const venda = vendasDados.find(v => v.id === vendaId);
    
    if (!venda) {
        alert('Venda não encontrada');
        return;
    }
    
    // Montar lista de produtos
    const produtosDetalhe = venda.produtos && Array.isArray(venda.produtos)
        ? venda.produtos.map(p => `• ${p.produto_nome}: ${p.quantidade} un. × R$ ${p.preco.toFixed(2)}`)
          .join('\n')
        : 'Nenhum produto';
    
    // Calcular subtotal
    const totalVenda = obterTotalVenda(venda);
    const descontoValor = Number(venda.desconto) || 0;
    const subtotal = totalVenda + descontoValor;
    
    alert(`
=== DETALHES DA VENDA #${venda.id} ===

Cliente: ${venda.cliente || '-'}
Data: ${venda.data_venda ? new Date(venda.data_venda).toLocaleDateString('pt-BR') : '-'}
Hora: ${venda.data_venda ? new Date(venda.data_venda).toLocaleTimeString('pt-BR') : '-'}

--- PRODUTOS ---
${produtosDetalhe}

--- VALORES ---
Subtotal: R$ ${subtotal.toFixed(2)}
Desconto: R$ ${descontoValor.toFixed(2)}
Total: R$ ${totalVenda.toFixed(2)}

Forma de Pagamento: ${venda.forma_pagamento || '-'}
    `);
}

function exportarRelatorio() {
    if (typeof XLSX === 'undefined') {
        alert('Biblioteca de exportacao nao carregada. Recarregue a pagina.');
        return;
    }

    const dadosRelatorio = vendasRelatorio.length > 0
        ? vendasRelatorio
        : construirRelatorioDeVendas(vendasDados);
    const dadosTabela = extrairVendasDaTabela();
    const usarVendasFallback = dadosRelatorio.length === 0 && vendasDados.length > 0;

    if (dadosRelatorio.length === 0 && !usarVendasFallback && dadosTabela.length === 0) {
        alert('Nenhum dado para exportar');
        return;
    }

    // Criar workbook com múltiplas abas
    const wb = XLSX.utils.book_new();

    // ===== ABA 1: RESUMO EXECUTIVO =====
    const resumoData = [
        ['RELATÓRIO DE VENDAS - RESUMO EXECUTIVO'],
        [],
        ['Data de Geração', new Date().toLocaleDateString('pt-BR')],
        [],
        ['INDICADORES PRINCIPAIS'],
        [],
        ['Total de Vendas', `R$ ${parseFloat(document.getElementById('total-vendas').textContent.replace('R$ ', '').replace(',', '.')).toFixed(2)}`],
        ['Total de Itens Vendidos', document.getElementById('num-transacoes').textContent],
        ['Ticket Médio', document.getElementById('ticket-medio').textContent],
        ['Produto Top', document.getElementById('produto-top').textContent],
        ['Margem de Lucro', document.getElementById('margem-lucro').textContent],
        ['Lucro Total', document.getElementById('lucro-total').textContent],
        [],
        ['TOP 5 PRODUTOS MAIS VENDIDOS'],
        []
    ];

    // Adicionar top 5 produtos ao resumo (quando houver dados)
    resumoData.push(['Produto', 'Categoria', 'Quantidade', 'Receita', 'Lucro', 'Margem']);
    if (!usarVendasFallback && dadosRelatorio.length > 0) {
        const top5 = [...dadosRelatorio].sort((a, b) => b.quantidadeVendida - a.quantidadeVendida).slice(0, 5);
        top5.forEach((prod) => {
            resumoData.push([
                prod.nomeProduto,
                prod.categoria,
                prod.quantidadeVendida,
                `R$ ${prod.totalVendas.toFixed(2)}`,
                `R$ ${prod.lucroTotal.toFixed(2)}`,
                `${parseFloat(prod.margemLucro).toFixed(2)}%`
            ]);
        });
    } else {
        resumoData.push(['Sem dados de produtos para este periodo']);
    }

    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    wsResumo['!cols'] = [20, 20, 15, 15, 15, 15];
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    // ===== ABA 2: DETALHES PRODUTOS =====
    const detalhesHeaders = ['ID', 'Produto', 'Categoria', 'Qtd Vendida', 'Receita Total', 'Lucro Total', 'Margem %', 'Ticket Médio'];
    const detalhesData = [detalhesHeaders];
    
    let totalReceita = 0;
    let totalLucro = 0;
    let totalItens = 0;

    if (!usarVendasFallback) {
        dadosRelatorio.forEach(produto => {
            totalReceita += produto.totalVendas;
            totalLucro += produto.lucroTotal;
            totalItens += produto.quantidadeVendida;
            
            const ticketMedio = produto.totalVendas / (produto.quantidadeVendida || 1);
            detalhesData.push([
                produto.id,
                produto.nomeProduto,
                produto.categoria,
                produto.quantidadeVendida,
                `R$ ${produto.totalVendas.toFixed(2)}`,
                `R$ ${produto.lucroTotal.toFixed(2)}`,
                `${parseFloat(produto.margemLucro).toFixed(2)}%`,
                `R$ ${ticketMedio.toFixed(2)}`
            ]);
        });
    } else {
        detalhesData.push(['Sem dados de produtos para este periodo']);
    }

    // Adicionar linha de totais
    detalhesData.push([]);
    const margemTotal = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0;
    const ticketTotal = totalItens > 0 ? totalReceita / totalItens : 0;
    detalhesData.push([
        'TOTAL',
        '',
        '',
        totalItens,
        `R$ ${totalReceita.toFixed(2)}`,
        `R$ ${totalLucro.toFixed(2)}`,
        `${margemTotal.toFixed(2)}%`,
        `R$ ${ticketTotal.toFixed(2)}`
    ]);

    const wsDetalhes = XLSX.utils.aoa_to_sheet(detalhesData);
    wsDetalhes['!cols'] = [8, 20, 15, 12, 15, 15, 12, 15];
    XLSX.utils.book_append_sheet(wb, wsDetalhes, 'Produtos');

    // ===== ABA 3: ANÁLISE POR CATEGORIA =====
    const categorias = {};
    const categoriasData = [['Categoria', 'Total Itens', 'Receita', 'Lucro', 'Margem %', 'Produtos']];
    if (!usarVendasFallback) {
        dadosRelatorio.forEach(prod => {
            if (!categorias[prod.categoria]) {
                categorias[prod.categoria] = { qtd: 0, receita: 0, lucro: 0, produtos: [] };
            }
            categorias[prod.categoria].qtd += prod.quantidadeVendida;
            categorias[prod.categoria].receita += prod.totalVendas;
            categorias[prod.categoria].lucro += prod.lucroTotal;
            categorias[prod.categoria].produtos.push(prod.nomeProduto);
        });

        Object.keys(categorias).forEach(cat => {
            const dados = categorias[cat];
            const margem = dados.receita > 0 ? (dados.lucro / dados.receita) * 100 : 0;
            categoriasData.push([
                cat,
                dados.qtd,
                `R$ ${dados.receita.toFixed(2)}`,
                `R$ ${dados.lucro.toFixed(2)}`,
                `${margem.toFixed(2)}%`,
                dados.produtos.join(', ')
            ]);
        });
    } else {
        categoriasData.push(['Sem dados de produtos para este periodo']);
    }

    const wsCategorias = XLSX.utils.aoa_to_sheet(categoriasData);
    wsCategorias['!cols'] = [15, 12, 15, 15, 12, 40];
    XLSX.utils.book_append_sheet(wb, wsCategorias, 'Por Categoria');

    if (usarVendasFallback) {
        const vendasHeaders = ['ID', 'Data/Hora', 'Cliente', 'Total', 'Desconto', 'Pagamento', 'Produtos'];
        const vendasData = [vendasHeaders];

        vendasDados.forEach((venda) => {
            const data = venda.data_venda ? new Date(venda.data_venda).toLocaleString('pt-BR') : '-';
            const totalVenda = obterTotalVenda(venda);
            const descontoValor = Number(venda.desconto) || 0;
            const produtosNomes = venda.produtos && Array.isArray(venda.produtos)
                ? venda.produtos.map(p => p.produto_nome).join(', ')
                : '-';

            vendasData.push([
                venda.id,
                data,
                venda.cliente || '-',
                `R$ ${totalVenda.toFixed(2)}`,
                `R$ ${descontoValor.toFixed(2)}`,
                venda.forma_pagamento || '-',
                produtosNomes
            ]);
        });

        const wsVendas = XLSX.utils.aoa_to_sheet(vendasData);
        wsVendas['!cols'] = [8, 22, 24, 14, 12, 16, 40];
        XLSX.utils.book_append_sheet(wb, wsVendas, 'Vendas');
    }

    if (dadosTabela.length > 0) {
        const vendasTabela = [['ID', 'Data/Hora', 'Cliente', 'Produtos', 'Quantidade', 'Subtotal', 'Desconto', 'Total', 'Pagamento']];
        dadosTabela.forEach((linha) => vendasTabela.push(linha));
        const wsTabela = XLSX.utils.aoa_to_sheet(vendasTabela);
        wsTabela['!cols'] = [8, 20, 22, 30, 12, 12, 12, 12, 16];
        XLSX.utils.book_append_sheet(wb, wsTabela, 'Vendas (Tabela)');
    }

    // Fallback extra: exportar diretamente a tabela HTML
    const tabelaHtml = document.getElementById('tabela-detalhes');
    if (tabelaHtml) {
        const wsHtml = XLSX.utils.table_to_sheet(tabelaHtml, { raw: true });
        XLSX.utils.book_append_sheet(wb, wsHtml, 'Tabela HTML');
    }

    // Gerar arquivo
    const data = new Date();
    const dataFormatada = `${data.getDate().toString().padStart(2, '0')}-${(data.getMonth() + 1).toString().padStart(2, '0')}-${data.getFullYear()}`;
    XLSX.writeFile(wb, `Relatorio-Vendas-${dataFormatada}.xlsx`);
    
    alert('✅ Relatório exportado com sucesso!');
}

function extrairVendasDaTabela() {
    const tbody = document.getElementById('tbody-detalhes');
    if (!tbody) return [];

    const linhas = Array.from(tbody.querySelectorAll('tr'))
        .filter((linha) => !linha.classList.contains('vazio'));

    return linhas.map((linha) => {
        const celulas = Array.from(linha.querySelectorAll('td')).map((td) => td.textContent.trim());
        return celulas.slice(0, 9);
    });
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
