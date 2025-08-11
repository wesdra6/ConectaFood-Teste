// REESCREVA O ARQUIVO COMPLETO: app/js/functions/hub-integracao.js

import { fetchDeApi, enviarParaApi } from './api.js';

let lojaConfigFiscal = null; 

export function initHubIntegracaoPage() {
    console.log("Maestro: Página de Integração Fiscal iniciada. 🎵");
    inicializarFiltros();
}

function inicializarFiltros() {
    const btnHoje = document.querySelector('#filtros-rapidos-fiscais [data-periodo="hoje"]');
    if (btnHoje) {
        btnHoje.click();
    }
    document.getElementById('btn-aplicar-filtros-fiscais')?.addEventListener('click', () => {
        document.querySelectorAll('#filtros-rapidos-fiscais .filtro-btn').forEach(b => b.classList.remove('active'));
        const inicio = document.getElementById('data-inicio-fiscal').value;
        const fim = document.getElementById('data-fim-fiscal').value;
        if (inicio && fim) {
            buscarPedidosParaEmissao(inicio, fim);
        } else {
            Swal.fire({icon: 'warning', title: 'Datas incompletas!', text: 'Por favor, selecione as datas de início e fim.', background: '#2c2854', color: '#ffffff'});
        }
    });
    document.querySelectorAll('#filtros-rapidos-fiscais .filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#filtros-rapidos-fiscais .filtro-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const periodo = obterPeriodo(btn.dataset.periodo);
            document.getElementById('data-inicio-fiscal').value = periodo.inicio;
            document.getElementById('data-fim-fiscal').value = periodo.fim;
            buscarPedidosParaEmissao(periodo.inicio, periodo.fim);
        });
    });
}

function obterPeriodo(periodo) {
    const hoje = new Date();
    hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
    let inicio, fim;
    switch (periodo) {
        case 'hoje':
            inicio = new Date(hoje);
            fim = new Date(hoje);
            break;
        case 'ontem':
            inicio = new Date(hoje);
            inicio.setDate(hoje.getDate() - 1);
            fim = new Date(inicio);
            break;
        case 'semana':
            inicio = new Date(hoje);
            inicio.setDate(hoje.getDate() - hoje.getDay());
            fim = new Date(hoje);
            break;
    }
    const formata = (data) => data.toISOString().split('T')[0];
    return { inicio: formata(inicio), fim: formata(fim) };
}

async function buscarPedidosParaEmissao(dataInicio, dataFim) {
    const corpoTabela = document.getElementById('tabela-pedidos-fiscais-corpo');
    if (!corpoTabela) return;
    corpoTabela.innerHTML = `<div class="bg-card rounded-lg p-6 text-center text-texto-muted animate-pulse">Buscando pedidos finalizados de ${dataInicio.split('-').reverse().join('/')} a ${dataFim.split('-').reverse().join('/')}...</div>`;
    
    try {
        if (!lojaConfigFiscal) {
            const configs = await fetchDeApi(window.API_CONFIG.get_loja_config);
            if (configs && configs.length > 0) lojaConfigFiscal = configs[0];
        }
        const url = `${window.API_CONFIG.get_financial_report}?inicio=${dataInicio}&fim=${dataFim}`;
        const pedidos = await fetchDeApi(url);
        if (!pedidos || pedidos.length === 0) {
            corpoTabela.innerHTML = `<div class="bg-card rounded-lg p-6 text-center text-texto-muted"><i class="bi bi-check-circle text-4xl mb-3"></i><p>Nenhum pedido encontrado</p><p class="text-sm">Não há pedidos finalizados no período selecionado.</p></div>`;
            return;
        }
        renderizarTabelaFiscais(pedidos);
    } catch (error) {
        console.error("Erro ao buscar pedidos finalizados:", error);
        corpoTabela.innerHTML = `<div class="bg-card rounded-lg p-6 text-center text-red-400">Falha ao carregar pedidos. Verifique o console.</div>`;
    }
}

function renderizarTabelaFiscais(pedidos) {
    const corpoTabela = document.getElementById('tabela-pedidos-fiscais-corpo');
    if(!corpoTabela) return;
    corpoTabela.innerHTML = '';
    const origemCores = { 'WHATSAPP': 'bg-green-500/20 text-green-300', 'MESA': 'bg-purple-500/20 text-purple-300', 'BALCAO': 'bg-yellow-500/20 text-yellow-300', 'DELIVERY': 'bg-blue-500/20 text-blue-300' };
    
    pedidos.forEach(pedido => {
        const dataHora = new Date(pedido.created_at);
        const dataFormatada = dataHora.toLocaleDateString('pt-BR');
        const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const statusFiscal = pedido.status_fiscal || 'Pendente';
        let corStatus, acoesHtml;

        switch(statusFiscal) {
            case 'Emitida':
                corStatus = 'bg-green-500/30 text-green-300';
                acoesHtml = `<div class="flex items-center justify-center gap-2">
                    <button onclick="hubFunctions.baixarDocumento('${pedido.pdf_url}', 'pdf', '${pedido.id_pedido_publico}')" class="group relative flex items-center justify-center h-10 w-10 bg-sidebar rounded-lg hover:bg-fundo transition-colors" title="Baixar PDF da Nota"><i class="bi bi-file-earmark-arrow-down-fill text-xl text-blue-300 group-hover:text-blue-200"></i></button>
                    <button onclick="hubFunctions.baixarDocumento('${pedido.xml_url}', 'xml', '${pedido.id_pedido_publico}')" class="group relative flex items-center justify-center h-10 w-10 bg-sidebar rounded-lg hover:bg-fundo transition-colors" title="Baixar XML da Nota"><i class="bi bi-file-earmark-code-fill text-xl text-gray-300 group-hover:text-gray-200"></i></button>
                    <button class="group relative flex items-center justify-center h-10 w-10 bg-red-600/80 rounded-lg hover:bg-red-700 transition-colors" title="Cancelar NFC-e"><i class="bi bi-x-lg text-xl text-white"></i></button>
                </div>`;
                break;
            case 'Processando':
                corStatus = 'bg-blue-500/30 text-blue-300';
                acoesHtml = `<div class="flex items-center justify-center gap-2 text-blue-300"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300"></div><span>Processando...</span></div>`;
                break;
            case 'Erro':
                corStatus = 'bg-red-500/30 text-red-300';
                acoesHtml = `<button onclick="hubFunctions.emitirNota('${pedido.pedido_id}')" class="bg-principal text-white font-bold py-2 px-3 rounded-lg hover:bg-orange-600 transition-colors text-sm w-full"><i class="bi bi-arrow-clockwise"></i> Tentar Novamente</button>`;
                break;
            default:
                corStatus = 'bg-gray-500/30 text-gray-300';
                acoesHtml = `<button onclick="hubFunctions.emitirNota('${pedido.pedido_id}')" class="bg-principal text-white font-bold py-2 px-3 rounded-lg hover:bg-orange-600 transition-colors text-sm w-full"><i class="bi bi-receipt-cutoff"></i> Emitir NFC-e</button>`;
        }
        
        const itemElement = document.createElement('div');
        itemElement.innerHTML = `
            <div class="md:hidden bg-card rounded-lg p-4 space-y-3">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-lg">${pedido.nome_cliente}</p>
                        <p class="text-xs text-blue-400 font-mono">#${pedido.id_pedido_publico}</p>
                    </div>
                    <span class="text-sm text-texto-muted">${dataFormatada} - ${horaFormatada}</span>
                </div>
                <div class="flex justify-between items-center border-t border-borda/50 pt-3">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${origemCores[pedido.origem] || 'bg-gray-500/20 text-gray-300'}">${pedido.origem}</span>
                    <span class="font-bold text-principal text-lg">${(pedido.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div class="flex justify-between items-center border-t border-borda/50 pt-3">
                    <span class="px-3 py-1 text-sm font-semibold rounded-full ${corStatus}">${statusFiscal}</span>
                    <div class="w-1/2">${acoesHtml.replace('mt-2 md:mt-0', '')}</div>
                </div>
            </div>
            <div class="hidden md:grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-borda/50">
                <div class="col-span-2 text-sm"><p class="font-semibold">${dataFormatada}</p><p class="text-texto-muted">${horaFormatada}</p></div>
                <div class="col-span-3"><p class="font-bold truncate">${pedido.nome_cliente}</p><p class="text-xs text-blue-400 font-mono">#${pedido.id_pedido_publico}</p></div>
                <div class="col-span-2"><span class="px-2 py-1 text-xs font-semibold rounded-full ${origemCores[pedido.origem] || 'bg-gray-500/20 text-gray-300'}">${pedido.origem}</span></div>
                <div class="col-span-1 text-right"><p class="font-bold text-principal">${(pedido.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                <div class="col-span-2 text-center"><span class="px-3 py-1 text-sm font-semibold rounded-full ${corStatus}">${statusFiscal}</span></div>
                <div class="col-span-2 text-center">${acoesHtml}</div>
            </div>`;
        corpoTabela.appendChild(itemElement);
    });

    window.hubFunctions = {
        emitirNota: (pedidoId) => { 
            const pedidoParaEmitir = pedidos.find(p => p.pedido_id == pedidoId); 
            if (pedidoParaEmitir) { 
                enviarParaEmissao(pedidoParaEmitir); 
            } else { Swal.fire('Erro', 'Pedido não encontrado!', 'error'); } 
        },
        baixarDocumento: (url, tipo, idPublico) => { baixarDocumentoSeguro(url, tipo, idPublico); }
    };
}

async function enviarParaEmissao(pedido) {
    if (!lojaConfigFiscal || !lojaConfigFiscal.cnpj_cpf) { Swal.fire('Configuração Incompleta', 'É necessário cadastrar o CNPJ da loja em Configurações para emitir notas.', 'warning'); return; }
    Swal.fire({ title: 'Preparando Emissão...', text: `Coletando dados do pedido #${pedido.id_pedido_publico}`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const cpfCnpjEmitente = lojaConfigFiscal.cnpj_cpf.replace(/\D/g, '');
    const itensMapeados = (pedido.itens_pedido || []).map(item => { const preco = Number(item.preco_unitario || 0); const quantidade = Number(item.quantidade || 1); return { codigo: item.produto_id ? item.produto_id.toString() : "999", descricao: item.item, ncm: "21069090", cfop: "5102", valorUnitario: { comercial: preco, tributavel: preco }, valor: parseFloat((preco * quantidade).toFixed(2)), tributos: { icms: { origem: "0", cst: "102" }, pis: { cst: "07" }, cofins: { cst: "07" } } }; });
    const totalCalculado = itensMapeados.reduce((acc, item) => acc + item.valor, 0);
    const payloadPlugNotas = { idIntegracao: `PEDIDO-${pedido.id_pedido_publico}`, natureza: "VENDA", emitente: { cpfCnpj: cpfCnpjEmitente }, itens: itensMapeados, pagamentos: [{ aVista: true, meio: "99", valor: parseFloat(totalCalculado.toFixed(2)), valorTroco: 0 }], responsavelTecnico: { cpfCnpj: "48191554000140", nome: "UP Tecnology", email: "contato@uptecnology.com.br", telefone: { ddd: "62", numero: "32985050" } } };
    try {
        const resultado = await enviarParaApi(window.API_CONFIG.emitir_nfce, [payloadPlugNotas]);
        if (resultado.success) { Swal.fire('Sucesso!', 'NFC-e enviada para autorização! A tela será atualizada.', 'success'); setTimeout(() => buscarPedidosParaEmissao(document.getElementById('data-inicio-fiscal').value, document.getElementById('data-fim-fiscal').value), 1500); } else { throw new Error(resultado.message || 'Erro retornado pelo servidor de notas.'); }
    } catch (error) { Swal.fire({ icon: 'error', title: 'Falha na Emissão', html: `Não foi possível enviar a nota.<br><br><b class="text-principal">Erro:</b> ${error.message}` }); }
}

async function baixarDocumentoSeguro(url, tipo, idPublico) {
    if (!url) { Swal.fire('Ops!', 'A URL do documento não foi encontrada.', 'error'); return; }
    Swal.fire({ title: `Baixando ${tipo.toUpperCase()}...`, text: 'Aguarde, estamos buscando o arquivo.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    try {
        const resultado = await enviarParaApi(window.API_CONFIG.download_documento_fiscal, { url });
        
        if (resultado && resultado.fileData) {
            
            const base64Response = await fetch(`data:application/octet-stream;base64,${resultado.fileData}`);
            const blob = await base64Response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `nfce_${idPublico}.${tipo}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            Swal.close();
        } else {
            throw new Error(resultado.message || 'O servidor não retornou os dados do arquivo.');
        }
    } catch (error) {
        Swal.fire('Erro no Download', `Não foi possível baixar o arquivo: ${error.message}`, 'error');
    }
}