// REESCREVA O ARQUIVO COMPLETO: js/financeiro.js

import { fetchDeN8N, enviarParaN8N } from '/js/functions/api.js';

let todosOsPedidosDoPeriodo = [];
let pedidosFiltrados = [];
let graficoLinha = null;
let graficoPizza = null;
let lojaConfig = null; // Variável para guardar a config da loja

// --- FUNÇÕES DE DATA E FORMATAÇÃO ---
const formatarMoeda = (valor) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function obterPeriodo(periodo) {
    const hoje = new Date();
    const ano = hoje.getFullYear(), mes = hoje.getMonth(), dia = hoje.getDate(), diaDaSemana = hoje.getDay();
    let inicio, fim;
    switch (periodo) {
        case 'hoje': inicio = new Date(ano, mes, dia); fim = new Date(ano, mes, dia); break;
        case 'ontem': inicio = new Date(ano, mes, dia - 1); fim = new Date(ano, mes, dia - 1); break;
        case 'semana': inicio = new Date(ano, mes, dia - diaDaSemana); fim = new Date(ano, mes, dia); break;
        case 'mes': inicio = new Date(ano, mes, 1); fim = new Date(ano, mes, dia); break;
    }
    const formata = (data) => data.toISOString().split('T')[0];
    return { inicio: formata(inicio), fim: formata(fim) };
}

// --- FUNÇÕES DE BUSCA E PROCESSAMENTO DE DADOS ---
async function carregarConfigDaLoja() {
    if (lojaConfig) return;
    try {
        const configs = await fetchDeN8N(window.N8N_CONFIG.get_loja_config);
        if (configs && configs.length > 0) {
            lojaConfig = configs[0];
        }
    } catch (e) {
        console.error("Não foi possível carregar as configurações da loja para o financeiro", e);
    }
}

async function buscarDadosFinanceiros(dataInicio, dataFim) {
    document.getElementById('kpi-container').innerHTML = `<div class="bg-card p-6 rounded-lg text-center animate-pulse col-span-full"><p>Carregando dados...</p></div>`;
    document.getElementById('tabela-pedidos-corpo').innerHTML = `<tr><td colspan="5" class="text-center p-8 text-texto-muted animate-pulse">Buscando dados no servidor... 🚀</td></tr>`;
    try {
        const url = `${window.N8N_CONFIG.get_financial_report}?inicio=${dataInicio}&fim=${dataFim}`;
        const resposta = await fetchDeN8N(url);
        todosOsPedidosDoPeriodo = Array.isArray(resposta) ? resposta : [];
        aplicarFiltrosLocais();
    } catch (error) {
        console.error("Erro ao buscar dados financeiros:", error);
        document.getElementById('tabela-pedidos-corpo').innerHTML = `<tr><td colspan="5" class="text-center p-8 text-red-400">Falha ao carregar os dados.</td></tr>`;
    }
}

function aplicarFiltrosLocais() {
    const origem = document.getElementById('filtro-origem').value;
    const pagamento = document.getElementById('filtro-pagamento').value;
    const termoBusca = document.getElementById('busca-tabela').value.toLowerCase();
    pedidosFiltrados = todosOsPedidosDoPeriodo.filter(p => (origem === 'todos' || p.origem === origem) && (pagamento === 'todos' || p.forma_pagamento === pagamento) && (termoBusca === '' || (p.id_pedido_publico?.toLowerCase().includes(termoBusca)) || (p.nome_cliente?.toLowerCase().includes(termoBusca))));
    renderizarKPIs();
    renderizarTabela();
    renderizarGraficoLinha();
    renderizarGraficoPizza();
    renderizarFechamentoCaixa(pedidosFiltrados);
}

// --- FUNÇÕES DE RENDERIZAÇÃO ---
function gerarHtmlImpressaoFechamento(dados, datas) {
    const dataHora = new Date().toLocaleString('pt-BR');
    const { totaisPorOrigem, totalCouvert, totaisPorGarcom, acertoEntregadores } = dados;
    const faturamentoBruto = Object.values(totaisPorOrigem).reduce((acc, val) => acc + val, 0);

    const origemHtml = Object.entries(totaisPorOrigem).map(([origem, total]) => `<tr><td style="padding: 2px 0;">${origem}</td><td style="text-align: right;">${formatarMoeda(total)}</td></tr>`).join('');
    const garcomHtml = Object.entries(totaisPorGarcom).map(([garcom, total]) => `<tr><td style="padding: 2px 0;">${garcom}</td><td style="text-align: right;">${formatarMoeda(total * 0.10)}</td></tr>`).join('');
    const entregadorHtml = Object.entries(acertoEntregadores).map(([id, dados]) => `<tr><td style="padding: 2px 0;">${id.substring(0, 15)}... (${dados.count}x)</td><td style="text-align: right;">${formatarMoeda(dados.totalAPagar)}</td></tr>`).join('');

    return `
        <div style="width: 280px; font-size: 11px; font-family: 'Courier New', monospace; color: #000;">
            <h2 style="text-align: center; margin: 0; font-size: 14px;">Fechamento de Caixa</h2>
            <p style="text-align: center; margin: 2px 0; font-size: 10px;">Período: ${datas.inicio} a ${datas.fim}</p>
            <p style="text-align: center; margin: 0 0 5px; font-size: 9px;">Gerado em: ${dataHora}</p>
            <hr style="border: 0; border-top: 1px dashed #000;">
            <h3 style="font-size: 12px; margin: 8px 0 2px;">Vendas por Origem</h3>
            <table style="width: 100%; font-size: 10px;"><tbody>${origemHtml}</tbody></table>
            <div style="text-align: right; font-weight: bold; margin-top: 5px;">Total Bruto: ${formatarMoeda(faturamentoBruto)}</div>
            <hr style="border: 0; border-top: 1px dashed #000; margin-top: 8px;">
            <h3 style="font-size: 12px; margin: 8px 0 2px;">Repasses e Comissões</h3>
            <table style="width: 100%; font-size: 10px;"><tbody>
                <tr><td style="padding: 2px 0;">Couvert Artístico</td><td style="text-align: right;">${formatarMoeda(totalCouvert)}</td></tr>
                ${Object.keys(totaisPorGarcom).length > 0 ? `<tr><td colspan="2" style="font-weight: bold; padding-top: 5px;">Garçons (10%)</td></tr>${garcomHtml}` : ''}
                ${Object.keys(acertoEntregadores).length > 0 ? `<tr><td colspan="2" style="font-weight: bold; padding-top: 5px;">Acerto Entregadores</td></tr>${entregadorHtml}` : ''}
            </tbody></table>
            <hr style="border: 0; border-top: 1px dashed #000; margin-top: 8px;">
        </div>`;
}

function renderizarFechamentoCaixa(pedidos) {
    const container = document.getElementById('fechamento-caixa-container');
    if (!container || !pedidos || !lojaConfig) { container.innerHTML = ''; return; }
    if (pedidos.length === 0) { container.innerHTML = ''; return; }

    const totaisPorOrigem = pedidos.reduce((acc, p) => { acc[p.origem] = (acc[p.origem] || 0) + Number(p.total); return acc; }, {});
    const todosOsItens = pedidos.flatMap(p => p.itens_pedido || []);
    const totalCouvert = todosOsItens.filter(item => item.item === 'Couvert Artístico').reduce((acc, item) => acc + (Number(item.preco_unitario || 0) * item.quantidade), 0);
    
    // 👇 AQUI ESTÁ A LÓGICA CORRIGIDA E COMPLETA 👇
    const totaisPorGarcom = pedidos
        .filter(p => p.origem === 'MESA' && p.garcom_responsavel)
        .reduce((acc, p) => {
            // 1. Para cada pedido de mesa, calculamos o total SÓ dos produtos (excluindo taxas)
            const totalProdutosComissionaveis = (p.itens_pedido || [])
                .filter(item => item.item !== 'Couvert Artístico' && item.item !== 'Taxa de Serviço (10%)')
                .reduce((subtotal, item) => subtotal + (Number(item.preco_unitario || 0) * item.quantidade), 0);
            
            // 2. Acumulamos esse valor comissionável para o garçom responsável
            acc[p.garcom_responsavel] = (acc[p.garcom_responsavel] || 0) + totalProdutosComissionaveis;
            return acc;
        }, {});

    const acertoEntregadores = pedidos.filter(p => p.entregador_id).reduce((acc, p) => {
        const entregador = p.entregador_id;
        if (!acc[entregador]) acc[entregador] = { count: 0, totalAPagar: 0 };
        acc[entregador].count++;
        acc[entregador].totalAPagar = acc[entregador].count * (lojaConfig.custo_entrega_freela || 0);
        return acc;
    }, {});

    const origemHtml = Object.entries(totaisPorOrigem).map(([origem, total]) => `<div class="flex justify-between py-2 border-b border-borda/50"><span class="font-medium">${origem}</span><span class="font-bold text-principal">${formatarMoeda(total)}</span></div>`).join('');
    const garcomHtml = Object.entries(totaisPorGarcom).map(([garcom, total]) => `<tr><td class="py-2">${garcom}</td><td class="py-2 text-right font-bold text-green-400">${formatarMoeda(total * 0.10)}</td></tr>`).join('');
    const entregadorHtml = Object.entries(acertoEntregadores).map(([id, dados]) => `<tr class="hover:bg-sidebar/50"><td class="p-3">${id}</td><td class="p-3 text-center">${dados.count}</td><td class="p-3 font-bold text-green-400 text-right">${formatarMoeda(dados.totalAPagar)}</td></tr>`).join('');

    container.innerHTML = `
        <h2 class="text-4xl font-bold mb-2 border-t-2 border-principal pt-8 flex justify-between items-center">
            <span>Fechamento de Caixa 📋</span>
            <button id="btn-imprimir-fechamento" class="bg-sidebar text-white font-semibold py-2 px-4 rounded-lg text-base hover:bg-card transition-colors"><i class="bi bi-printer-fill mr-2"></i>Imprimir</button>
        </h2>
        <p class="text-texto-muted mb-8">Resumo consolidado para o período selecionado.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="bg-card p-6 rounded-lg"><h3 class="text-xl font-bold mb-4"><i class="bi bi-signpost-split-fill mr-2"></i>Totais por Origem</h3>${origemHtml || '<p class="text-texto-muted">N/A</p>'}</div>
            <div class="bg-card p-6 rounded-lg"><h3 class="text-xl font-bold mb-4"><i class="bi bi-wallet-fill mr-2"></i>Repasses e Comissões</h3><div class="flex justify-between py-2 border-b border-borda/50"><span class="font-medium">Couvert Artístico</span><span class="font-bold text-principal">${formatarMoeda(totalCouvert)}</span></div>${Object.keys(totaisPorGarcom).length > 0 ? `<h4 class="font-semibold mt-4 text-principal">Garçons (10%)</h4><table class="w-full"><tbody>${garcomHtml}</tbody></table>` : ''}</div>
        </div>
        <div class="bg-card p-6 rounded-lg mt-8 ${Object.keys(acertoEntregadores).length === 0 ? 'hidden' : ''}">
             <h3 class="text-xl font-bold mb-4"><i class="bi bi-bicycle mr-2"></i>Acerto de Entregadores</h3>
             <div class="overflow-x-auto"><table class="w-full text-left"><thead><tr class="border-b border-borda"><th class="p-3">ID Entregador</th><th class="p-3 text-center">Nº Entregas</th><th class="p-3 text-right">Total a Pagar</th></tr></thead><tbody>${entregadorHtml}</tbody></table></div>
        </div>
    `;

    document.getElementById('btn-imprimir-fechamento')?.addEventListener('click', () => {
        const dadosParaImpressao = { totaisPorOrigem, totalCouvert, totaisPorGarcom, acertoEntregadores };
        const datas = { inicio: document.getElementById('data-inicio').value.split('-').reverse().join('/'), fim: document.getElementById('data-fim').value.split('-').reverse().join('/') };
        const html = gerarHtmlImpressaoFechamento(dadosParaImpressao, datas);
        const printDiv = document.getElementById('print-fechamento-diario');
        printDiv.innerHTML = html;
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Fechamento de Caixa</title></head><body>' + printDiv.innerHTML + '</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    });
}

function renderizarGraficoPizza() {
    const ctx = document.getElementById('grafico-origem-pizza');
    if (!ctx) return;
    const vendasPorOrigem = pedidosFiltrados.reduce((acc, pedido) => { acc[pedido.origem] = (acc[pedido.origem] || 0) + 1; return acc; }, {});
    const labels = Object.keys(vendasPorOrigem);
    const data = Object.values(vendasPorOrigem);
    if (graficoPizza) { graficoPizza.destroy(); }
    graficoPizza = new Chart(ctx, { type: 'doughnut', data: { labels: labels, datasets: [{ label: 'Pedidos por Origem', data: data, backgroundColor: ['#ff6b35', '#4caf50', '#9c27b0', '#2196f3', '#ffc107'], borderColor: '#38326b', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: '#a3a0c2' } } } } });
}

function renderizarGraficoLinha() {
    const ctx = document.getElementById('grafico-faturamento-linha');
    if (!ctx) return;
    const faturamentoPorDia = pedidosFiltrados.reduce((acc, pedido) => { const data = new Date(pedido.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }); acc[data] = (acc[data] || 0) + Number(pedido.total); return acc; }, {});
    const labels = Object.keys(faturamentoPorDia).sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
    const data = labels.map(label => faturamentoPorDia[label]);
    if (graficoLinha) { graficoLinha.destroy(); }
    graficoLinha = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: 'Faturamento', data: data, fill: true, backgroundColor: 'rgba(255, 107, 53, 0.2)', borderColor: '#ff6b35', tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { color: '#a3a0c2' }, grid: { color: 'rgba(74, 68, 128, 0.5)' } }, x: { ticks: { color: '#a3a0c2' }, grid: { color: 'rgba(74, 68, 128, 0.2)' } } }, plugins: { legend: { display: false } } } });
}

function renderizarKPIs() {
    const kpiContainer = document.getElementById('kpi-container');
    if (!kpiContainer) return;
    const faturamentoBruto = pedidosFiltrados.reduce((acc, p) => acc + Number(p.total || 0), 0);
    const totalPedidos = pedidosFiltrados.length;
    const ticketMedio = totalPedidos > 0 ? faturamentoBruto / totalPedidos : 0;
    const totaisPagamento = pedidosFiltrados.reduce((acc, p) => { acc[p.forma_pagamento] = (acc[p.forma_pagamento] || 0) + Number(p.total); return acc; }, {});
    let pagamentosHtml = Object.entries(totaisPagamento).sort(([, a], [, b]) => b - a).map(([forma, total]) => `<div class="flex justify-between text-sm"><span class="text-texto-muted">${forma || 'N/A'}:</span> <span class="font-semibold">${formatarMoeda(total)}</span></div>`).join('');
    kpiContainer.innerHTML = `<div class="bg-card p-6 rounded-lg"><p class="text-texto-muted font-semibold">Faturamento Bruto</p><p class="text-3xl font-bold text-green-400">${formatarMoeda(faturamentoBruto)}</p></div><div class="bg-card p-6 rounded-lg"><p class="text-texto-muted font-semibold">Total de Pedidos</p><p class="text-3xl font-bold">${totalPedidos}</p></div><div class="bg-card p-6 rounded-lg"><p class="text-texto-muted font-semibold">Ticket Médio</p><p class="text-3xl font-bold">${formatarMoeda(ticketMedio)}</p></div><div class="bg-card p-6 rounded-lg"><p class="text-texto-muted font-semibold mb-2">Vendas por Pagamento</p><div class="space-y-1">${pagamentosHtml || '<p class="text-texto-muted text-sm">N/A</p>'}</div></div>`;
}

function renderizarTabela() {
    const corpoTabela = document.getElementById('tabela-pedidos-corpo');
    if (!corpoTabela) return;
    corpoTabela.innerHTML = '';
    if (pedidosFiltrados.length === 0) { corpoTabela.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-texto-muted">Nenhum pedido encontrado.</td></tr>`; return; }
    pedidosFiltrados.forEach(pedido => {
        const dataHora = new Date(pedido.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const corOrigem = { 'DELIVERY': 'bg-blue-500/20 text-blue-300', 'WHATSAPP': 'bg-green-500/20 text-green-300', 'MESA': 'bg-purple-500/20 text-purple-300', 'BALCAO': 'bg-yellow-500/20 text-yellow-300' }[pedido.origem] || 'bg-gray-500/20 text-gray-300';
        corpoTabela.innerHTML += `<tr class="hover:bg-sidebar/50"><td class="p-3 font-mono">#${pedido.id_pedido_publico}</td><td class="p-3">${dataHora}</td><td class="p-3"><span class="px-2 py-1 text-xs font-semibold rounded-full ${corOrigem}">${pedido.origem}</span></td><td class="p-3">${pedido.forma_pagamento || 'N/A'}</td><td class="p-3 text-right font-bold text-principal">${formatarMoeda(pedido.total)}</td></tr>`;
    });
}

async function carregarLogo() {
    const logoContainer = document.getElementById('logo-financeiro-container');
    try {
        if (lojaConfig) {
            const { nome_loja, logo_vitrine_url } = lojaConfig;
            document.title = `Financeiro - ${nome_loja || 'Meu Negócio'}`;
            logoContainer.innerHTML = logo_vitrine_url ? `<img src="${logo_vitrine_url}" alt="${nome_loja}" class="max-h-16 w-auto">` : `<span class="text-2xl font-bold text-principal">${nome_loja || 'Meu Financeiro'}</span>`;
        }
    } catch (error) { console.error("Erro ao carregar logo:", error); }
}

function initFinanceiroPage() {
    if (!document.getElementById('painel-financeiro-principal')) return;

    console.log("Maestro: Módulo Financeiro iniciado. 🎵💰");

    carregarConfigDaLoja().then(() => {
        carregarLogo();
        document.querySelector('#filtros-rapidos .filtro-btn[data-periodo="hoje"]').click();
    });
    
    document.getElementById('btn-aplicar-filtros').addEventListener('click', () => {
        document.querySelectorAll('#filtros-rapidos .filtro-btn').forEach(b => b.classList.remove('active'));
        const inicio = document.getElementById('data-inicio').value;
        const fim = document.getElementById('data-fim').value;
        if (inicio && fim) buscarDadosFinanceiros(inicio, fim);
        else Swal.fire({icon: 'warning', title: 'Datas faltando!', text: 'Selecione as datas de início e fim.', background: '#2c2854', color: '#ffffff'});
    });

    document.querySelectorAll('#filtros-rapidos .filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#filtros-rapidos .filtro-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const periodo = obterPeriodo(btn.dataset.periodo);
            document.getElementById('data-inicio').value = periodo.inicio;
            document.getElementById('data-fim').value = periodo.fim;
            buscarDadosFinanceiros(periodo.inicio, periodo.fim);
        });
    });

    document.getElementById('filtro-origem').addEventListener('change', aplicarFiltrosLocais);
    document.getElementById('filtro-pagamento').addEventListener('change', aplicarFiltrosLocais);
    document.getElementById('busca-tabela').addEventListener('keyup', aplicarFiltrosLocais);
}

document.addEventListener('DOMContentLoaded', initFinanceiroPage);