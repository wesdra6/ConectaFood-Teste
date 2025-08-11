// REESCREVA O ARQUIVO COMPLETO: app/js/functions/garcom.js

import { enviarParaN8N, fetchDeN8N } from './api.js';
import { abrirModalGerenciamento } from './pedidos.js';

let todosOsProdutos = [];
let comandaAtual = [];
let mesaEmLancamento = null;
let modalLancamentoGarcom = null;
let isModalListenersAttached = false;
let lojaConfigGarcom = null;

async function carregarLojaConfigGarcom() {
    try {
        const configs = await fetchDeN8N(window.N8N_CONFIG.get_loja_config);
        if (configs && configs.length > 0) {
            lojaConfigGarcom = configs[0];
            const logoContainer = document.getElementById('logo-container-garcom');
            if (logoContainer) {
                const pageTitle = document.querySelector('title');
                if(pageTitle) pageTitle.textContent = `${pageTitle.textContent} - ${lojaConfigGarcom.nome_loja || 'LegalConnect'}`;
                if (lojaConfigGarcom.logo_vitrine_url) {
                    logoContainer.innerHTML = `<img src="${lojaConfigGarcom.logo_vitrine_url}" alt="${lojaConfigGarcom.nome_loja}" class="max-h-16 w-auto">`;
                } else if (lojaConfigGarcom.nome_loja) {
                    logoContainer.innerHTML = `<span class="text-2xl font-bold text-principal">${lojaConfigGarcom.nome_loja}</span>`;
                }
            }
        }
    } catch (error) { console.error("Erro ao carregar configs da loja:", error); }
}

function renderizarMesasGarcom(mesas) {
    const gradeMesas = document.getElementById('grade-mesas-garcom');
    if (!gradeMesas) return;
    gradeMesas.innerHTML = '';
    mesas.forEach(mesa => {
        const isOcupada = mesa.status === 'OCUPADA';
        const corStatus = isOcupada ? 'bg-red-500' : 'bg-green-500';
        const cardMesa = document.createElement('div');
        cardMesa.className = "mesa-card bg-card p-4 rounded-lg text-center cursor-pointer";
        cardMesa.addEventListener('click', () => handleMesaClick(mesa));
        cardMesa.innerHTML = `<div class="text-4xl font-bold">${mesa.numero_mesa}</div><div class="mt-2 text-sm font-semibold uppercase p-1 rounded-md text-white ${corStatus}">${mesa.status}</div>`;
        gradeMesas.appendChild(cardMesa);
    });
}

// ➕ ALTERAÇÃO AQUI 👇 A função foi reescrita para usar delegação de eventos
function renderizarCardapio(containerId, produtos) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    const produtosFiltrados = produtos.filter(p => p.tipo_item === 'PRODUTO');
    const produtosPorCategoria = produtosFiltrados.reduce((acc, produto) => { 
        (acc[produto.nome_categoria || 'Outros'] = acc[produto.nome_categoria || 'Outros'] || []).push(produto); 
        return acc; 
    }, {});
    const categoriasOrdenadas = Object.keys(produtosPorCategoria).sort();
    
    let cardapioHtml = '';
    for (const categoria of categoriasOrdenadas) {
        cardapioHtml += `<h3 class="text-lg font-bold text-principal border-b-2 border-principal/50 mb-3 mt-4 first:mt-0">${categoria}</h3>`;
        produtosPorCategoria[categoria].forEach(produto => {
            cardapioHtml += `
            <div class="bg-fundo p-2 rounded-lg flex items-center gap-4 cursor-pointer hover:bg-sidebar transition-colors mb-2" data-produto-id="${produto.id}">
                <div class="flex-grow overflow-hidden"><p class="font-bold truncate text-base">${produto.nome}</p><span class="text-principal font-semibold text-lg">R$ ${Number(produto.preco).toFixed(2)}</span></div>
                <button aria-label="Adicionar ${produto.nome}" class="bg-principal text-white w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-2xl font-bold pointer-events-none">+</button>
            </div>`;
        });
    }
    container.innerHTML = cardapioHtml;
}

function adicionarItemNaComanda(produtoId) {
    const produto = todosOsProdutos.find(p => p.id === produtoId);
    if (!produto) return;
    const itemExistente = comandaAtual.find(i => i.id === produtoId);
    if (itemExistente) { itemExistente.quantidade++; } else { comandaAtual.push({ ...produto, quantidade: 1 }); }
    renderizarComanda();
}

function renderizarComanda() {
    const itensContainer = document.getElementById('comanda-itens-garcom');
    const totalEl = document.getElementById('comanda-total-garcom');
    
    itensContainer.innerHTML = '';
    let total = 0;

    comandaAtual.forEach(item => {
        const subtotal = item.quantidade * (item.preco_unitario || item.preco);
        total += subtotal;
        const nomeItem = item.nome || item.item;
        itensContainer.innerHTML += `<div class="flex justify-between items-center text-sm mb-2"><div class="flex-grow"><span class="font-bold">${item.quantidade}x</span> ${nomeItem}</div><span class="font-semibold text-principal w-20 text-right">R$ ${subtotal.toFixed(2)}</span></div>`;
    });

    totalEl.textContent = `R$ ${total.toFixed(2)}`;
}

async function handleMesaClick(mesa) {
    if (mesa.status === 'LIVRE') {
        mesaEmLancamento = mesa;
        comandaAtual = [];
        const obsTextarea = document.getElementById('garcom-observacoes');
        if (obsTextarea) obsTextarea.value = '';
        document.getElementById('modal-lancamento-titulo').textContent = `Lançar Pedido - Mesa ${mesa.numero_mesa}`;
        renderizarCardapio('lista-produtos-garcom', todosOsProdutos);
        renderizarComanda();
        if (modalLancamentoGarcom) modalLancamentoGarcom.show();
    } else {
        Swal.fire({ title: `Buscando Pedido...`, allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });
        try {
            const pedidos = await fetchDeN8N(window.N8N_CONFIG.get_all_orders);
            const pedidoDaMesa = pedidos.find(p => p.id_mesa == mesa.id && p.status !== 'ENTREGUE' && p.status !== 'CANCELADO');
            Swal.close();

            if (pedidoDaMesa) {
                abrirModalGerenciamento(pedidoDaMesa.id, 'GARCOM');
            } else {
                Swal.fire('Ops!', 'Não foi possível encontrar o pedido ativo para esta mesa.', 'info');
            }
        } catch(e) {
            Swal.fire('Erro', 'Não foi possível buscar os detalhes do pedido.', 'error');
        }
    }
}

function attachModalListeners() {
    if (isModalListenersAttached) return;
    document.getElementById('btn-finalizar-lancamento-garcom').addEventListener('click', async () => {
        if (comandaAtual.length === 0) { Swal.fire('Comanda Vazia', 'Adicione pelo menos um item.', 'warning'); return; }
        Swal.fire({ title: 'Lançando pedido...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const observacoes = document.getElementById('garcom-observacoes').value.trim();
        const dadosPedido = {
            origem: 'MESA',
            nome_cliente: `Mesa ${mesaEmLancamento.numero_mesa}`,
            id_mesa: mesaEmLancamento.id,
            numero_mesa: mesaEmLancamento.numero_mesa,
            garcom_id: sessionStorage.getItem('garcom_id'),
            itens: comandaAtual.map(item => ({ id: item.id, quantidade: item.quantidade, preco: item.preco })),
            total: comandaAtual.reduce((acc, item) => acc + (item.preco * item.quantidade), 0),
            observacoes: observacoes
        };
        try {
            await enviarParaN8N(window.N8N_CONFIG.create_order_internal, dadosPedido);
            if (modalLancamentoGarcom) modalLancamentoGarcom.hide();
            Swal.fire('Sucesso!', 'Pedido enviado para a cozinha!', 'success');
            localStorage.setItem('novoPedidoAdmin', 'internal'); 
            initGarcomMesasPage(); 
        } catch (error) { Swal.fire('Ops!', 'Não foi possível lançar o pedido.', 'error'); }
    });

    // ➕ O ESCUTADOR ÚNICO FICA AQUI 👇
    const containerCardapio = document.getElementById('lista-produtos-garcom');
    if (containerCardapio) {
        containerCardapio.addEventListener('click', (event) => {
            const card = event.target.closest('[data-produto-id]');
            if(card) {
                const produtoId = parseInt(card.dataset.produtoId);
                adicionarItemNaComanda(produtoId);
            }
        });
    }

    const inputBusca = document.getElementById('busca-produto-garcom');
    if (inputBusca) {
        inputBusca.addEventListener('keyup', () => {
            const termo = inputBusca.value.toLowerCase().trim();
            const produtosFiltrados = !termo ? todosOsProdutos : todosOsProdutos.filter(p => p.nome.toLowerCase().includes(termo));
            renderizarCardapio('lista-produtos-garcom', produtosFiltrados);
        });
    }
    isModalListenersAttached = true;
}

export async function initGarcomLoginPage() {
    console.log("Maestro: Garçom Login - Final. 🤵");
    if (sessionStorage.getItem('garcom_id')) { window.location.href = 'garcom-mesas.html'; return; }
    await carregarLojaConfigGarcom();
    const form = document.getElementById('form-login-garcom');
    const select = document.getElementById('garcom-select-login');
    try {
        const garcons = await fetchDeN8N(window.N8N_CONFIG.get_all_garcons);
        select.innerHTML = '<option value="" disabled selected>Selecione seu nome...</option>';
        garcons.forEach(garcom => { select.innerHTML += `<option value="${garcom.id}">${garcom.nome}</option>`; });
    } catch(e) { select.innerHTML = '<option value="" disabled>Falha ao carregar equipe</option>'; }
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const garcomId = select.value;
        const pin = document.getElementById('pin-input-login').value;
        if (!garcomId || !pin) { Swal.fire({ icon: 'warning', title: 'Opa!', text: 'Selecione seu nome e digite o PIN.', background: '#2c2854', color: '#ffffff' }); return; }
        Swal.fire({ title: 'Verificando acesso...', background: '#2c2854', color: '#ffffff', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            const resultado = await enviarParaN8N(window.N8N_CONFIG.garcom_login, { id: garcomId, pin: pin });
            if (Array.isArray(resultado) && resultado.length > 0) {
                const garcom = resultado[0];
                sessionStorage.setItem('garcom_id', garcom.id);
                sessionStorage.setItem('garcom_nome', garcom.nome);
                window.location.href = 'garcom-mesas.html';
            } else { throw new Error('PIN incorreto ou garçom não encontrado.'); }
        } catch (error) { Swal.fire({ icon: 'error', title: 'Acesso Negado', text: error.message, background: '#2c2854', color: '#ffffff' }); }
    });
}

export async function initGarcomMesasPage() {
    console.log("Maestro: Garçom Mesas - Final. 🍽️");
    const garcomId = sessionStorage.getItem('garcom_id');
    const garcomNome = sessionStorage.getItem('garcom_nome');
    if (!garcomId || !garcomNome) {
        sessionStorage.clear();
        window.location.replace('garcom-login.html');
        return;
    }
    await carregarLojaConfigGarcom();
    const saudacaoEl = document.getElementById('garcom-saudacao');
    if (saudacaoEl) { saudacaoEl.textContent = `Olá, ${garcomNome}! Estas são as suas mesas.`; }
    document.getElementById('btn-logout-garcom').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.replace('garcom-login.html');
    });
    try {
        const [mesas, produtos] = await Promise.all([
            fetchDeN8N(window.N8N_CONFIG.get_all_tables),
            fetchDeN8N(window.N8N_CONFIG.get_all_products_with_type)
        ]);
        todosOsProdutos = produtos;
        const mesasDoGarcom = mesas.filter(mesa => mesa.garcom_id == garcomId);
        renderizarMesasGarcom(mesasDoGarcom);
        if (!modalLancamentoGarcom) {
            modalLancamentoGarcom = new bootstrap.Modal(document.getElementById('modal-lancamento-garcom'));
        }
        attachModalListeners();
    } catch (error) {
        console.error("Erro ao inicializar página de mesas:", error);
        const gradeMesas = document.getElementById('grade-mesas-garcom');
        if(gradeMesas) gradeMesas.innerHTML = '<p class="text-red-500 text-center col-span-full">Não foi possível carregar suas mesas.</p>';
    }
}