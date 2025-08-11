// REESCREVA O ARQUIVO COMPLETO: app/js/functions/pedidos.js

import { enviarParaApi, fetchDeApi } from './api.js';
import { gerarHtmlImpressao, imprimirComprovante } from './impressao.js';
import { criaCardProduto } from './components.js';

let todosOsPedidosAtivos = [], todosOsProdutosCaixa = [], pedidoEmGerenciamento = null, modalGerenciamento = null, paginaAtual = 1;
let pedidosFinalizadosAtuais = [];
const itensPorPagina = 6;
let filtroAtivo = 'ativos', termoBusca = '', containerAtivos;
let lojaConfig = null;

async function fetchLojaConfigParaImpressao() {
    if (lojaConfig) return;
    try {
        const configs = await fetchDeApi(window.API_CONFIG.get_loja_config);
        if (configs && configs.length > 0) lojaConfig = configs[0];
    } catch (error) { console.error("Não foi possível carregar as configs da loja para impressão no painel de pedidos.", error); }
}

async function imprimirNotaParaEntrega(pedido) {
    if (!lojaConfig) await fetchLojaConfigParaImpressao();
    const html = gerarHtmlImpressao(pedido, lojaConfig);
    imprimirComprovante(html);
}

async function adicionarItemAoPedido(produtoId) {
    if (!pedidoEmGerenciamento) return;
    const produto = todosOsProdutosCaixa.find(p => p.id === produtoId);
    if (!produto) return;
    const itemPayload = {
        pedido_id: pedidoEmGerenciamento.id,
        produto_id: produto.id,
        quantidade: 1,
        preco_unitario: produto.preco
    };
    try {
        const resultado = await enviarParaApi(window.API_CONFIG.add_item_to_order, itemPayload);
        if (resultado.success) {
            const url = `${window.API_CONFIG.get_order_status}?id=${pedidoEmGerenciamento.id}`;
            const resposta = await fetchDeApi(url);
            if (resposta && resposta[0]) {
                pedidoEmGerenciamento = resposta[0];
                renderizarComandaGerenciamento(pedidoEmGerenciamento.contexto);
                buscarPedidosAtivos();
            }
        } else { throw new Error(resultado.message || 'Erro ao adicionar item.'); }
    } catch (error) { Swal.fire('Ops!', `Não foi possível adicionar o item: ${error.message}`, 'error'); }
}

export async function removerItemDoPedido(itemId) {
    if (!pedidoEmGerenciamento) return;
    try {
        const resultado = await enviarParaApi(window.API_CONFIG.remove_item_from_order, { item_id: itemId });
        if (resultado.success) {
            const url = `${window.API_CONFIG.get_order_status}?id=${pedidoEmGerenciamento.id}`;
            const resposta = await fetchDeApi(url);
            if (resposta && resposta[0]) {
                pedidoEmGerenciamento = resposta[0];
                renderizarComandaGerenciamento(pedidoEmGerenciamento.contexto);
                buscarPedidosAtivos();
            }
        } else { throw new Error(resultado.message || 'Erro ao remover item.'); }
    } catch (error) { Swal.fire('Ops!', `Não foi possível remover o item: ${error.message}`, 'error'); }
}

export async function abrirModalGerenciamento(pedidoId, contexto = 'CAIXA') {
    if (!pedidoId) { console.error("ID de pedido inválido."); return; }
    Swal.fire({ title: 'Carregando pedido...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
        const url = `${window.API_CONFIG.get_order_status}?id=${pedidoId}`;
        const resposta = await fetchDeApi(url);
        const pedidoAtualizado = (Array.isArray(resposta) && resposta.length > 0) ? resposta[0] : null;
        if (!pedidoAtualizado) throw new Error("Pedido não encontrado.");

        if (todosOsProdutosCaixa.length === 0) {
            todosOsProdutosCaixa = await fetchDeApi(window.API_CONFIG.get_all_products_with_type);
        }
        
        pedidoEmGerenciamento = JSON.parse(JSON.stringify(pedidoAtualizado));
        pedidoEmGerenciamento.contexto = contexto; // Adiciona o contexto ao objeto do pedido
        if (!pedidoEmGerenciamento.itens_pedido) pedidoEmGerenciamento.itens_pedido = [];

        document.getElementById('gerenciamento-modal-titulo').innerHTML = `Gerenciar Pedido <span class="text-principal">#${pedidoEmGerenciamento.id_pedido_publico}</span>`;
        
        const btnCancelar = document.getElementById('btn-cancelar-pedido');
        const btnImprimir = document.getElementById('btn-imprimir-preconta');
        if (contexto === 'GARCOM') {
            if(btnCancelar) btnCancelar.classList.add('hidden');
            if(btnImprimir) btnImprimir.classList.remove('hidden');
            if(btnImprimir) btnImprimir.onclick = async () => {
                if (!lojaConfig) await fetchLojaConfigParaImpressao();
                const html = gerarHtmlImpressao(pedidoEmGerenciamento, lojaConfig, true);
                imprimirComprovante(html);
            };
        } else { 
            if(btnCancelar) btnCancelar.classList.remove('hidden');
            if(btnImprimir) btnImprimir.classList.add('hidden');
            if(btnCancelar) btnCancelar.onclick = () => cancelarPedido();
        }
        
        renderizarCardapioGerenciamento();
        renderizarComandaGerenciamento(contexto);
        
        if (!modalGerenciamento) {
            const modalEl = document.getElementById('modal-gerenciamento-pedido');
            if (modalEl) modalGerenciamento = new bootstrap.Modal(modalEl);
        }
        Swal.close();
        if(modalGerenciamento) modalGerenciamento.show();
    } catch (e) { Swal.fire('Ops!', `Não foi possível carregar os detalhes do pedido: ${e.message}`, 'error'); }
}

async function extrairListaDePedidos(respostaDoN8N) { if (Array.isArray(respostaDoN8N)) { return respostaDoN8N; } if (typeof respostaDoN8N === 'object' && respostaDoN8N !== null && Array.isArray(respostaDoN8N.data)) { return respostaDoN8N.data; } return []; }

async function buscarPedidosAtivos() { 
    try { 
        const respostaDoN8N = await fetchDeApi(window.API_CONFIG.get_all_orders); 
        todosOsPedidosAtivos = await extrairListaDePedidos(respostaDoN8N); 
        renderizarPedidosAtivos(); 
    } catch (e) { 
        console.error(`Falha ao buscar pedidos ativos:`, e); 
        if(containerAtivos) containerAtivos.innerHTML = `<p class="text-red-400">Ops! A comunicação com a cozinha falhou.</p>`; 
    } 
}

async function solicitarDadosEntregador(pedido) {
    const { value: telefone } = await Swal.fire({ title: 'Despachar Pedido', html: `Despachando pedido <strong>#${pedido.id_pedido_publico}</strong>.<br>Digite o WhatsApp do entregador no formato internacional.`, input: 'tel', inputPlaceholder: 'Ex: 5562912345678', inputAttributes: { oninput: "this.value = this.value.replace(/[^0-9]/g, '')" }, showCancelButton: true, confirmButtonText: 'Enviar & Despachar →', background: '#2c2854', color: '#ffffff', inputValidator: (value) => { if (!value) { return 'Você precisa digitar um número!'; } if (!/^55[1-9]{2}9?[0-9]{8}$/.test(value)) { return 'Formato inválido! Use 55 + DDD + Número.'; } } });
    if (telefone) { Swal.fire({ title: 'Despachando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() }); try { await enviarParaApi(window.API_CONFIG.send_delivery_details, { whatsapp_entregador: telefone, pedido: pedido }); await enviarParaApi(window.API_CONFIG.update_order_status, { id: pedido.id, status: 'A_CAMINHO' }); dispararNotificacaoStatus(pedido, 'A_CAMINHO'); await buscarPedidosAtivos(); Swal.fire('Despachado!', 'O entregador foi notificado e o status foi atualizado.', 'success'); } catch (error) { console.error("Erro na cadeia de despacho:", error); Swal.fire('Erro!', 'Não foi possível completar o despacho.', 'error'); } }
}

function dispararNotificacaoStatus(pedido, status) {
    const isWhatsAppValido = pedido.whatsapp_cliente && pedido.whatsapp_cliente !== 'PED-INTERNO';
    const statusRelevantes = ['EM_PREPARO', 'PRONTO_PARA_ENTREGA', 'A_CAMINHO'];
    if (!isWhatsAppValido || !statusRelevantes.includes(status)) { return; }
    const payload = { whatsapp_cliente: pedido.whatsapp_cliente, nome_cliente: pedido.nome_cliente, id_pedido_publico: pedido.id_pedido_publico, status: status };
    enviarParaApi(window.API_CONFIG.send_whatsapp_status, payload).catch(err => console.error("Falha ao notificar cliente via WhatsApp:", err));
}

async function cancelarPedido() {
    if (!pedidoEmGerenciamento) return;
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: `Deseja cancelar o pedido #${pedidoEmGerenciamento.id_pedido_publico}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sim, cancelar!',
        cancelButtonText: 'Não',
        background: '#2c2854',
        color: '#ffffff'
    });
    if (result.isConfirmed) {
        Swal.fire({ title: 'Cancelando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            await enviarParaApi(window.API_CONFIG.cancel_order, {
                pedido_id: pedidoEmGerenciamento.id,
                id_mesa: pedidoEmGerenciamento.id_mesa || null
            });
            Swal.fire('Cancelado!', 'O pedido foi cancelado com sucesso.', 'success');
            if (modalGerenciamento) modalGerenciamento.hide();
            await buscarPedidosAtivos();
            window.dispatchEvent(new CustomEvent('recarregarMesas'));
        } catch (error) {
            console.error("Erro ao cancelar pedido:", error);
            Swal.fire('Ops!', 'Não foi possível cancelar o pedido.', 'error');
        }
    }
}

function mudarPagina(pg) { paginaAtual = pg; renderizarPedidosAtivos(); }

async function atualizarStatusPedido(pedidoId, novoStatus) {
    const pedido = todosOsPedidosAtivos.find(p => p.id === pedidoId);
    if (!pedido) return;
    if (novoStatus === 'A_CAMINHO' && pedido.origem !== 'BALCAO' && pedido.origem !== 'MESA') { solicitarDadosEntregador(pedido); return; }
    try { 
        Swal.fire({ title: 'Atualizando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() }); 
        await enviarParaApi(window.API_CONFIG.update_order_status, { id: pedidoId, status: novoStatus }); 
        dispararNotificacaoStatus(pedido, novoStatus); 
        await buscarPedidosAtivos(); 
        Swal.close(); 
    } catch (error) { console.error("Erro ao atualizar status:", error); Swal.fire('Ops!', 'Não foi possível atualizar o status.', 'error'); }
}

function abrirModalGerenciamentoNaView(pedidoId) {
    abrirModalGerenciamento(pedidoId);
}

function renderizarCardapioGerenciamento(produtos = todosOsProdutosCaixa) {
    const listaProdutos = document.getElementById('gerenciamento-lista-produtos');
    if (!listaProdutos) return;
    listaProdutos.innerHTML = '';
    let produtosParaExibir = produtos.filter(p => p.nome !== 'Taxa de Serviço (10%)');
    if (pedidoEmGerenciamento.origem === 'DELIVERY' || pedidoEmGerenciamento.origem === 'WHATSAPP') {
        produtosParaExibir = produtosParaExibir.filter(p => p.tipo_item === 'PRODUTO' || p.nome === 'Taxa de Entrega Adicional');
    }
    const produtosPorCategoria = produtosParaExibir.reduce((acc, produto) => { 
        (acc[produto.nome_categoria || 'Outros'] = acc[produto.nome_categoria || 'Outros'] || []).push(produto); 
        return acc; 
    }, {});
    const categoriasOrdenadas = Object.keys(produtosPorCategoria).sort();
    for (const categoria of categoriasOrdenadas) {
        const h3 = document.createElement('h3');
        h3.className = "text-lg font-bold text-principal border-b-2 border-principal/50 mb-3 mt-4 first:mt-0";
        h3.innerText = categoria;
        listaProdutos.appendChild(h3);
        produtosPorCategoria[categoria].forEach(produto => {
            const itemProduto = criaCardProduto(produto, 'caixa', adicionarItemAoPedido); 
            if (itemProduto) listaProdutos.appendChild(itemProduto);
        });
    }
}

function renderizarComandaGerenciamento(contexto) {
    const comandaContainer = document.getElementById('gerenciamento-comanda-itens');
    const totalEl = document.getElementById('gerenciamento-comanda-total');
    if (!comandaContainer || !totalEl || !pedidoEmGerenciamento) return;
    comandaContainer.innerHTML = '';
    let totalPedido = 0;
    (pedidoEmGerenciamento.itens_pedido || []).forEach(item => {
        const subtotal = (item.quantidade || 0) * (item.preco_unitario || 0);
        totalPedido += subtotal;
        const itemHtml = document.createElement('div');
        itemHtml.className = "flex justify-between items-center text-sm mb-2 p-2 rounded-md bg-fundo";
        const nomeItem = item.item || item.nome;
        
        const isTaxaIntocavel = item.produto_id === 99999 || nomeItem.toLowerCase() === 'taxa de entrega';
        
        let botaoAcaoHtml;

        if (isTaxaIntocavel) {
            botaoAcaoHtml = `<button class="text-gray-500 cursor-not-allowed" disabled title="A taxa de entrega não pode ser removida."><i class="bi bi-lock-fill text-lg"></i></button>`;
        } else if (contexto === 'GARCOM') {
            botaoAcaoHtml = `<button class="text-gray-500 cursor-not-allowed" disabled title="Apenas o Caixa pode remover itens"><i class="bi bi-trash-fill text-lg"></i></button>`;
        } else {
            botaoAcaoHtml = `<button class="btn-remover-item text-red-500 hover:text-red-400" aria-label="Remover ${nomeItem}"><i class="bi bi-trash-fill text-lg"></i></button>`;
        }
        
        itemHtml.innerHTML = `
            <div class="flex-grow"><span class="font-bold">${item.quantidade}x</span> ${nomeItem}</div>
            <div class="flex items-center gap-4">
                <span class="font-semibold text-principal w-24 text-right">R$ ${subtotal.toFixed(2)}</span>
                ${botaoAcaoHtml}
            </div>`;

        if (!isTaxaIntocavel && contexto !== 'GARCOM') {
            const btnRemover = itemHtml.querySelector('.btn-remover-item');
            if (btnRemover) btnRemover.addEventListener('click', () => removerItemDoPedido(item.id));
        }
        comandaContainer.appendChild(itemHtml);
    });
    totalEl.textContent = `R$ ${totalPedido.toFixed(2)}`;
}

function gerarBotoesDeAcao(pedido) {
    const container = document.createElement('div');
    container.className = "mt-2 pt-3 border-t border-borda/50 flex flex-wrap gap-2";
    const statusAtualPedido = (pedido.status || '').toUpperCase();
    if (statusAtualPedido === 'ENTREGUE' || statusAtualPedido === 'CANCELADO') {
        container.innerHTML = `<div class="w-full text-center py-2 px-3 text-sm rounded-md ${statusAtualPedido === 'CANCELADO' ? 'bg-red-800' : 'bg-card text-green-400'} font-semibold">PEDIDO ${statusAtualPedido}</div>`;
        return container;
    }
    let statusFlow;
    switch (pedido.origem) {
        case 'BALCAO': statusFlow = window.APP_CONFIG.statusFlowBalcao; break;
        case 'MESA': statusFlow = window.APP_CONFIG.statusFlowMesa; break;
        default: statusFlow = window.APP_CONFIG.statusFlowPadrao; break;
    }
    const flowOrder = window.APP_CONFIG.flowOrder;
    const indiceStatusAtual = flowOrder.indexOf(statusAtualPedido);
    statusFlow.forEach(step => {
        const indiceStep = flowOrder.indexOf(step.requiredStatus);
        const isEtapaAtiva = indiceStep === indiceStatusAtual;
        const btn = document.createElement('button');
        let icone = '', textoBotao = step.text;
        if (isEtapaAtiva) {
            btn.title = 'Clique para executar esta ação';
            if (step.isPrintOnly) { btn.onclick = () => imprimirNotaParaEntrega(pedido); }
            else { btn.onclick = () => atualizarStatusPedido(pedido.id, step.nextStatus); }
            if (step.isFinalAction) { btn.className = `w-full py-3 px-1 text-sm rounded-md font-bold text-white transition-all uppercase bg-green-600 hover:bg-green-700`; }
            else { btn.className = `flex-grow sm:flex-grow-0 basis-1/${statusFlow.length} py-2 px-1 text-xs rounded-md font-semibold text-white transition-all uppercase bg-principal hover:opacity-80`; }
        } else if (indiceStep < indiceStatusAtual) {
            btn.className = `flex-grow sm:flex-grow-0 basis-1/${statusFlow.length} py-2 px-1 text-xs rounded-md font-semibold text-white transition-all uppercase bg-green-600 cursor-default`;
            icone = `<i class="bi bi-check-lg mr-1"></i>`;
            textoBotao = step.textCompleted || step.text;
            btn.title = 'Etapa já concluída';
        } else {
            btn.className = `flex-grow sm:flex-grow-0 basis-1/${statusFlow.length} py-2 px-1 text-xs rounded-md font-semibold text-white transition-all uppercase bg-gray-500/50 cursor-not-allowed opacity-60`;
            icone = `<i class="bi bi-slash-circle mr-1"></i>`;
            btn.title = 'Aguardando etapa anterior';
        }
        btn.innerHTML = `${icone}${textoBotao}`;
        container.appendChild(btn);
    });
    return container;
}

function renderizarPaginacao(totalItens) {
    const pagContainer = document.getElementById('paginacao-container');
    if (!pagContainer) return;
    pagContainer.innerHTML = '';
    const totalPaginas = Math.ceil(totalItens / itensPorPagina);
    if (totalPaginas <= 1) return;
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.className = `px-4 py-2 rounded-md font-bold ${i === paginaAtual ? 'bg-principal text-white' : 'bg-card hover:bg-sidebar'}`;
        btn.innerText = i;
        btn.onclick = () => mudarPagina(i);
        pagContainer.appendChild(btn);
    }
}

function renderizarPedidosAtivos() {
    if (!containerAtivos) return;
    const pedidosFiltrados = todosOsPedidosAtivos.filter(p => {
        if (!p || !p.id) return false;
        const filtroOrigemOk = filtroAtivo === 'ativos' || p.origem === filtroAtivo;
        const termoBuscaOk = !termoBusca || 
                             (p.nome_cliente || '').toLowerCase().includes(termoBusca) || 
                             (p.id_pedido_publico || '').toLowerCase().includes(termoBusca);
        return filtroOrigemOk && termoBuscaOk;
    });
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const pedidosPaginados = pedidosFiltrados.slice(inicio, fim);
    containerAtivos.innerHTML = '';
    if (pedidosPaginados.length === 0) {
        containerAtivos.innerHTML = `<p class="text-texto-muted col-span-full text-center py-10">Nenhum pedido ativo encontrado com este filtro.</p>`;
        renderizarPaginacao(0);
        return;
    }
    pedidosPaginados.forEach(pedido => {
        const card = document.createElement('div');
        card.className = "bg-card rounded-lg p-4 relative flex flex-col";
        const itensHtml = (Array.isArray(pedido.itens_pedido) ? pedido.itens_pedido : []).map(item => `<div><span class="font-semibold text-principal">${item.quantidade || '??'}x</span> ${item.item || 'Item desconhecido'}</div>`).join('') || '<div class="text-red-400 font-semibold">Nenhum item neste pedido.</div>';
        const corOrigem = window.APP_CONFIG.origemCores[pedido.origem] || 'bg-gray-500';
        const horaEntrada = pedido.created_at ? new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        card.innerHTML = `
            <div class="absolute top-0 left-0 h-full w-2 ${corOrigem}"></div>
            <div class="pl-4 flex flex-col flex-grow">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold text-lg">${(pedido.nome_cliente || 'Cliente Indefinido').toUpperCase()}</h4>
                        <span class="text-sm text-texto-muted">#${pedido.id_pedido_publico || ''}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-xl text-principal">R$ ${Number(pedido.total || 0).toFixed(2)}</span>
                        ${(pedido.status !== 'ENTREGUE' && pedido.status !== 'CANCELADO') ? `<button class="btn-gerenciar-pedido p-2 rounded-md hover:bg-sidebar transition-colors"><i class="bi bi-gear-fill text-lg text-blue-400"></i></button>` : ''}
                    </div>
                </div>
                <div class="text-lg font-bold text-principal mb-2"><i class="bi bi-clock-fill"></i> Chegou às: ${horaEntrada}</div>
                <div class="my-2 border-t border-borda"></div>
                <div class="space-y-1 mb-3 text-sm">${itensHtml}</div>
            </div>`;
        const infoContainer = document.createElement('div');
        infoContainer.className = 'text-xs space-y-1 mt-auto pt-2 pl-4';
        infoContainer.innerHTML = `
            ${pedido.forma_pagamento ? `<div class="text-sm font-semibold text-principal mb-2"><i class="bi bi-credit-card-fill"></i> Pagamento: ${pedido.forma_pagamento}</div>` : ''}
            ${(pedido.origem !== 'BALCAO' && pedido.origem !== 'MESA' && pedido.rua) ? `<p class="text-texto-muted text-xs"><i class="bi bi-geo-alt-fill"></i> ${pedido.bairro ? `${pedido.bairro} - ` : ''}${pedido.rua || ''}, Q ${pedido.quadra || ''}, L ${pedido.lote || ''}</p>` : ''}
            ${(pedido.whatsapp_cliente && pedido.whatsapp_cliente !== 'PED-INTERNO') ? `<p class="text-texto-muted text-xs"><i class="bi bi-whatsapp"></i> ${pedido.whatsapp_cliente}</p>` : ''}
            ${(pedido.origem === 'MESA' && pedido.garcom_responsavel) ? `<p class="text-texto-muted text-base"><i class="bi bi-person-fill"></i> Garçom: ${pedido.garcom_responsavel}</p>` : ''}
            ${pedido.observacoes ? `<div class="mt-2 pt-2 border-t border-borda/30"><p class="text-yellow-400 font-semibold text-sm flex items-center gap-2"><i class="bi bi-chat-left-dots-fill"></i><span>Observação:</span></p><p class="text-texto-muted text-sm pl-2 italic">"${pedido.observacoes}"</p></div>` : ''}
        `;
        const botoesAcaoContainer = gerarBotoesDeAcao(pedido);
        card.querySelector('.flex-grow').appendChild(infoContainer);
        card.querySelector('.flex-grow').appendChild(botoesAcaoContainer);
        const btnGerenciar = card.querySelector('.btn-gerenciar-pedido');
        if(btnGerenciar) { btnGerenciar.onclick = () => abrirModalGerenciamentoNaView(pedido.id); }
        containerAtivos.appendChild(card);
    });
    renderizarPaginacao(pedidosFiltrados.length);
}

async function mostrarDetalhesPedidoFinalizado(pedido) { 
    if (!pedido || !pedido.id) { Swal.fire({ icon: 'error', title: 'Ops!', text: 'Não foi possível carregar os detalhes do pedido.', background: '#2c2854', color: '#ffffff' }); return; } 
    const labelStyle = `style="color: #ff6b35; font-weight: 600;"`; 
    const itens = pedido.itens_pedido || []; 
    const itensHtml = itens.length > 0 ? itens.map(item => `<div style="padding: 2px 0;"><span ${labelStyle}>${item.quantidade || '?'}x</span> ${item.item || 'Item desconhecido'}</div>`).join('') : 'Nenhum item detalhado encontrado.'; 
    const enderecoHtml = pedido.rua ? `<div class="mt-2"><span ${labelStyle}><i class="bi bi-geo-alt-fill"></i> Endereço:</span> ${pedido.rua}, ${pedido.bairro || ''}</div>` : ''; 
    const pagamentoHtml = pedido.forma_pagamento ? `<div class="mt-2"><span ${labelStyle}><i class="bi bi-credit-card-fill"></i> Pagamento:</span> ${pedido.forma_pagamento}</div>` : ''; 
    const garcomHtml = pedido.garcom_responsavel ? `<div class="mt-2"><span ${labelStyle}><i class="bi bi-person-badge-fill"></i> Garçom:</span> ${pedido.garcom_responsavel}</div>` : ''; 
    Swal.fire({ title: `Detalhes Pedido #${pedido.id_pedido_publico || 'N/A'}`, html: `<div class="text-left text-lg space-y-2"><div><span ${labelStyle}><i class="bi bi-person-fill"></i> Cliente:</span> ${pedido.nome_cliente || 'N/A'}</div><div><span ${labelStyle}><i class="bi bi-cash-coin"></i> Total:</span> R$ ${Number(pedido.total || 0).toFixed(2)}</div>${pagamentoHtml} ${enderecoHtml} ${garcomHtml}<hr class="my-3 border-borda/50"><div class="text-base"><div ${labelStyle} class="mb-2 text-xl">Itens do Pedido:</div>${itensHtml}</div></div>`, background: '#38326b', color: '#ffffff', showCloseButton: true, confirmButtonText: 'Fechar', confirmButtonColor: '#ff6b35' }); 
}

async function renderizarListaFinalizados(pedidos, titulo) {
    if (!pedidos || pedidos.length === 0) { Swal.fire({ icon: 'info', title: 'Nenhum Pedido', text: `A busca por ${titulo.toLowerCase()} não retornou resultados.`, background: '#2c2854', color: '#ffffff' }); return; }
    pedidosFinalizadosAtuais = pedidos; 
    const container = document.createElement('div'); container.className = 'text-left max-h-96 overflow-y-auto'; 
    const table = document.createElement('table'); table.className = 'w-full'; table.style.borderCollapse = 'collapse'; 
    const headerStyle = `padding: 12px; text-align: left; color: #ff6b35; font-weight: 600; border-bottom: 2px solid #4a4480;`; 
    table.innerHTML = `<thead><tr><th style="${headerStyle}">Cód.</th><th style="${headerStyle}">Cliente</th><th style="${headerStyle}">Origem</th><th style="${headerStyle}" class="text-right">Total</th></tr></thead>`; 
    const tableBody = document.createElement('tbody'); 
    const cellStyle = `padding: 10px; border-top: 1px solid #4a4480;`;
    pedidos.forEach(p => {
        const corHex = window.APP_CONFIG.origemCores[p.origem]?.replace('bg-', '') || 'gray-500';
        const origemTag = `<span style="background-color: var(--tw-color-${corHex}); color: white; font-size: 0.75rem; font-weight: bold; padding: 4px 8px; border-radius: 9999px;">${p.origem}</span>`;
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.innerHTML = `<td style="${cellStyle}" class="font-mono">#${p.id_pedido_publico}</td> <td style="${cellStyle}">${p.nome_cliente}</td> <td style="${cellStyle}">${origemTag}</td> <td style="${cellStyle}" class="font-bold text-right">R$ ${Number(p.total).toFixed(2)}</td>`;
        tr.onmouseover = () => tr.style.backgroundColor = '#38326b';
        tr.onmouseout = () => tr.style.backgroundColor = 'transparent';
        tr.onclick = () => mostrarDetalhesPedidoFinalizado(p);
        tableBody.appendChild(tr);
    });
    table.appendChild(tableBody); 
    container.appendChild(table); 
    Swal.close(); 
    await new Promise(resolve => setTimeout(resolve, 200));
    Swal.fire({ title: titulo, html: container, width: '800px', background: '#2c2854', color: '#ffffff', confirmButtonText: 'Fechar', confirmButtonColor: '#ff6b35' });
}

async function buscarFinalizadosPorData(data) { 
    Swal.fire({ title: 'Buscando Histórico...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#2c2854', color: '#ffffff' }); 
    try { 
        const url = `${window.API_CONFIG.get_finalized_orders_by_date}?data=${data}`; 
        const pedidos = await fetchDeApi(url); 
        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        const dataHojeFormatada = hoje.toISOString().split('T')[0];
        const titulo = data === dataHojeFormatada ? 'Pedidos Finalizados de Hoje' : `Pedidos de ${new Date(data + 'T03:00:00Z').toLocaleDateString('pt-BR')}`;
        renderizarListaFinalizados(pedidos, titulo); 
    } catch (error) { 
        console.error("Erro ao buscar pedidos por data:", error); 
        Swal.fire('Ops!', 'Não foi possível buscar o histórico de pedidos.', 'error'); 
    } 
}

async function buscarPedidoPorCodigo() { 
    const input = document.getElementById('filtro-busca-finalizados'); 
    const termo = input.value.trim().toUpperCase(); 
    if (!termo) return; 
    Swal.fire({ title: 'Buscando...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#2c2854', color: '#ffffff'}); 
    try { 
        const url = `${window.API_CONFIG.get_finalized_order_by_code}?id=${termo}`; 
        const resposta = await fetchDeApi(url); 
        const pedido = (resposta && resposta.length > 0) ? resposta[0] : null; 
        Swal.close(); 
        await new Promise(resolve => setTimeout(resolve, 200)); 
        if (pedido) { 
            mostrarDetalhesPedidoFinalizado(pedido); 
        } else { 
            Swal.fire({ icon: 'info', title: 'Não encontrado', text: 'Nenhum pedido finalizado com esse código foi encontrado em todo o histórico.', background: '#2c2854', color: '#ffffff' }); 
        } 
    } catch (error) { console.error("Erro ao buscar pedido por código:", error); Swal.fire('Ops!', 'Não foi possível realizar a busca.', 'error'); } 
}

export function initPedidosPage() {
    containerAtivos = document.getElementById('lista-pedidos-admin');
    if (!containerAtivos) return;

    if (!window.listenersPedidosOk) {
        window.addEventListener('novoPedidoRecebido', () => {
            const pedidosPage = document.getElementById('pedidos-page');
            if (pedidosPage && !pedidosPage.classList.contains('hidden')) {
                buscarPedidosAtivos();
            }
        });
        window.addEventListener('pedidoFinalizado', () => {
            buscarPedidosAtivos(); 
            window.dispatchEvent(new CustomEvent('recarregarMesas'));
        });
        window.listenersPedidosOk = true;
    }
    
    const viewContainer = document.getElementById('pedidos-page');
    viewContainer.querySelectorAll('.tab-btn').forEach(tab => { 
        tab.onclick = () => {
            filtroAtivo = tab.dataset.filtro;
            paginaAtual = 1;
            viewContainer.querySelector('.tab-btn.active')?.classList.remove('active');
            tab.classList.add('active');
            const containerAtivosEl = document.getElementById('pedidos-ativos-container');
            const containerFinalizados = document.getElementById('pedidos-finalizados-container');
            if (filtroAtivo === 'finalizados') {
                containerAtivosEl.classList.add('hidden');
                containerFinalizados.classList.remove('hidden');
            } else {
                containerAtivosEl.classList.remove('hidden');
                containerFinalizados.classList.add('hidden');
                buscarPedidosAtivos(); 
            }
        };
    });
    
    document.getElementById('filtro-busca-pedidos').onkeyup = (e) => {
        termoBusca = e.target.value.toLowerCase().trim();
        paginaAtual = 1;
        renderizarPedidosAtivos();
    };

    document.getElementById('btn-buscar-hoje')?.addEventListener('click', () => {
        // ➕ ALTERAÇÃO AQUI 👇
        const hoje = new Date();
        // Ajusta para o fuso horário local antes de pegar a data
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        const dataHojeFormatada = hoje.toISOString().split('T')[0];
        buscarFinalizadosPorData(dataHojeFormatada);
    });
    
    document.getElementById('btn-buscar-data')?.addEventListener('click', async () => { 
        const { value: data } = await Swal.fire({ 
            title: 'Selecione uma data', 
            input: 'date', 
            background: '#2c2854', 
            color: '#ffffff', 
            confirmButtonText: 'Buscar', 
            confirmButtonColor: '#ff6b35',
            customClass: {
                input: 'swal2-input-date-fix'
            },
            didOpen: () => {
                const style = document.createElement('style');
                style.innerHTML = `
                    .swal2-input-date-fix::-webkit-calendar-picker-indicator {
                        filter: invert(1) brightness(1.5);
                        cursor: pointer;
                    }
                `;
                document.head.appendChild(style);
            }
        }); 
        if (data) {
            buscarFinalizadosPorData(data); 
        }
    });

    const inputBuscaFinalizados = document.getElementById('filtro-busca-finalizados');
    const btnBuscaFinalizados = document.getElementById('btn-buscar-finalizado-por-codigo');
    if(inputBuscaFinalizados) { inputBuscaFinalizados.addEventListener('keyup', (e) => { if (e.key === 'Enter') { buscarPedidoPorCodigo(); } }); }
    if(btnBuscaFinalizados) { btnBuscaFinalizados.addEventListener('click', buscarPedidoPorCodigo); }

    buscarPedidosAtivos();
}