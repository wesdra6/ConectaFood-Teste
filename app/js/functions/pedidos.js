
import { enviarParaAPI, fetchDeAPI } from './api.js';
import { gerarHtmlImpressao, imprimirComprovante } from './impressao.js';
import { criaCardProduto } from './components.js';
import { API_ENDPOINTS, APP_CONFIG } from '../config.js';

let todosOsPedidosAtivos = [], todosOsProdutosCaixa = [], pedidoEmGerenciamento = null, modalGerenciamento = null, paginaAtual = 1;
let pedidosFinalizadosAtuais = [];
const itensPorPagina = 6;
let filtroAtivo = 'ativos', termoBusca = '', containerAtivos;
let lojaConfig = null;

async function fetchLojaConfigParaImpressao() {
    if (lojaConfig) return;
    try {
        const configs = await fetchDeAPI(API_ENDPOINTS.get_loja_config);
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
        const resultado = await enviarParaAPI(API_ENDPOINTS.add_item_to_order, itemPayload);
        if (resultado.success) {
            const url = `${API_ENDPOINTS.get_order_status}?id=${pedidoEmGerenciamento.id}`;
            const resposta = await fetchDeAPI(url);
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
        const resultado = await enviarParaAPI(API_ENDPOINTS.remove_item_from_order, { item_id: itemId });
        if (resultado.success) {
            const url = `${API_ENDPOINTS.get_order_status}?id=${pedidoEmGerenciamento.id}`;
            const resposta = await fetchDeAPI(url);
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
        const url = `${API_ENDPOINTS.get_order_status}?id=${pedidoId}`;
        const resposta = await fetchDeAPI(url);
        const pedidoAtualizado = (Array.isArray(resposta) && resposta.length > 0) ? resposta[0] : null;
        if (!pedidoAtualizado) throw new Error("Pedido não encontrado.");

        if (todosOsProdutosCaixa.length === 0) {
            todosOsProdutosCaixa = await fetchDeAPI(API_ENDPOINTS.get_all_products_with_type);
        }
        
        pedidoEmGerenciamento = JSON.parse(JSON.stringify(pedidoAtualizado));
        pedidoEmGerenciamento.contexto = contexto;
        if (!pedidoEmGerenciamento.itens_pedido) pedidoEmGerenciamento.itens_pedido = [];

        document.getElementById('gerenciamento-modal-titulo').innerHTML = `Gerenciar Pedido <span class="text-principal">#${pedidoEmGerenciamento.id_pedido_publico}</span>`;
        
        // ✅ LÓGICA DA BUSCA É ADICIONADA AQUI DENTRO 👇
        const inputBusca = document.getElementById('gerenciamento-busca-produto');
        if (inputBusca) {
            inputBusca.value = ''; // Limpa a busca anterior
            // Remove listener antigo para evitar duplicação
            inputBusca.onkeyup = null; 
            inputBusca.onkeyup = (e) => {
                const termo = e.target.value.toLowerCase();
                const produtosFiltrados = !termo 
                    ? todosOsProdutosCaixa 
                    : todosOsProdutosCaixa.filter(p => p.nome.toLowerCase().includes(termo));
                renderizarCardapioGerenciamento(produtosFiltrados);
            };
        }

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

async function extrairListaDePedidos(respostaDoAPI) { if (Array.isArray(respostaDoAPI)) { return respostaDoAPI; } if (typeof respostaDoAPI === 'object' && respostaDoAPI !== null && Array.isArray(respostaDoAPI.data)) { return respostaDoAPI.data; } return []; }

export async function buscarPedidosAtivos() { 
    try { 
        const respostaDoAPI = await fetchDeAPI(API_ENDPOINTS.get_all_orders); 
        todosOsPedidosAtivos = await extrairListaDePedidos(respostaDoAPI); 
        renderizarPedidosAtivos(); 
    } catch (e) { 
        console.error(`Falha ao buscar pedidos ativos:`, e); 
        if(containerAtivos) containerAtivos.innerHTML = `<p class="text-red-400">Ops! A comunicação com a cozinha falhou.</p>`; 
    } 
}

async function solicitarDadosEntregador(pedido) {
    const { value: telefone } = await Swal.fire({ title: 'Despachar Pedido', html: `Despachando pedido <strong>#${pedido.id_pedido_publico}</strong>.<br>Digite o WhatsApp do entregador no formato internacional.`, input: 'tel', inputPlaceholder: 'Ex: 5562912345678', inputAttributes: { oninput: "this.value = this.value.replace(/[^0-9]/g, '')" }, showCancelButton: true, confirmButtonText: 'Enviar & Despachar →', background: '#2c2854', color: '#ffffff', inputValidator: (value) => { if (!value) { return 'Você precisa digitar um número!'; } if (!/^55[1-9]{2}9?[0-9]{8}$/.test(value)) { return 'Formato inválido! Use 55 + DDD + Número.'; } } });
    if (telefone) { Swal.fire({ title: 'Despachando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() }); try { await enviarParaAPI(API_ENDPOINTS.send_delivery_details, { whatsapp_entregador: telefone, pedido: pedido }); await enviarParaAPI(API_ENDPOINTS.update_order_status, { id: pedido.id, status: 'A_CAMINHO' }); dispararNotificacaoStatus(pedido, 'A_CAMINHO'); await buscarPedidosAtivos(); Swal.fire('Despachado!', 'O entregador foi notificado e o status foi atualizado.', 'success'); } catch (error) { console.error("Erro na cadeia de despacho:", error); Swal.fire('Erro!', 'Não foi possível completar o despacho.', 'error'); } }
}

function dispararNotificacaoStatus(pedido, status) {
    const isWhatsAppValido = pedido.whatsapp_cliente && pedido.whatsapp_cliente !== 'PED-INTERNO';
    const statusRelevantes = ['EM_PREPARO', 'PRONTO_PARA_ENTREGA', 'A_CAMINHO'];
    if (!isWhatsAppValido || !statusRelevantes.includes(status)) { return; }
    const payload = { whatsapp_cliente: pedido.whatsapp_cliente, nome_cliente: pedido.nome_cliente, id_pedido_publico: pedido.id_pedido_publico, status: status };
    enviarParaAPI(API_ENDPOINTS.send_whatsapp_status, payload).catch(err => console.error("Falha ao notificar cliente via WhatsApp:", err));
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
            await enviarParaAPI(API_ENDPOINTS.cancel_order, {
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
        await enviarParaAPI(API_ENDPOINTS.update_order_status, { id: pedidoId, status: novoStatus }); 
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
        case 'BALCAO': statusFlow = APP_CONFIG.statusFlowBalcao; break;
        case 'MESA': statusFlow = APP_CONFIG.statusFlowMesa; break;
        default: statusFlow = APP_CONFIG.statusFlowPadrao; break;
    }

    const flowOrder = APP_CONFIG.flowOrder;
    const indiceStatusAtual = flowOrder.indexOf(statusAtualPedido);

    statusFlow.forEach(step => {
        const indiceStep = flowOrder.indexOf(step.requiredStatus);
        const isEtapaAtiva = indiceStep === indiceStatusAtual;
        
        const dataAttributes = `data-action="${step.nextStatus || (step.isPrintOnly ? 'print' : 'finalize')}" data-pedido-id="${pedido.id}"`;

        // ✅ A MÁGICA ESTÁ AQUI: `flex-1` força todos os botões a terem a mesma largura
        let btnClass, icone = '', textoBotao = step.text, title, disabled = false;

        if (isEtapaAtiva) {
            title = 'Clique para executar esta ação';
            btnClass = step.isFinalAction 
                ? `w-full py-3 px-1 text-sm rounded-md font-bold text-white uppercase bg-green-600 hover:bg-green-700` 
                : `flex-1 py-2 px-1 text-xs rounded-md font-semibold text-white uppercase bg-principal hover:opacity-80`;
        } else if (indiceStep < indiceStatusAtual) {
            btnClass = `flex-1 py-2 px-1 text-xs rounded-md font-semibold text-white uppercase bg-green-600 cursor-default`;
            icone = `<i class="bi bi-check-lg mr-1"></i>`;
            textoBotao = step.textCompleted || step.text;
            title = 'Etapa já concluída';
            disabled = true;
        } else {
            btnClass = `flex-1 py-2 px-1 text-xs rounded-md font-semibold text-white uppercase bg-gray-500/50 cursor-not-allowed opacity-60`;
            icone = `<i class="bi bi-slash-circle mr-1"></i>`;
            title = 'Aguardando etapa anterior';
            disabled = true;
        }

        // Adiciona a classe de texto em uma nova linha para melhor legibilidade
        btnClass += ' transition-all';

        container.innerHTML += `<button class="${btnClass}" ${dataAttributes} title="${title}" ${disabled ? 'disabled' : ''}>${icone}${textoBotao}</button>`;
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

    const piscinas = {
        'NOVOS': {
            titulo: 'Novos Pedidos',
            status: ['CONFIRMADO'],
            pedidos: [],
            cor: 'bg-blue-500' 
        },
        'PREPARANDO': {
            titulo: 'Em Preparo',
            status: ['EM_PREPARO'],
            pedidos: [],
            cor: 'bg-yellow-500'
        },
        'PRONTOS': {
            titulo: 'Prontos para Retirada',
            status: ['PRONTO_PARA_ENTREGA'],
            pedidos: [],
            cor: 'bg-purple-500'
        },
        'AGUARDANDO_PAGAMENTO': {
            titulo: 'Aguardando Pagamento',
            status: ['A_CAMINHO'], 
            pedidos: [],
            cor: 'bg-green-500'
        }
    };

    pedidosFiltrados.forEach(pedido => {
        const status = (pedido.status || '').toUpperCase();

        if (piscinas.NOVOS.status.includes(status)) {
            piscinas.NOVOS.pedidos.push(pedido);
        } else if (piscinas.PREPARANDO.status.includes(status)) {
            piscinas.PREPARANDO.pedidos.push(pedido);
        } else if (status === 'PRONTO_PARA_ENTREGA') {
            if(pedido.origem === 'MESA' || pedido.origem === 'BALCAO') {
                piscinas.AGUARDANDO_PAGAMENTO.pedidos.push(pedido); 
            } else {
                piscinas.PRONTOS.pedidos.push(pedido); 
            }
        } else if (piscinas.AGUARDANDO_PAGAMENTO.status.includes(status)) {
            piscinas.AGUARDANDO_PAGAMENTO.pedidos.push(pedido);
        }
    });

    containerAtivos.innerHTML = '';
    const pagContainer = document.getElementById('paginacao-container');
    if (pagContainer) pagContainer.innerHTML = ''; 
    containerAtivos.className = 'space-y-6'; 

    if (pedidosFiltrados.length === 0) {
        containerAtivos.innerHTML = `<p class="text-texto-muted col-span-full text-center py-10">Nenhum pedido ativo encontrado com este filtro. ✨</p>`;
        return;
    }

    for (const key in piscinas) {
        const piscina = piscinas[key];
        if (piscina.pedidos.length === 0) continue; 

        piscina.pedidos.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        const cardsHtml = piscina.pedidos.map(pedido => {
            const card = document.createElement('div');
            const itensHtml = (Array.isArray(pedido.itens_pedido) ? pedido.itens_pedido : []).map(item => `<div><span class="font-semibold text-principal">${item.quantidade || '??'}x</span> ${item.item || 'Item desconhecido'}</div>`).join('') || '<div class="text-red-400 font-semibold">Nenhum item neste pedido.</div>';
            const corOrigem = APP_CONFIG.origemCores[pedido.origem] || 'bg-gray-500';
            const horaEntrada = pedido.created_at ? new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
            
            card.className = "swiper-slide !w-[380px] !h-auto"; 
            card.innerHTML = `
                <div class="bg-card rounded-lg p-4 relative flex flex-col h-full">
                    <div class="absolute top-0 left-0 h-full w-2 ${corOrigem}"></div>
                    <div class="pl-4 flex flex-col flex-grow">
                        <div class="flex justify-between items-start gap-2">
                            <div class="flex-grow min-w-0">
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="px-2 py-1 text-xs semi-bold rounded-full text-white ${corOrigem} flex-shrink-0">${pedido.origem}</span>
                                    <h4 class="semi-bold text-lg leading-tight truncate">${(pedido.nome_cliente || 'Cliente Indefinido').toUpperCase()}</h4>
                                </div>
                                <span class="text-sm text-texto-muted">#${pedido.id_pedido_publico || ''}</span>
                            </div>
                            <div class="flex items-center gap-2 flex-shrink-0">
                                <span class="font-bold text-xl text-principal">R$ ${Number(pedido.total || 0).toFixed(2)}</span>
                                <button onclick="window.pedidosGlobal.abrirGerenciamento(${pedido.id})" class="p-2 rounded-md hover:bg-sidebar transition-colors"><i class="bi bi-gear-fill text-lg text-blue-400"></i></button>
                            </div>
                        </div>
                        <div class="text-lg semi-bold text-principal mb-2"><i class="bi bi-clock-fill"></i> Chegou às: ${horaEntrada}</div>
                        <div class="my-2 border-t border-borda"></div>
                        <div class="space-y-1 mb-3 text-sm flex-grow">${itensHtml}</div>
                        <div class="text-xs space-y-1 mt-auto pt-2 pl-4">
                            ${pedido.forma_pagamento ? `<div class="text-sm font-semibold text-principal mb-2"><i class="bi bi-credit-card-fill"></i> Pagamento: ${pedido.forma_pagamento}</div>` : ''}
                            ${(pedido.origem !== 'BALCAO' && pedido.origem !== 'MESA' && pedido.rua) ? `<p class="text-texto-muted text-xs"><i class="bi bi-geo-alt-fill"></i> ${pedido.bairro ? `${pedido.bairro} - ` : ''}${pedido.rua || ''}, Q ${pedido.quadra || ''}, L ${pedido.lote || ''}</p>` : ''}
                            ${(pedido.whatsapp_cliente && pedido.whatsapp_cliente !== 'PED-INTERNO') ? `<p class="text-texto-muted text-xs"><i class="bi bi-whatsapp"></i> ${pedido.whatsapp_cliente}</p>` : ''}
                            ${(pedido.origem === 'MESA' && pedido.garcom_responsavel) ? `<p class="text-texto-muted text-base"><i class="bi bi-person-fill"></i> Garçom: ${pedido.garcom_responsavel}</p>` : ''}
                            ${pedido.observacoes ? `<div class="mt-2 pt-2 border-t border-borda/30"><p class="text-yellow-400 font-semibold text-sm flex items-center gap-2"><i class="bi bi-chat-left-dots-fill"></i><span>Observação:</span></p><p class="text-texto-muted text-sm pl-2 italic">"${pedido.observacoes}"</p></div>` : ''}
                        </div>
                    </div>
                </div>
            `;
            const botoesContainer = gerarBotoesDeAcao(pedido); 
            card.querySelector('.bg-card .pl-4').appendChild(botoesContainer);
            return card.outerHTML;
        }).join('');

        // ✅ REFINAMENTO FINAL DO TÍTULO
        const piscinaHtml = `
            <div>
                <div class="p-3 rounded-t-lg ${piscina.cor} flex items-center justify-between">
                    <h2 class="text-xl font-bold text-black">${piscina.titulo}</h2>
                    <span class="bg-black/20 text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full">${piscina.pedidos.length}</span>
                </div>
                <div class="swiper swiper-pedidos bg-card/50 p-2 rounded-b-lg">
                    <div class="swiper-wrapper py-2">
                        ${cardsHtml}
                    </div>
                </div>
            </div>
        `;
        containerAtivos.innerHTML += piscinaHtml;
    }

    new Swiper('.swiper-pedidos', {
        slidesPerView: 'auto',
        spaceBetween: 16,
        freeMode: true,
    });
    
    window.pedidosGlobal = {
        atualizarStatus: atualizarStatusPedido,
        abrirGerenciamento: abrirModalGerenciamentoNaView,
        imprimirNota: imprimirNotaParaEntrega
    };
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
    Swal.close(); 
    await new Promise(resolve => setTimeout(resolve, 200));

    if (!pedidos || pedidos.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Nenhum Pedido',
            text: `A busca por ${titulo.toLowerCase()} não retornou resultados.`,
            background: '#2c2854',
            color: '#ffffff'
        });
        return;
    }

    pedidosFinalizadosAtuais = pedidos;
    const container = document.createElement('div');
    container.className = 'text-left max-h-96 overflow-y-auto';
    const table = document.createElement('table');
    table.className = 'w-full';
    table.style.borderCollapse = 'collapse';
    const headerStyle = `padding: 12px; text-align: left; color: #ff6b35; font-weight: 600; border-bottom: 2px solid #4a4480;`;
    table.innerHTML = `<thead><tr><th style="${headerStyle}">Cód.</th><th style="${headerStyle}">Cliente</th><th style="${headerStyle}">Origem</th><th style="${headerStyle}" class="text-right">Total</th></tr></thead>`;
    const tableBody = document.createElement('tbody');
    const cellStyle = `padding: 10px; border-top: 1px solid #4a4480;`;

    pedidos.forEach(p => {
        // ✅ CORREÇÃO AQUI: Usando a classe do config.js diretamente
        const corClasse = APP_CONFIG.origemCores[p.origem] || 'bg-gray-500';
        // A classe já vem pronta, ex: "bg-blue-500". Adicionamos opacidade e removemos o "bg-" para a cor do texto.
        const corTexto = corClasse.replace('bg-', 'text-')
                                  .replace('500', '300'); // Deixamos o texto um pouco mais claro

        const origemTag = `<span class="${corClasse} bg-opacity-20 ${corTexto}" style="font-size: 0.75rem; font-weight: bold; padding: 4px 8px; border-radius: 9999px;">${p.origem}</span>`;
        
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

    Swal.fire({
        title: titulo,
        html: container,
        width: '800px',
        background: '#2c2854',
        color: '#ffffff',
        confirmButtonText: 'Fechar',
        confirmButtonColor: '#ff6b35'
    });
}

async function buscarFinalizadosPorData(data) {
    Swal.fire({
        title: 'Buscando Histórico...',
        allowOutsideClick: false,
        background: '#2c2854',
        color: '#ffffff',
        didOpen: () => Swal.showLoading()
    });

    try {
        const url = `${API_ENDPOINTS.get_finalized_orders_by_date}?data=${data}`;
        const pedidos = await fetchDeAPI(url);
        
        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        const dataHojeFormatada = hoje.toISOString().split('T')[0];
        const titulo = data === dataHojeFormatada ? 'Pedidos Finalizados de Hoje' : `Pedidos de ${new Date(data + 'T03:00:00Z').toLocaleDateString('pt-BR')}`;
        
        // Passa a responsabilidade de fechar o loading e mostrar o resultado para a próxima função
        renderizarListaFinalizados(pedidos, titulo);

    } catch (error) {
        console.error("Erro ao buscar pedidos por data:", error);
        // Garante que o loading feche mesmo em caso de erro de rede
        Swal.fire({
            icon: 'error',
            title: 'Ops!',
            text: 'Não foi possível buscar o histórico de pedidos.',
            background: '#2c2854',
            color: '#ffffff'
        });
    }
}

async function buscarPedidoPorCodigo() { 
    const input = document.getElementById('filtro-busca-finalizados'); 
    const termo = input.value.trim().toUpperCase(); 
    if (!termo) return; 
    Swal.fire({ title: 'Buscando...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#2c2854', color: '#ffffff'}); 
    try { 
        const url = `${API_ENDPOINTS.get_finalized_order_by_code}?id=${termo}`; 
        const resposta = await fetchDeAPI(url); 
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
        window.addEventListener('novoPedidoRecebido', (event) => {
            const tipoDeAlerta = event.detail.tipo;
            
            if (tipoDeAlerta === 'external') {
                const sound = document.getElementById('notification-sound');
                if(sound) sound.play().catch(e => console.error("Erro ao tocar som:", e));
                Swal.fire({
                    toast: true, position: 'top-end', icon: 'info', title: 'Novo pedido na área!',
                    showConfirmButton: false, timer: 4000, background: '#38326b', color: '#ffffff'
                });
            }

            const pedidosPage = document.getElementById('pedidos-page');
            if (pedidosPage && !pedidosPage.classList.contains('hidden')) {
                buscarPedidosAtivos();
            }
        });

        // ✅ O SUPER LISTENER ENTRA EM AÇÃO AQUI 👇
        containerAtivos.addEventListener('click', (event) => {
            const target = event.target.closest('button[data-action]');
            if (!target) return; // Se não clicou num botão de ação, ignora

            const pedidoId = parseInt(target.dataset.pedidoId);
            const acao = target.dataset.action;
            const pedido = todosOsPedidosAtivos.find(p => p.id === pedidoId);

            if (!pedido) return;

            if (acao === 'print') {
                imprimirNotaParaEntrega(pedido);
            } else if (acao) {
                atualizarStatusPedido(pedidoId, acao);
            }
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
        const hoje = new Date();
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
            confirmButtonColor: '#ff6b35'
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