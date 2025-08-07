// REESCREVA O ARQUIVO COMPLETO: js/functions/pedidos.js

import { enviarParaN8N, fetchDeN8N } from './api.js';
import { gerarHtmlImpressao, imprimirComprovante } from './impressao.js';

const origemCores = { 'DELIVERY': 'bg-blue-500', 'WHATSAPP': 'bg-green-500', 'IFOOD': 'bg-red-500', 'MESA': 'bg-purple-500', 'BALCAO': 'bg-yellow-500' };

const statusFlowPadrao = [ 
    { text: 'ACEITAR', textCompleted: 'ACEITO', nextStatus: 'EM_PREPARO', requiredStatus: 'CONFIRMADO' }, 
    { text: 'EM PREPARO', textCompleted: 'PRONTO', nextStatus: 'PRONTO_PARA_ENTREGA',  requiredStatus: 'EM_PREPARO' }, 
    { text: 'CHAMAR ENTREGADOR', nextStatus: 'A_CAMINHO', requiredStatus: 'PRONTO_PARA_ENTREGA' }, 
    { text: 'IMPRIMIR NOTA', isPrintOnly: true, requiredStatus: 'A_CAMINHO' },
    { text: 'FINALIZAR', isFinalAction: true, nextStatus: 'ENTREGUE', requiredStatus: 'A_CAMINHO' }
];
const statusFlowBalcao = [ 
    { text: 'ACEITAR', textCompleted: 'ACEITO', nextStatus: 'EM_PREPARO', requiredStatus: 'CONFIRMADO' },
    { text: 'EM PREPARO', textCompleted: 'PRONTO', nextStatus: 'PRONTO_PARA_ENTREGA', requiredStatus: 'EM_PREPARO' }
];
const statusFlowMesa = [ 
    { text: 'ACEITAR', textCompleted: 'ACEITO', nextStatus: 'EM_PREPARO', requiredStatus: 'CONFIRMADO' }, 
    { text: 'PRONTO P/ SERVIR', textCompleted: 'SERVIDO', nextStatus: 'PRONTO_PARA_ENTREGA', requiredStatus: 'EM_PREPARO' }
];
const flowOrder = ['CONFIRMADO', 'EM_PREPARO', 'PRONTO_PARA_ENTREGA', 'A_CAMINHO', 'ENTREGUE', 'CANCELADO'];

let todosOsPedidosAtivos = [], todosOsProdutosCaixa = [], pedidoEmGerenciamento = null, modalGerenciamento = null, paginaAtual = 1;
let pedidosFinalizadosAtuais = [];
const itensPorPagina = 6;
let filtroAtivo = 'ativos', termoBusca = '', containerAtivos, isPedidosInitialized = false;
let lojaConfig = null;
let contextoAtualDoModal = 'CAIXA'; 

function notificarAlteracaoDePedido() {
    window.dispatchEvent(new CustomEvent('pedidoAlterado'));
}

async function fetchLojaConfigParaImpressao() {
    if (lojaConfig) return;
    try {
        const configs = await fetchDeN8N(window.N8N_CONFIG.get_loja_config);
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
    if (produto.id === 99999) {
        Swal.fire({icon: 'info', title: 'Ação não permitida', text: 'A taxa de entrega principal é adicionada automaticamente.', background: '#2c2854', color: '#ffffff'});
        return;
    }
    const itemPayload = {
        pedido_id: pedidoEmGerenciamento.id,
        produto_id: produto.id,
        quantidade: 1,
        preco_unitario: produto.preco
    };
    try {
        const resultado = await enviarParaN8N(window.N8N_CONFIG.add_item_to_order, itemPayload);
        if (resultado.success && resultado.novo_item_id) {
            const novoItem = { 
                ...itemPayload, 
                id: resultado.novo_item_id, 
                item: produto.nome,
                tipo_item: produto.tipo_item
            };
            pedidoEmGerenciamento.itens_pedido.push(novoItem);
            renderizarComandaGerenciamento(); 
            await buscarPedidosAtivos(); 
            notificarAlteracaoDePedido();
        } else {
            throw new Error(resultado.message || 'Erro ao adicionar item.');
        }
    } catch (error) {
        console.error("Erro ao adicionar item ao pedido:", error);
        Swal.fire('Ops!', 'Não foi possível adicionar o item.', 'error');
    }
}

export async function removerItemDoPedido(itemId) {
    if (!pedidoEmGerenciamento || !itemId) return;
    const itemParaRemover = pedidoEmGerenciamento.itens_pedido.find(i => i.id === itemId);
    if (itemParaRemover && itemParaRemover.produto_id === 99999) {
        Swal.fire({icon: 'warning', title: 'Ação Bloqueada', text: 'A taxa de entrega original não pode ser removida.', background: '#2c2854', color: '#ffffff'});
        return;
    }
    try {
        const resultado = await enviarParaN8N(window.N8N_CONFIG.remove_item_from_order, { item_id: itemId });
        if (resultado.success) {
            const itemIndexGerenciamento = pedidoEmGerenciamento.itens_pedido.findIndex(i => i.id === itemId);
            if (itemIndexGerenciamento > -1) {
                pedidoEmGerenciamento.itens_pedido.splice(itemIndexGerenciamento, 1);
            }
            renderizarComandaGerenciamento();
            await buscarPedidosAtivos();
            notificarAlteracaoDePedido();
        } else {
            throw new Error(resultado.message || 'Erro ao remover o item.');
        }
    } catch (error) {
        console.error("Erro ao remover item do pedido:", error);
        Swal.fire('Ops!', 'Não foi possível remover o item.', 'error');
    }
}

export async function abrirModalGerenciamento(pedido, contexto = 'CAIXA') {
    if (!pedido || !pedido.id) { console.error("abrirModalGerenciamento chamada sem pedido válido."); return; }
    if (todosOsProdutosCaixa.length === 0) {
        try {
            todosOsProdutosCaixa = await fetchDeN8N(window.N8N_CONFIG.get_all_products_with_type);
        } catch (e) { Swal.fire('Ops!', 'Não foi possível carregar o cardápio para adicionar novos itens.', 'error'); return; }
    }
    
    contextoAtualDoModal = contexto;

    pedidoEmGerenciamento = JSON.parse(JSON.stringify(pedido));
    if (!pedidoEmGerenciamento.itens_pedido) pedidoEmGerenciamento.itens_pedido = [];

    document.getElementById('gerenciamento-modal-titulo').innerHTML = `Gerenciar Pedido <span class="text-principal">#${pedido.id_pedido_publico}</span>`;
    
    const btnCancelar = document.getElementById('btn-cancelar-pedido');
    const btnImprimir = document.getElementById('btn-imprimir-preconta');

    if (contexto === 'GARCOM') {
        if(btnCancelar) btnCancelar.classList.add('hidden');
        if(btnImprimir) btnImprimir.classList.remove('hidden');
        if(btnImprimir) btnImprimir.onclick = () => imprimirNotaParaEntrega(pedidoEmGerenciamento);
    } else { 
        if(btnCancelar) btnCancelar.classList.remove('hidden');
        if(btnImprimir) btnImprimir.classList.add('hidden');
        if(btnCancelar) btnCancelar.onclick = cancelarPedido;
    }
    
    renderizarCardapioGerenciamento();
    renderizarComandaGerenciamento();
    
    const inputBusca = document.getElementById('gerenciamento-busca-produto');
    if (inputBusca) {
        inputBusca.addEventListener('keyup', () => {
            const termo = inputBusca.value.toLowerCase();
            const produtosFiltrados = !termo ? todosOsProdutosCaixa : todosOsProdutosCaixa.filter(p => p.nome.toLowerCase().includes(termo));
            renderizarCardapioGerenciamento(produtosFiltrados);
        });
    }

    const modalId = contexto === 'GARCOM' ? 'modal-gerenciamento-pedido' : 'modal-gerenciamento-pedido';
    if (!modalGerenciamento) {
        const modalEl = document.getElementById(modalId);
        if (modalEl) modalGerenciamento = new bootstrap.Modal(modalEl);
    }
    if(modalGerenciamento) modalGerenciamento.show();
}

async function extrairListaDePedidos(respostaDoN8N) { if (Array.isArray(respostaDoN8N)) { return respostaDoN8N; } if (typeof respostaDoN8N === 'object' && respostaDoN8N !== null && Array.isArray(respostaDoN8N.data)) { return respostaDoN8N.data; } return []; }

async function buscarPedidosAtivos() { 
    try { 
        const respostaDoN8N = await fetchDeN8N(window.N8N_CONFIG.get_all_orders); 
        todosOsPedidosAtivos = await extrairListaDePedidos(respostaDoN8N); 
        renderizarPedidosAtivos(); 
    } catch (e) { 
        console.error(`Falha ao buscar pedidos ativos:`, e); 
        if(containerAtivos) containerAtivos.innerHTML = `<p class="text-red-400">Ops! A comunicação com a cozinha falhou.</p>`; 
    } 
}
async function solicitarDadosEntregador(pedido) {
    const { value: telefone } = await Swal.fire({ title: 'Despachar Pedido', html: `Despachando pedido <strong>#${pedido.id_pedido_publico}</strong>.<br>Digite o WhatsApp do entregador no formato internacional.`, input: 'tel', inputPlaceholder: 'Ex: 5562912345678', inputAttributes: { oninput: "this.value = this.value.replace(/[^0-9]/g, '')" }, showCancelButton: true, confirmButtonText: 'Enviar & Despachar →', background: '#2c2854', color: '#ffffff', inputValidator: (value) => { if (!value) { return 'Você precisa digitar um número!'; } if (!/^55[1-9]{2}9?[0-9]{8}$/.test(value)) { return 'Formato inválido! Use 55 + DDD + Número.'; } } });
    if (telefone) { Swal.fire({ title: 'Despachando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() }); try { await enviarParaN8N(window.N8N_CONFIG.send_delivery_details, { whatsapp_entregador: telefone, pedido: pedido }); await enviarParaN8N(window.N8N_CONFIG.update_order_status, { id: pedido.id, status: 'A_CAMINHO' }); dispararNotificacaoStatus(pedido, 'A_CAMINHO'); await buscarPedidosAtivos(); Swal.fire('Despachado!', 'O entregador foi notificado e o status foi atualizado.', 'success'); } catch (error) { console.error("Erro na cadeia de despacho:", error); Swal.fire('Erro!', 'Não foi possível completar o despacho.', 'error'); } }
}
function dispararNotificacaoStatus(pedido, status) {
    const isWhatsAppValido = pedido.whatsapp_cliente && pedido.whatsapp_cliente !== 'PED-INTERNO';
    const statusRelevantes = ['EM_PREPARO', 'PRONTO_PARA_ENTREGA', 'A_CAMINHO'];
    if (!isWhatsAppValido || !statusRelevantes.includes(status)) { return; }
    const payload = { whatsapp_cliente: pedido.whatsapp_cliente, nome_cliente: pedido.nome_cliente, id_pedido_publico: pedido.id_pedido_publico, status: status };
    enviarParaN8N(window.N8N_CONFIG.send_whatsapp_status, payload).catch(err => console.error("Falha ao notificar cliente via WhatsApp:", err));
}
async function cancelarPedido() { if (!pedidoEmGerenciamento) return; const result = await Swal.fire({ title: 'Tem certeza?', text: `Deseja cancelar o pedido #${pedidoEmGerenciamento.id_pedido_publico}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sim, cancelar!', cancelButtonText: 'Não', background: '#2c2854', color: '#ffffff' }); if (result.isConfirmed) { Swal.fire({ title: 'Cancelando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() }); try { await enviarParaN8N(window.N8N_CONFIG.cancel_order, { pedido_id: pedidoEmGerenciamento.id, id_mesa: pedidoEmGerenciamento.id_mesa || null }); Swal.fire('Cancelado!', 'O pedido foi cancelado com sucesso.', 'success'); if (modalGerenciamento) modalGerenciamento.hide(); await buscarPedidosAtivos(); notificarAlteracaoDePedido();} catch (error) { console.error("Erro ao cancelar pedido:", error); Swal.fire('Ops!', 'Não foi possível cancelar o pedido.', 'error'); } } }
function mudarPagina(pg) { paginaAtual = pg; renderizarPedidosAtivos(); }
function iniciarCheckout(pedidoId, tipoCheckout) { const pedido = todosOsPedidosAtivos.find(p => p.id === pedidoId); if (!pedido) return; if (window.caixaGlobal && typeof window.caixaGlobal.abrirModalParaFechamento === 'function') { window.caixaGlobal.abrirModalParaFechamento(tipoCheckout, pedido); } else { console.error("Função de checkout do caixa não está disponível!"); } }
async function atualizarStatusPedido(pedidoId, novoStatus) {
    const pedido = todosOsPedidosAtivos.find(p => p.id === pedidoId);
    if (!pedido) return;
    if (novoStatus === 'A_CAMINHO' && pedido.origem !== 'BALCAO' && pedido.origem !== 'MESA') { solicitarDadosEntregador(pedido); return; }
    try { Swal.fire({ title: 'Atualizando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() }); await enviarParaN8N(window.N8N_CONFIG.update_order_status, { id: pedidoId, status: novoStatus }); dispararNotificacaoStatus(pedido, novoStatus); await buscarPedidosAtivos(); Swal.close(); } catch (error) { console.error("Erro ao atualizar status:", error); Swal.fire('Ops!', 'Não foi possível atualizar o status.', 'error'); }
}
function abrirModalGerenciamentoNaView(pedidoId) { const pedido = todosOsPedidosAtivos.find(p => p.id === pedidoId); if (pedido) abrirModalGerenciamento(pedido); }

function renderizarCardapioGerenciamento(produtos = todosOsProdutosCaixa) {
    const listaProdutos = document.getElementById('gerenciamento-lista-produtos');
    const colunaAdicionarItens = document.getElementById('coluna-adicionar-itens'); 

    if (colunaAdicionarItens) {
        colunaAdicionarItens.classList.remove('hidden');
    }

    if (!listaProdutos) return;
    
    listaProdutos.innerHTML = '';
    
    let produtosParaExibir = produtos.filter(p => p.nome !== 'Taxa de Serviço (10%)');
    
    if (pedidoEmGerenciamento && (pedidoEmGerenciamento.origem === 'DELIVERY' || pedidoEmGerenciamento.origem === 'WHATSAPP')) {
        produtosParaExibir = produtosParaExibir.filter(p => p.tipo_item === 'PRODUTO' || p.nome === 'Taxa de Entrega Adicional');
    }

    const produtosPorCategoria = produtosParaExibir.reduce((acc, produto) => { 
        const cat = produto.nome_categoria || 'Outros'; 
        if (!acc[cat]) acc[cat] = []; 
        acc[cat].push(produto); 
        return acc; 
    }, {});

    const categoriasOrdenadas = Object.keys(produtosPorCategoria).sort();
    
    for (const categoria of categoriasOrdenadas) {
        const h3 = document.createElement('h3');
        h3.className = "text-lg font-bold text-principal border-b-2 border-principal/50 mb-3 mt-4 first:mt-0";
        h3.innerText = categoria;
        listaProdutos.appendChild(h3);

        produtosPorCategoria[categoria].forEach(produto => {
            const isServico = produto.tipo_item !== 'PRODUTO';
            
            let imagemHtml;
            if (produto.imagens_urls && produto.imagens_urls.length > 0) {
                imagemHtml = `<img src="${produto.imagens_urls[0]}" alt="${produto.nome}" class="w-16 h-16 object-cover rounded-md flex-shrink-0">`;
            } else if (isServico) {
                imagemHtml = `<div class="w-16 h-16 flex items-center justify-center bg-fundo rounded-md flex-shrink-0"><i class="bi bi-gear-wide-connected text-3xl text-principal"></i></div>`;
            } else {
                imagemHtml = `<img src="https://via.placeholder.com/150" alt="${produto.nome}" class="w-16 h-16 object-cover rounded-md flex-shrink-0">`;
            }

            const itemProduto = document.createElement('div');
            itemProduto.className = "bg-card p-2 rounded-lg flex items-center gap-4 cursor-pointer hover:bg-fundo mb-2";
            itemProduto.innerHTML = `${imagemHtml}<div class="flex-grow min-w-0"><p class="font-bold truncate">${produto.nome}</p><span class="text-principal font-semibold">R$ ${Number(produto.preco).toFixed(2)}</span></div><button class="bg-principal text-white w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-2xl">+</button>`;
            itemProduto.querySelector('button').onclick = () => adicionarItemAoPedido(produto.id);
            listaProdutos.appendChild(itemProduto);
        });
    }
}

function renderizarComandaGerenciamento() {
    const comandaContainer = document.getElementById('gerenciamento-comanda-itens');
    const totalEl = document.getElementById('gerenciamento-comanda-total');
    if (!comandaContainer || !totalEl || !pedidoEmGerenciamento) return;
    comandaContainer.innerHTML = '';
    let totalPedido = 0;
    (pedidoEmGerenciamento.itens_pedido || []).forEach(item => {
        const nomeProduto = item.item || item.nome;
        if (!nomeProduto) return;
        const preco = Number(item.preco_unitario || item.preco || 0);
        const subtotal = item.quantidade * preco;
        totalPedido += subtotal;
        
        const itemHtml = document.createElement('div');
        itemHtml.className = "flex justify-between items-center text-sm mb-2 p-2 rounded-md bg-fundo";

        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = `<span class="font-bold">${item.quantidade}x</span> ${nomeProduto}`;
        
        const actionDiv = document.createElement('div');
        actionDiv.className = "flex items-center gap-4";
        
        const subtotalSpan = document.createElement('span');
        subtotalSpan.className = "font-semibold text-principal w-24 text-right";
        subtotalSpan.textContent = `R$ ${subtotal.toFixed(2)}`;
        
        const removeButton = document.createElement('button');
        const isTaxaFixa = item.produto_id === 99999;

        if(isTaxaFixa || contextoAtualDoModal === 'GARCOM') {
            removeButton.className = "text-gray-500 cursor-not-allowed";
            removeButton.title = contextoAtualDoModal === 'GARCOM' ? "A remoção de itens é permitida apenas no Caixa." : "A taxa de entrega não pode ser removida.";
            removeButton.innerHTML = `<i class="bi bi-trash-fill text-lg"></i>`;
        } else {
            removeButton.className = "text-red-500 hover:text-red-400";
            removeButton.innerHTML = `<i class="bi bi-trash-fill text-lg"></i>`;
            removeButton.addEventListener('click', () => removerItemDoPedido(item.id));
        }

        actionDiv.appendChild(subtotalSpan);
        actionDiv.appendChild(removeButton);
        itemHtml.appendChild(infoDiv);
        itemHtml.appendChild(actionDiv);
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
        case 'BALCAO': statusFlow = statusFlowBalcao; break; 
        case 'MESA': statusFlow = statusFlowMesa; break; 
        default: statusFlow = statusFlowPadrao; break; 
    } 

    const indiceStatusAtual = flowOrder.indexOf(statusAtualPedido); 
    statusFlow.forEach(step => { 
        const indiceStep = flowOrder.indexOf(step.requiredStatus); 
        const isEtapaAtiva = indiceStep === indiceStatusAtual; 
        const btn = document.createElement('button'); 
        
        let icone = '', textoBotao = step.text;

        if (isEtapaAtiva) {
            btn.title = 'Clique para executar esta ação';
            
            if (step.isCheckout) { 
                btn.onclick = () => iniciarCheckout(pedido.id, step.tipoCheckout); 
            } else if (step.isPrintOnly) {
                btn.onclick = () => imprimirNotaParaEntrega(pedido);
            } else if (step.isFinalAction) {
                btn.onclick = () => atualizarStatusPedido(pedido.id, step.nextStatus);
            } else { 
                btn.onclick = () => atualizarStatusPedido(pedido.id, step.nextStatus); 
            }

            if(step.isFinalAction) {
                btn.className = `w-full py-3 px-1 text-sm rounded-md font-bold text-white transition-all uppercase bg-green-600 hover:bg-green-700`;
            } else {
                btn.className = `flex-grow sm:flex-grow-0 basis-1/${statusFlow.length} py-2 px-1 text-xs rounded-md font-semibold text-white transition-all uppercase bg-principal hover:opacity-80`;
            }

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


function renderizarPaginacao(totalItens) { const pagContainer = document.getElementById('paginacao-container'); if (!pagContainer) return; pagContainer.innerHTML = ''; const totalPaginas = Math.ceil(totalItens / itensPorPagina); if (totalPaginas <= 1) return; for (let i = 1; i <= totalPaginas; i++) { const btn = document.createElement('button'); btn.className = `px-4 py-2 rounded-md font-bold ${i === paginaAtual ? 'bg-principal text-white' : 'bg-card hover:bg-sidebar'}`; btn.innerText = i; btn.onclick = () => mudarPagina(i); pagContainer.appendChild(btn); } }
function renderizarPedidosAtivos() {
    if (!containerAtivos) return;
    const pedidosValidos = todosOsPedidosAtivos.filter(p => p && p.id);
    let pedidosFiltrados = pedidosValidos;
    if (filtroAtivo !== 'ativos') { pedidosFiltrados = pedidosValidos.filter(p => p.origem === filtroAtivo); }
    if (termoBusca) { pedidosFiltrados = pedidosValidos.filter(p => (p.nome_cliente || '').toLowerCase().includes(termoBusca) || (p.id_pedido_publico || '').toLowerCase().includes(termoBusca) || (p.whatsapp_cliente || '').includes(termoBusca)); }
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const pedidosPaginados = pedidosFiltrados.slice(inicio, fim);
    containerAtivos.innerHTML = '';
    if (pedidosPaginados.length === 0) { containerAtivos.innerHTML = `<p class="text-texto-muted col-span-full text-center py-10">Nenhum pedido ativo encontrado com este filtro.</p>`; renderizarPaginacao(0); return; }
    pedidosPaginados.forEach(pedido => {
        const card = document.createElement('div');
        card.className = "bg-card rounded-lg p-4 relative flex flex-col";
        const itensHtml = (Array.isArray(pedido.itens_pedido) ? pedido.itens_pedido : []).map(item => `<div><span class="font-semibold text-principal">${item.quantidade || '??'}x</span> ${item.item || 'Item desconhecido'}</div>`).join('') || '<div class="text-red-400 font-semibold">Nenhum item neste pedido.</div>';
        const corOrigem = origemCores[pedido.origem] || 'bg-gray-500';
        const horaEntrada = pedido.created_at ? new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        const horaEntradaHtml = `<div class="text-lg font-bold text-principal mb-2"><i class="bi bi-clock-fill"></i> Chegou às: ${horaEntrada}</div>`;
        const garcomHtml = (pedido.origem === 'MESA' && pedido.garcom_responsavel) ? `<p class="text-texto-muted text-base"><i class="bi bi-person-fill"></i> Garçom: ${pedido.garcom_responsavel}</p>` : '';
        const pagamentoHtml = pedido.forma_pagamento ? `<div class="text-sm font-semibold text-principal mb-2"><i class="bi bi-credit-card-fill"></i> Pagamento: ${pedido.forma_pagamento}</div>` : '';
        const enderecoHtml = (pedido.origem !== 'BALCAO' && pedido.origem !== 'MESA' && pedido.rua) ? `<p class="text-texto-muted text-xs"><i class="bi bi-geo-alt-fill"></i> ${pedido.bairro ? `${pedido.bairro} - ` : ''}${pedido.rua || ''}, Q ${pedido.quadra || ''}, L ${pedido.lote || ''}</p>` : '';
        const whatsappHtml = (pedido.whatsapp_cliente && pedido.whatsapp_cliente !== 'PED-INTERNO') ? `<p class="text-texto-muted text-xs"><i class="bi bi-whatsapp"></i> ${pedido.whatsapp_cliente}</p>` : '';
        const observacoesHtml = pedido.observacoes ? `<div class="mt-2 pt-2 border-t border-borda/30"><p class="text-yellow-400 font-semibold text-sm flex items-center gap-2"><i class="bi bi-chat-left-dots-fill"></i><span>Observação:</span></p><p class="text-texto-muted text-sm pl-2 italic">"${pedido.observacoes}"</p></div>` : '';
        const botoesAcaoContainer = gerarBotoesDeAcao(pedido);
        card.innerHTML = `<div class="absolute top-0 left-0 h-full w-2 ${corOrigem}"></div><div class="pl-4 flex flex-col flex-grow"><div class="flex justify-between items-start"><div><h4 class="font-bold text-lg">${(pedido.nome_cliente || 'Cliente Indefinido').toUpperCase()}</h4><span class="text-sm text-texto-muted">#${pedido.id_pedido_publico || ''}</span></div><div class="flex items-center gap-2"><span class="font-bold text-xl text-principal">R$ ${Number(pedido.total || 0).toFixed(2)}</span>${(pedido.status !== 'ENTREGUE' && pedido.status !== 'CANCELADO') ? '<button class="btn-gerenciar-pedido p-2 rounded-md hover:bg-sidebar transition-colors"><i class="bi bi-gear-fill text-lg text-blue-400"></i></button>' : ''}</div></div>${horaEntradaHtml}<div class="my-2 border-t border-borda"></div><div class="space-y-1 mb-3 text-sm">${itensHtml}</div><div class="text-xs space-y-1 mt-auto pt-2">${pagamentoHtml}${enderecoHtml}${whatsappHtml}${garcomHtml}${observacoesHtml}</div></div>`;
        card.querySelector('.pl-4').appendChild(botoesAcaoContainer);
        const btnGerenciar = card.querySelector('.btn-gerenciar-pedido');
        if(btnGerenciar) { btnGerenciar.onclick = () => abrirModalGerenciamentoNaView(pedido.id); }
        containerAtivos.appendChild(card);
    });
    renderizarPaginacao(pedidosFiltrados.length);
}
async function mostrarDetalhesPedidoFinalizado(pedido) { if (!pedido || !pedido.id) { Swal.fire({ icon: 'error', title: 'Ops!', text: 'Não foi possível carregar os detalhes do pedido.', background: '#2c2854', color: '#ffffff' }); return; } const labelStyle = `style="color: #ff6b35; font-weight: 600;"`; const itens = pedido.itens_pedido || []; const itensHtml = itens.length > 0 ? itens.map(item => `<div style="padding: 2px 0;"><span ${labelStyle}>${item.quantidade || '?'}x</span> ${item.item || 'Item desconhecido'}</div>`).join('') : 'Nenhum item detalhado encontrado.'; const enderecoHtml = pedido.rua ? `<div class="mt-2"><span ${labelStyle}><i class="bi bi-geo-alt-fill"></i> Endereço:</span> ${pedido.rua}, ${pedido.bairro || ''}</div>` : ''; const pagamentoHtml = pedido.forma_pagamento ? `<div class="mt-2"><span ${labelStyle}><i class="bi bi-credit-card-fill"></i> Pagamento:</span> ${pedido.forma_pagamento}</div>` : ''; const garcomHtml = pedido.garcom_responsavel ? `<div class="mt-2"><span ${labelStyle}><i class="bi bi-person-badge-fill"></i> Garçom:</span> ${pedido.garcom_responsavel}</div>` : ''; Swal.fire({ title: `Detalhes Pedido #${pedido.id_pedido_publico || 'N/A'}`, html: `<div class="text-left text-lg space-y-2"><div><span ${labelStyle}><i class="bi bi-person-fill"></i> Cliente:</span> ${pedido.nome_cliente || 'N/A'}</div><div><span ${labelStyle}><i class="bi bi-cash-coin"></i> Total:</span> R$ ${Number(pedido.total || 0).toFixed(2)}</div>${pagamentoHtml} ${enderecoHtml} ${garcomHtml}<hr class="my-3 border-borda/50"><div class="text-base"><div ${labelStyle} class="mb-2 text-xl">Itens do Pedido:</div>${itensHtml}</div></div>`, background: '#38326b', color: '#ffffff', showCloseButton: true, confirmButtonText: 'Fechar', confirmButtonColor: '#ff6b35' }); }
async function renderizarListaFinalizados(pedidos, titulo) {
    if (!pedidos || pedidos.length === 0) { Swal.fire({ icon: 'info', title: 'Nenhum Pedido', text: `A busca por ${titulo.toLowerCase()} não retornou resultados.`, background: '#2c2854', color: '#ffffff' }); return; }
    pedidosFinalizadosAtuais = pedidos; const container = document.createElement('div'); container.className = 'text-left max-h-96 overflow-y-auto'; const table = document.createElement('table'); table.className = 'w-full'; table.style.borderCollapse = 'collapse'; const headerStyle = `padding: 12px; text-align: left; color: #ff6b35; font-weight: 600; border-bottom: 2px solid #4a4480;`; table.innerHTML = `<thead><tr><th style="${headerStyle}">Cód.</th><th style="${headerStyle}">Cliente</th><th style="${headerStyle}">Origem</th><th style="${headerStyle}" class="text-right">Total</th></tr></thead>`; const tableBody = document.createElement('tbody'); const cellStyle = `padding: 10px; border-top: 1px solid #4a4480;`;
    pedidos.forEach(p => {
        const origemTag = `<span style="background-color: ${origemCores[p.origem]?.replace('bg-', '') || 'gray'}; color: white; font-size: 0.75rem; font-weight: bold; padding: 4px 8px; border-radius: 9999px;">${p.origem}</span>`;
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.innerHTML = `<td style="${cellStyle}" class="font-mono">#${p.id_pedido_publico}</td> <td style="${cellStyle}">${p.nome_cliente}</td> <td style="${cellStyle}">${origemTag}</td> <td style="${cellStyle}" class="font-bold text-right">R$ ${Number(p.total).toFixed(2)}</td>`;
        tr.onmouseover = () => tr.style.backgroundColor = '#38326b';
        tr.onmouseout = () => tr.style.backgroundColor = 'transparent';
        tr.onclick = () => mostrarDetalhesPedidoFinalizado(p);
        tableBody.appendChild(tr);
    });
    table.appendChild(tableBody); container.appendChild(table); Swal.close(); await new Promise(resolve => setTimeout(resolve, 200));
    Swal.fire({ title: titulo, html: container, width: '800px', background: '#2c2854', color: '#ffffff', confirmButtonText: 'Fechar', confirmButtonColor: '#ff6b35' });
}

function getLocalDateString() {
    const data = new Date();
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

async function buscarPedidosDeHoje() {
    Swal.fire({ title: 'Buscando Pedidos de Hoje...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#2c2854', color: '#ffffff' });
    try {
        const hoje = getLocalDateString();
        await buscarFinalizadosPorData(hoje);
    } catch (error) {
        console.error("Erro ao buscar pedidos de hoje:", error);
        Swal.fire('Ops!', 'Não foi possível buscar os pedidos de hoje.', 'error');
    }
}

async function buscarFinalizadosPorData(data) { Swal.fire({ title: 'Buscando Histórico...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#2c2854', color: '#ffffff' }); try { const url = `${window.N8N_CONFIG.get_finalized_orders_by_date}?data=${data}`; const pedidos = await fetchDeN8N(url); const titulo = `Pedidos de ${new Date(data + 'T03:00:00Z').toLocaleDateString('pt-BR')}`; renderizarListaFinalizados(pedidos, titulo); } catch (error) { console.error("Erro ao buscar pedidos por data:", error); Swal.fire('Ops!', 'Não foi possível buscar o histórico de pedidos.', 'error'); } }

async function buscarPedidoPorCodigo() {
    const input = document.getElementById('filtro-busca-finalizados');
    const termo = input.value.trim().toUpperCase();
    if (!termo) return;
    Swal.fire({ title: 'Buscando...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#2c2854', color: '#ffffff'});
    try {
        const url = `${window.N8N_CONFIG.get_finalized_order_by_code}?id=${termo}`;
        const resposta = await fetchDeN8N(url);
        const pedido = (resposta && resposta.length > 0) ? resposta[0] : null;

        Swal.close();
        await new Promise(resolve => setTimeout(resolve, 200)); 
        
        if (pedido) {
            mostrarDetalhesPedidoFinalizado(pedido);
        } else {
            Swal.fire({
                icon: 'info',
                title: 'Não encontrado',
                text: 'Nenhum pedido finalizado com esse código foi encontrado em todo o histórico.',
                background: '#2c2854',
                color: '#ffffff'
            });
        }
    } catch (error) {
        console.error("Erro ao buscar pedido por código:", error);
        Swal.fire('Ops!', 'Não foi possível realizar a busca.', 'error');
    }
}

export async function initPedidosPage() {
    containerAtivos = document.getElementById('lista-pedidos-admin');
    if (!containerAtivos) return;
    
    if (!window.caixaGlobal) { try { await import('./caixa.js'); } catch (error) { console.error('Falha ao pré-carregar o módulo do caixa:', error); } }
    fetchLojaConfigParaImpressao();
    const viewContainer = document.getElementById('pedidos-page');
    if (!viewContainer) { console.error("Container da view de Pedidos não encontrado!"); return; }
    if (!isPedidosInitialized) {
        window.addEventListener('novoPedidoRecebido', () => {
            console.log("Módulo de Pedidos ouviu o chamado: 'novoPedidoRecebido'. Atualizando a lista!");
            if (containerAtivos && !containerAtivos.closest('.view-container.hidden')) {
                buscarPedidosAtivos();
            }
        });

        viewContainer.querySelectorAll('.tab-btn').forEach(tab => { 
            tab.addEventListener('click', () => { 
                const filtroSelecionado = tab.getAttribute('data-filtro');
                viewContainer.querySelector('.tab-btn.active')?.classList.remove('active'); 
                tab.classList.add('active'); 
                const containerAtivosEl = document.getElementById('pedidos-ativos-container');
                const containerFinalizados = document.getElementById('pedidos-finalizados-container');
                if (filtroSelecionado === 'finalizados') { containerAtivosEl.classList.add('hidden'); containerFinalizados.classList.remove('hidden'); } 
                else { containerAtivosEl.classList.remove('hidden'); containerFinalizados.classList.add('hidden'); filtroAtivo = filtroSelecionado; paginaAtual = 1; termoBusca = ''; const inputBusca = viewContainer.querySelector('#filtro-busca-pedidos'); if (inputBusca) inputBusca.value = ''; buscarPedidosAtivos(); }
            }); 
        });
        const inputBusca = viewContainer.querySelector('#filtro-busca-pedidos');
        if (inputBusca) { inputBusca.addEventListener('keyup', () => { termoBusca = inputBusca.value.toLowerCase().trim(); paginaAtual = 1; renderizarPedidosAtivos(); }); }
        document.getElementById('btn-buscar-hoje')?.addEventListener('click', buscarPedidosDeHoje);
        document.getElementById('btn-buscar-data')?.addEventListener('click', async () => { const { value: data } = await Swal.fire({ title: 'Selecione uma data', input: 'date', background: '#2c2854', color: '#ffffff', confirmButtonText: 'Buscar', confirmButtonColor: '#ff6b35' }); if (data) buscarFinalizadosPorData(data); });
        const inputBuscaFinalizados = document.getElementById('filtro-busca-finalizados');
        const btnBuscaFinalizados = document.getElementById('btn-buscar-finalizado-por-codigo');
        if(inputBuscaFinalizados) { inputBuscaFinalizados.addEventListener('keyup', (e) => { if (e.key === 'Enter') { buscarPedidoPorCodigo(); } }); }
        if(btnBuscaFinalizados) { btnBuscaFinalizados.addEventListener('click', buscarPedidoPorCodigo); }
        window.addEventListener('pedidoFinalizado', () => { console.log('Evento pedidoFinalizado recebido! Recarregando pedidos...'); buscarPedidosAtivos(); if(document.getElementById('caixa-page') && !document.getElementById('caixa-page').classList.contains('hidden')){ window.dispatchEvent(new CustomEvent('recarregarMesas')); } });
        isPedidosInitialized = true;
    }
    
    await buscarPedidosAtivos();

    const abaAtivos = viewContainer.querySelector('.tab-btn[data-filtro="ativos"]');
    if (abaAtivos) { viewContainer.querySelector('.tab-btn.active')?.classList.remove('active'); abaAtivos.classList.add('active'); }
    document.getElementById('pedidos-ativos-container').classList.remove('hidden');
    document.getElementById('pedidos-finalizados-container').classList.add('hidden');
    filtroAtivo = 'ativos';
    termoBusca = '';
    const inputBuscaInicial = viewContainer.querySelector('#filtro-busca-pedidos');
    if(inputBuscaInicial) inputBuscaInicial.value = '';
}