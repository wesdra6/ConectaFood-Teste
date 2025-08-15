// REESCREVA O ARQUIVO COMPLETO: app/js/functions/caixa.js

import { enviarParaN8N, fetchDeN8N } from './api.js';
import { abrirModalGerenciamento } from './pedidos.js';
import { gerarHtmlImpressao, imprimirComprovante } from './impressao.js';
import { criaCardProduto } from './components.js';

let todasAsMesas = [];
let todosOsPedidosAtivosCaixa = [];
let todosOsProdutos = [];
let produtosServicos = []; 
let comandaAtual = [];
let pedidoAtualParaCheckout = null; 
let lojaConfig = null; 
let modalLancamento = null;
let isModalListenersAttached = false;
let tipoPedidoEmLancamento = '';
let idMesaEmLancamento = null;
let numeroMesaEmLancamento = null;

function toggleTaxaServico() {
    const taxaNome = 'Taxa de Serviço (10%)';
    const taxaIndex = comandaAtual.findIndex(i => i.nome === taxaNome);
    
    if (taxaIndex > -1) {
        comandaAtual.splice(taxaIndex, 1);
    } else {
        const servico = produtosServicos.find(s => s.nome === taxaNome);
        if (servico) {
            comandaAtual.push({ ...servico, quantidade: 1, preco_unitario: servico.preco, tipo_item: servico.tipo_item });
        }
    }
    renderizarComanda();
}

async function fetchDadosDoCaixa() {
    const gradeMesas = document.getElementById('grade-mesas');
    if (!gradeMesas) return;

    try {
        const [mesas, pedidos] = await Promise.all([
            fetchDeN8N(window.N8N_CONFIG.get_all_tables),
            fetchDeN8N(window.N8N_CONFIG.get_all_orders)
        ]);

        todasAsMesas = Array.isArray(mesas) ? mesas.sort((a, b) => a.numero_mesa - b.numero_mesa) : [];
        todosOsPedidosAtivosCaixa = Array.isArray(pedidos) ? pedidos : [];
        
        renderizarMesas(todasAsMesas);
        renderizarComandasBalcao(todosOsPedidosAtivosCaixa);

    } catch (error) {
        console.error("Erro ao buscar dados do caixa:", error);
        if(gradeMesas) gradeMesas.innerHTML = '<p class="text-red-400 text-center col-span-full py-4">Ops! Falha ao carregar dados.</p>';
    }
}

async function fetchProdutosCaixa() { 
    const listaProdutosContainer = document.getElementById('lista-produtos-caixa'); 
    try { 
        if (todosOsProdutos.length === 0) { 
            const produtosDoBanco = await fetchDeN8N(window.N8N_CONFIG.get_all_products_with_type);
            todosOsProdutos = produtosDoBanco.filter(p => p.tipo_item === 'PRODUTO' && p.ativo);
            produtosServicos = produtosDoBanco.filter(p => p.tipo_item !== 'PRODUTO');
        } 
        renderizarProdutosCaixa(todosOsProdutos); 
    } catch (error) { console.error("Erro ao buscar produtos para o caixa:", error); if (listaProdutosContainer) listaProdutosContainer.innerHTML = '<p class="text-red-500 p-4">Ops, falha ao carregar o cardápio.</p>'; } 
}

async function fetchLojaConfig() { 
    if (lojaConfig) return; 
    try { 
        const configs = await fetchDeN8N(window.N8N_CONFIG.get_loja_config); 
        if (configs && configs.length > 0) { lojaConfig = configs[0]; } 
    } catch (error) { 
        console.error("Não foi possível carregar as configs da loja para impressão.", error); 
    } 
}

function renderizarMesas(mesas) {
    const gradeMesas = document.getElementById('grade-mesas');
    if (!gradeMesas) return;
    gradeMesas.innerHTML = '';
    if (mesas.length === 0) {
        gradeMesas.innerHTML = '<p class="text-texto-muted text-center col-span-full">Nenhuma mesa cadastrada.</p>';
        return;
    }
    mesas.forEach(mesa => {
        const isOcupada = mesa.status === 'OCUPADA';
        const corStatus = isOcupada ? 'bg-red-500' : 'bg-green-500';
        const cardMesa = document.createElement('div');
        cardMesa.className = "mesa-card bg-card p-4 rounded-lg text-center cursor-pointer hover:opacity-80 transition-opacity";
        cardMesa.dataset.id = mesa.id;
        cardMesa.dataset.numero = mesa.numero_mesa;
        cardMesa.dataset.status = mesa.status;
        cardMesa.innerHTML = `<div class="text-4xl font-bold">${mesa.numero_mesa}</div><div class="mt-2 text-sm font-semibold uppercase p-1 rounded-md text-white ${corStatus}">${mesa.status}</div>`;
        cardMesa.addEventListener('click', () => handleMesaClick(mesa));
        gradeMesas.appendChild(cardMesa);
    });
}

function renderizarComandasBalcao(pedidos) {
    const container = document.getElementById('lista-comandas-balcao');
    if (!container) return;
    const pedidosDeBalcao = pedidos.filter(p => p.origem === 'BALCAO');
    container.innerHTML = '';
    if (pedidosDeBalcao.length === 0) {
        container.innerHTML = '<p class="text-texto-muted text-center col-span-full">Nenhuma comanda de balcão ativa.</p>';
        return;
    }
    pedidosDeBalcao.forEach(pedido => {
        const comandaCard = document.createElement('div');
        comandaCard.className = "bg-fundo p-3 rounded-lg text-center cursor-pointer hover:bg-sidebar transition-all flex flex-col justify-between relative";
        comandaCard.innerHTML = `
            <div class="absolute top-1 right-1">
                <button class="btn-gerenciar-comanda p-2 text-blue-400 hover:text-blue-300"><i class="bi bi-gear-fill"></i></button>
            </div>
            <div class="flex flex-col items-center justify-center flex-grow pt-4" data-action="fechar-conta">
                <span class="text-xs text-principal font-bold">Comanda</span>
                <div class="text-2xl font-bold">${pedido.id_pedido_publico}</div>
            </div>
        `;
        comandaCard.querySelector('[data-action="fechar-conta"]').addEventListener('click', () => handleComandaBalcaoClick(pedido, 'fechar'));
        comandaCard.querySelector('.btn-gerenciar-comanda').addEventListener('click', (e) => {
            e.stopPropagation(); 
            handleComandaBalcaoClick(pedido, 'gerenciar');
        });
        container.appendChild(comandaCard);
    });
}

function handleComandaBalcaoClick(pedido, acao) {
    if (!pedido) return;
    if (acao === 'gerenciar') {
        abrirModalGerenciamento(pedido.id);
    } else {
        prepararModalPara('CHECKOUT', { tipo: 'BALCAO_FECHAMENTO', pedido_id: pedido.id });
    }
}

async function handleMesaClick(mesa) {
    if (mesa.status === 'LIVRE') {
        prepararModalPara('LANCAMENTO', { tipo: 'MESA', id_mesa: mesa.id, numero_mesa: mesa.numero_mesa });
    } else if (mesa.status === 'OCUPADA') {
        const pedidoDaMesaLocal = todosOsPedidosAtivosCaixa.find(p => p.id_mesa == mesa.id && p.status !== 'ENTREGUE' && p.status !== 'CANCELADO');
        
        if (!pedidoDaMesaLocal) {
            Swal.fire({ icon: 'info', title: 'Mesa sem Pedido', text: 'Não encontramos um pedido ativo para esta mesa. Liberando...', background: '#2c2854', color: '#ffffff' });
            await enviarParaN8N(window.N8N_CONFIG.update_table_status, { id: mesa.id, status: 'LIVRE' });
            fetchDadosDoCaixa();
            return;
        }

        Swal.fire({ title: 'Buscando comanda...', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });

        try {
            const url = `${window.N8N_CONFIG.get_order_status}?id=${pedidoDaMesaLocal.id}`;
            const resposta = await fetchDeN8N(url);
            const pedidoDaMesaAtualizado = (Array.isArray(resposta) && resposta.length > 0) ? resposta[0] : null;

            if (!pedidoDaMesaAtualizado) {
                throw new Error("Não foi possível encontrar os dados atualizados do pedido.");
            }
            
            const itensHtml = (pedidoDaMesaAtualizado.itens_pedido || []).map(item => `<div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #4a4480;"><span style="text-align: left;"><b style="color: #ff6b35;">${item.quantidade}x</b> ${item.item || ''}</span><span style="text-align: right;">R$ ${((item.quantidade || 0) * (item.preco_unitario || 0)).toFixed(2)}</span></div>`).join('');
            
            // ➕ AQUI ESTÁ A CORREÇÃO MATEMÁTICA 👇
            const totalRecalculado = (pedidoDaMesaAtualizado.itens_pedido || []).reduce((acc, item) => {
                return acc + ( (item.quantidade || 0) * (item.preco_unitario || 0) );
            }, 0);
            
            const totalHtml = `<div style="text-align: right; font-size: 1.2rem; font-weight: bold; margin-top: 10px;">Total: <span style="color: #ff6b35;">R$ ${totalRecalculado.toFixed(2)}</span></div>`;
            
            Swal.fire({
                title: `Pedido da Mesa ${mesa.numero_mesa}`,
                html: `<div style="text-align: left; max-height: 300px; overflow-y: auto;">${itensHtml}</div>${totalHtml}`,
                background: '#2c2854', color: '#ffffff', showCancelButton: true,
                confirmButtonText: 'Fechar Conta', cancelButtonText: 'Gerenciar Pedido',
                confirmButtonColor: '#28a745', cancelButtonColor: '#ff6b35'
            }).then((result) => {
                if (result.isConfirmed) {
                    prepararModalPara('CHECKOUT', { tipo: 'MESA', pedido_id: pedidoDaMesaAtualizado.id });
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    abrirModalGerenciamento(pedidoDaMesaAtualizado.id);
                }
            });

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Ops!', text: 'Não foi possível carregar os dados atualizados da comanda.', background: '#2c2854', color: '#ffffff' });
        }
    }
}

function renderizarProdutosCaixa(produtos) { 
    const listaProdutos = document.getElementById('lista-produtos-caixa'); 
    if (!listaProdutos) return; 
    listaProdutos.innerHTML = ''; 
    if (!produtos || produtos.length === 0) { 
        listaProdutos.innerHTML = '<p class="text-texto-muted text-center p-4">Nenhum produto encontrado.</p>'; 
        return; 
    } 
    const produtosPorCategoria = produtos.reduce((acc, produto) => { 
        (acc[produto.nome_categoria || 'Outros'] = acc[produto.nome_categoria || 'Outros'] || []).push(produto); 
        return acc; 
    }, {});
    const categoriasOrdenadas = Object.keys(produtosPorCategoria).sort(); 
    const fragment = document.createDocumentFragment();
    for (const categoria of categoriasOrdenadas) { 
        const h3 = document.createElement('h3');
        h3.className = "text-lg font-bold text-principal border-b-2 border-principal/50 mb-3 mt-4 first:mt-0";
        h3.textContent = categoria;
        fragment.appendChild(h3);
        produtosPorCategoria[categoria].forEach(produto => {
            const cardComponent = criaCardProduto(produto, 'caixa');
            if (cardComponent) fragment.appendChild(cardComponent);
        }); 
    }
    listaProdutos.appendChild(fragment);
}

function renderizarComanda() { 
    const comandaItensContainer = document.getElementById('comanda-itens'); 
    const comandaTotalEl = document.getElementById('comanda-total'); 
    if (!comandaItensContainer || !comandaTotalEl) return; 
    
    comandaItensContainer.innerHTML = '';

    const subtotalProdutos = comandaAtual
        .filter(item => item.tipo_item === 'PRODUTO')
        .reduce((acc, item) => acc + (Number(item.preco_unitario || item.preco) * item.quantidade), 0);

    const taxaServicoItem = comandaAtual.find(i => i.nome === 'Taxa de Serviço (10%)' || i.item === 'Taxa de Serviço (10%)');
    if (taxaServicoItem) { 
        taxaServicoItem.preco_unitario = subtotalProdutos * 0.10; 
    }

    const totalFinal = comandaAtual.reduce((acc, item) => acc + (Number(item.preco_unitario || item.preco) * item.quantidade), 0);

    const fragment = document.createDocumentFragment();

    comandaAtual.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = "flex justify-between items-center text-sm mb-2";
        const nomeItem = item.nome || item.item;

        const isTaxaEntrega = item.id === 99999 || nomeItem.toLowerCase() === 'taxa de entrega';
        const isTaxaServico = nomeItem.toLowerCase().includes('taxa de serviço');

        let botaoRemoverHtml;
        if (isTaxaEntrega) {
            botaoRemoverHtml = `<button class="text-gray-500 cursor-not-allowed" disabled title="A taxa de entrega não pode ser removida."><i class="bi bi-lock-fill"></i></button>`;
        } else if (isTaxaServico) {
            botaoRemoverHtml = `<div class="w-8"></div>`;
        } else {
            botaoRemoverHtml = `<button class="btn-remover-item text-red-500 hover:text-red-400"><i class="bi bi-x-circle-fill"></i></button>`;
        }

        itemEl.innerHTML = `
            <div class="flex-grow"><span class="font-bold">${item.quantidade}x</span> ${nomeItem}</div>
            <div class="flex items-center gap-2">
                <span class="font-semibold text-principal w-20 text-right">R$ ${(Number(item.preco_unitario || item.preco) * item.quantidade).toFixed(2)}</span>
                ${botaoRemoverHtml}
            </div>`;
        
        if (!isTaxaEntrega && !isTaxaServico) {
            itemEl.querySelector('.btn-remover-item').onclick = () => window.caixaFunctions.removerItemDaComanda(item.id);
        }
        
        fragment.appendChild(itemEl);
    });
    
    comandaItensContainer.appendChild(fragment);
    comandaTotalEl.textContent = `R$ ${totalFinal.toFixed(2)}`; 
    
    const btnTaxa = document.getElementById('btn-toggle-taxa');
    if (btnTaxa) {
        if (taxaServicoItem) {
            btnTaxa.textContent = 'REMOVER TAXA';
            btnTaxa.classList.add('bg-red-500');
            btnTaxa.classList.remove('bg-sidebar');
        } else {
            btnTaxa.textContent = '+ TAXA 10%';
            btnTaxa.classList.remove('bg-red-500');
            btnTaxa.classList.add('bg-sidebar');
        }
    }
}

async function prepararModalPara(modo, dados = {}) {
    if (!modalLancamento) {
        const modalEl = document.getElementById('modal-lancamento-pedido');
        if (modalEl) { modalLancamento = new bootstrap.Modal(modalEl); } 
        else { console.error("Elemento do modal de lançamento não encontrado."); return; }
    }
    if (!isModalListenersAttached) {
        document.getElementById('btn-finalizar-lancamento')?.addEventListener('click', finalizarLancamento);
        document.getElementById('btn-finalizar-checkout')?.addEventListener('click', finalizarCheckout);
        document.getElementById('btn-toggle-taxa')?.addEventListener('click', toggleTaxaServico);
        document.getElementById('busca-produto-caixa')?.addEventListener('keyup', (e) => {
            const termo = e.target.value.toLowerCase();
            const produtosFiltrados = !termo ? todosOsProdutos : todosOsProdutos.filter(p => p.nome.toLowerCase().includes(termo));
            renderizarProdutosCaixa(produtosFiltrados);
        });
        isModalListenersAttached = true;
    }
    const btnLancar = document.getElementById('btn-finalizar-lancamento');
    const btnCheckout = document.getElementById('btn-finalizar-checkout');
    const areaPagamento = document.getElementById('area-pagamento');
    const colunaEsquerda = document.getElementById('caixa-coluna-esquerda');
    const btnTaxa = document.getElementById('btn-toggle-taxa');

    if (modo === 'LANCAMENTO') {
        comandaAtual = [];
        pedidoAtualParaCheckout = null;
        tipoPedidoEmLancamento = dados.tipo;
        idMesaEmLancamento = dados.id_mesa || null;
        numeroMesaEmLancamento = dados.numero_mesa || null;
        if (btnLancar) btnLancar.classList.remove('hidden');
        if (btnCheckout) btnCheckout.classList.add('hidden');
        if (areaPagamento) areaPagamento.classList.add('hidden');
        if (colunaEsquerda) colunaEsquerda.classList.remove('hidden');
        if (btnTaxa) btnTaxa.classList.add('hidden');
        document.getElementById('modal-titulo').textContent = `Lançar Pedido - ${dados.tipo === 'MESA' ? `Mesa ${dados.numero_mesa}` : 'Balcão'}`;
    } else if (modo === 'CHECKOUT') {
        if (dados.pedido_id) {
            Swal.fire({ title: 'Carregando comanda...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            try {
                const url = `${window.N8N_CONFIG.get_order_status}?id=${dados.pedido_id}`;
                const resposta = await fetchDeN8N(url);
                const pedidoAtualizado = (Array.isArray(resposta) && resposta.length > 0) ? resposta[0] : null;
                if (!pedidoAtualizado) throw new Error('Pedido não encontrado.');
                pedidoAtualParaCheckout = pedidoAtualizado;
                Swal.close();
            } catch (error) {
                Swal.fire('Ops!', 'Não foi possível carregar os dados atualizados da comanda.', 'error');
                return;
            }
        } else {
            pedidoAtualParaCheckout = dados.pedido;
        }

        comandaAtual = pedidoAtualParaCheckout.itens_pedido.map(item => ({...item, nome: item.item || item.nome, preco_unitario: item.preco_unitario || item.preco, quantidade: item.quantidade, tipo_item: item.tipo_item || 'PRODUTO'}));
        if(btnLancar) btnLancar.classList.add('hidden');
        if(btnCheckout) btnCheckout.classList.remove('hidden');
        if(areaPagamento) areaPagamento.classList.remove('hidden');
        if(colunaEsquerda) colunaEsquerda.classList.add('hidden');
        if(btnTaxa) btnTaxa.classList.remove('hidden');
        document.getElementById('modal-titulo').textContent = `Fechar Conta - ${pedidoAtualParaCheckout.nome_cliente || 'Balcão'} (#${pedidoAtualParaCheckout.id_pedido_publico})`;
    }
    renderizarComanda();
    if (modalLancamento) modalLancamento.show();
}

async function finalizarLancamento() { 
    if (comandaAtual.length === 0) { Swal.fire('Comanda Vazia', 'Adicione pelo menos um item.', 'warning'); return; } 
    Swal.fire({ title: 'Lançando pedido...', text: 'Aguarde...', allowOutsideClick: false, didOpen: () => Swal.showLoading() }); 
    const nomeCliente = tipoPedidoEmLancamento === 'MESA' ? `Mesa ${numeroMesaEmLancamento}` : 'Balcão'; 
    const dadosPedido = { 
        origem: tipoPedidoEmLancamento, nome_cliente: nomeCliente, id_mesa: idMesaEmLancamento, 
        numero_mesa: numeroMesaEmLancamento, 
        itens: comandaAtual.map(item => ({ id: item.id, quantidade: item.quantidade, preco: item.preco_unitario || item.preco })), 
        total: comandaAtual.reduce((acc, item) => acc + ( (item.preco_unitario || item.preco) * item.quantidade), 0) 
    }; 
    try { 
        const resultado = await enviarParaN8N(window.N8N_CONFIG.create_order_internal, dadosPedido); 
        if (resultado.success) { 
            Swal.fire('Sucesso!', 'Pedido lançado!', 'success'); 
            if (modalLancamento) modalLancamento.hide(); 
            fetchDadosDoCaixa(); 
            localStorage.setItem('novoPedidoAdmin', 'internal'); 
        } else { throw new Error(resultado.message || "Erro no servidor."); } 
    } catch (error) { console.error("Erro ao finalizar lançamento:", error); Swal.fire('Ops!', 'Não foi possível lançar o pedido.', 'error'); } 
}

async function finalizarCheckout() { 
    const formaPagamento = document.getElementById('caixa-forma-pagamento').value; 
    if (!formaPagamento) { Swal.fire('Pagamento Pendente', 'Selecione a forma de pagamento.', 'warning'); return; } 
    const totalFinal = comandaAtual.reduce((acc, item) => acc + (Number(item.preco_unitario || item.preco) * item.quantidade), 0); 
    const pedidoAtualizado = { ...pedidoAtualParaCheckout, total: totalFinal, itens_pedido: comandaAtual.map(item => ({ item: item.nome || item.item, quantidade: item.quantidade, preco_unitario: item.preco_unitario || item.preco, tipo_item: item.tipo_item })) }; 
    pedidoAtualizado.forma_pagamento = formaPagamento;
    const htmlParaImprimir = gerarHtmlImpressao(pedidoAtualizado, lojaConfig); 
    const impressoComSucesso = imprimirComprovante(htmlParaImprimir); 
    if (!impressoComSucesso) return; 
    
    Swal.fire({ title: 'Finalizando Pedido...', text: 'Aguarde...', didOpen: () => Swal.showLoading() }); 
    try { 
        const payload = { 
            pedido_id: pedidoAtualizado.id, 
            id_mesa: pedidoAtualizado.id_mesa || null, 
            forma_pagamento: formaPagamento, 
            novos_itens: comandaAtual.filter(item => !pedidoAtualParaCheckout.itens_pedido.some(original => original.id === item.id)).map(item => ({ produto_id: item.produto_id || item.id, quantidade: item.quantidade, preco_unitario: item.preco_unitario || item.preco })), 
            novo_total: totalFinal 
        }; 
        await enviarParaN8N(window.N8N_CONFIG.finalize_order_and_table, payload); 
        if (modalLancamento) modalLancamento.hide(); 
        Swal.fire({ icon: 'success', title: 'Sucesso!', text: 'Pedido finalizado!' }).then(() => { 
            fetchDadosDoCaixa(); 
            window.dispatchEvent(new CustomEvent('pedidoFinalizado')); 
        }); 
    } catch (error) { console.error('Erro ao finalizar o pedido:', error); Swal.fire('Ops!', 'A conta foi impressa, mas houve um erro ao finalizar o pedido. Verifique o console.', 'error'); } 
}

let isCaixaInitialized = false;
window.caixaGlobal = { abrirModalParaFechamento: (tipo, pedido) => prepararModalPara('CHECKOUT', { tipo, pedido }) };

export function initCaixaPage() {
    if (!isCaixaInitialized) {
        document.getElementById('btn-nova-comanda-balcao')?.addEventListener('click', () => {
            prepararModalPara('LANCAMENTO', {tipo: 'BALCAO'});
        });
        window.caixaFunctions = {
            adicionarItemNaComanda: (produtoId) => {
                const produto = todosOsProdutos.find(p => p.id === produtoId);
                if (!produto) return;
                const itemExistente = comandaAtual.find(i => i.id === produtoId || i.produto_id === produtoId);
                if (itemExistente) { itemExistente.quantidade++; } 
                else { comandaAtual.push({ ...produto, quantidade: 1, preco_unitario: produto.preco, tipo_item: 'PRODUTO' }); }
                renderizarComanda();
            },
            removerItemDaComanda: (produtoId) => {
                const index = comandaAtual.findIndex(item => item.id === produtoId);
                if(index > -1){
                    comandaAtual.splice(index, 1);
                    renderizarComanda();
                }
            },
        };
        window.addEventListener('recarregarMesas', () => {
            console.log("Caixa: Fui notificado para recarregar as mesas!");
            fetchDadosDoCaixa();
        });
        isCaixaInitialized = true;
    }
    fetchDadosDoCaixa();
    fetchProdutosCaixa();
    fetchLojaConfig();
}