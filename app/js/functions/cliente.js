// REESCREVA O ARQUIVO COMPLETO: js/functions/cliente.js

import { enviarParaN8N, fetchDeN8N } from './api.js';
import { initCarrinho } from './carrinho.js';

let produtosDaVitrine = [];

function gerarIdPedidoPublico() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012243456789';
    let resultado = '';
    for (let i = 0; i < 6; i++) {
        resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return resultado;
}

// 👇 ESTA FUNÇÃO AGORA É A CHEFE! ELA DECIDE SE MOSTRA O CARDÁPIO OU A PLACA DE "FECHADO" 👇
async function carregarConfiguracoesDaLoja() {
    const container = document.getElementById('vitrine-builder-container');
    const badge = document.getElementById('status-loja-badge');

    try {
        const configs = await fetchDeN8N(window.N8N_CONFIG.get_loja_config);
        if (configs && configs.length > 0) {
            const { nome_loja, logo_vitrine_url, taxa_entrega_fixa, loja_aberta } = configs[0];
            const logoContainer = document.getElementById('logo-vitrine-container');

            // Atualiza logo e título da página
            if (logoContainer) {
                document.title = nome_loja || 'Nosso Cardápio';
                logoContainer.innerHTML = logo_vitrine_url 
                    ? `<img src="${logo_vitrine_url}" alt="${nome_loja}" class="max-h-20 w-auto">` 
                    : `<span class="text-2xl font-bold text-principal">${nome_loja}</span>`;
            }

            // Atualiza taxa de entrega no carrinho
            if (window.carrinhoFunctions) {
                window.carrinhoFunctions.setTaxaEntrega(taxa_entrega_fixa);
            }

            // 🧠 A GRANDE DECISÃO ACONTECE AQUI!
            if (loja_aberta) {
                if (badge) {
                    badge.innerHTML = `<span>ABERTO</span> <i class="bi bi-lightning-charge-fill"></i>`;
                    badge.className = 'px-3 py-1 rounded-full text-sm font-bold text-white bg-green-500 animate-pulse';
                }
                // Se a loja está aberta, carrega o cardápio.
                await fetchDadosDaVitrine();
            } else {
                if (badge) {
                    badge.innerHTML = `<span>FECHADO</span> <i class="bi bi-moon-stars-fill"></i>`;
                    badge.className = 'px-3 py-1 rounded-full text-sm font-bold text-white bg-red-600';
                }
                // Se está fechada, mostra a mensagem e encerra.
                if (container) {
                    container.innerHTML = `
                        <div class="text-center py-20">
                            <i class="bi bi-shop-window text-6xl text-texto-muted"></i>
                            <h2 class="text-3xl font-bold mt-4">Nossa cozinha está fechada.</h2>
                            <p class="text-lg text-texto-muted mt-2">Estamos descansando para te atender melhor. <br> Volte mais tarde!</p>
                        </div>`;
                }
            }
        }
    } catch (error) { 
        console.error("Erro ao carregar as configurações da loja:", error); 
        if(container) container.innerHTML = '<p class="text-red-500 text-center py-10 text-xl">Ops! Tivemos um problema de conexão.</p>';
    }
}

async function fetchDadosDaVitrine() {
    const container = document.getElementById('vitrine-builder-container');
    if (!container) return;
    container.innerHTML = '<p class="text-texto-muted text-center py-10 text-xl animate-pulse">Montando nosso cardápio pra você... 👨‍🍳</p>';
    try {
        const [categorias, banners, produtos] = await Promise.all([
            fetchDeN8N(window.N8N_CONFIG.get_all_categories),
            fetchDeN8N(window.N8N_CONFIG.get_all_banners),
            fetchDeN8N(window.N8N_CONFIG.get_all_products)
        ]);
        produtosDaVitrine = produtos || [];
        let htmlDaPagina = renderizarBanners(banners || []) + renderizarIconesCategoria(categorias || []) + renderizarProdutosPorCategoria(produtosDaVitrine, categorias || []);
        container.innerHTML = htmlDaPagina || `<div class="text-center py-20"><i class="bi bi-shop-window text-6xl text-texto-muted"></i><h2 class="text-3xl font-bold mt-4">Nossa cozinha está fechada.</h2><p class="text-lg text-texto-muted mt-2">Volte mais tarde!</p></div>`;
        iniciarSliders();
    } catch (error) {
        console.error("Falha CRÍTICA ao buscar dados da vitrine:", error);
        container.innerHTML = '<p class="text-red-500 text-center py-10 text-xl">Ops! Não conseguimos carregar o cardápio.</p>';
    }
}

function renderizarBanners(banners) { const bannersAtivos = banners.filter(b => b.ativo); if (bannersAtivos.length === 0) return ''; const slidesHtml = bannersAtivos.map(banner => `<div class="swiper-slide"><a href="${banner.link_ancora || '#'}"><img src="${banner.url_imagem}" class="w-full h-full object-cover" alt="Banner Promocional"></a></div>`).join(''); return `<section class="mb-12"><div class="swiper swiper-banners relative h-48 md:h-80 rounded-2xl"><div class="swiper-wrapper">${slidesHtml}</div></div></section>`; }
function renderizarIconesCategoria(categorias) { if (categorias.length === 0) return ''; const slidesHtml = categorias.map(cat => `<div class="swiper-slide !w-auto"><div onclick="clientFunctions.rolarParaCategoria('${cat.id}')" class="group flex flex-col items-center space-y-2 cursor-pointer text-center"><div class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center transition-colors" style="background-color: ${cat.cor_fundo || '#38326b'};">${cat.url_icone ? `<img src="${cat.url_icone}" alt="${cat.nome}" class="w-10 h-10 sm:w-12 sm:h-12 object-contain group-hover:scale-110 transition-transform">` : `<i class="bi bi-tag-fill text-3xl sm:text-4xl group-hover:scale-110 transition-transform"></i>`}</div><span class="font-semibold text-xs sm:text-sm text-texto-base group-hover:text-principal transition-colors">${cat.nome}</span></div></div>`).join(''); return `<section class="mb-12"><h2 class="text-2xl font-bold mb-2">Categorias</h2><div class="swiper swiper-categorias relative"><div class="swiper-wrapper py-2">${slidesHtml}</div></div></section>`; }

function renderizarProdutosPorCategoria(produtos, categorias) {
    if (produtos.length === 0 || categorias.length === 0) return '';
    
    const produtosAgrupados = produtos.reduce((acc, p) => {
        (acc[p.categoria_id] = acc[p.categoria_id] || []).push(p);
        return acc;
    }, {});

    return categorias.map(cat => {
        const produtosDaCategoria = produtosAgrupados[cat.id];
        if (!produtosDaCategoria || produtosDaCategoria.length === 0) return '';

        const cardsHtml = produtosDaCategoria.map(p => {
            const imagem = (p.imagens_urls && p.imagens_urls.length > 0) ? p.imagens_urls[0] : 'https://via.placeholder.com/400x300.png?text=Sem+Imagem';
            
            return `
                <div class="swiper-slide !w-72 h-auto">
                    <div class="bg-card rounded-xl overflow-hidden shadow-lg flex flex-col h-full group cursor-pointer" onclick="clientFunctions.abrirModalDetalhes(${p.id})">
                        <div class="h-48 overflow-hidden">
                            <img src="${imagem}" alt="${p.nome}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
                        </div>
                        <div class="p-4 flex flex-col flex-grow">
                            <h3 class="text-xl font-bold truncate">${p.nome}</h3>
                            <p class="text-texto-muted text-sm mt-1 mb-4 h-10 line-clamp-2">${p.descricao || 'Clique para ver mais detalhes.'}</p>
                            <div class="mt-auto">
                                <span class="text-3xl font-bold text-principal block mb-3">R$ ${Number(p.preco).toFixed(2)}</span>
                                <button onclick="event.stopPropagation(); clientFunctions.handleAdicionarAoCarrinho(${p.id})" 
                                        class="w-full bg-principal text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors text-lg">
                                    ADICIONAR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('');
        
        return `<section id="categoria-${cat.id}" class="space-y-4">
                    <h2 class="text-3xl font-bold border-l-4 border-principal pl-4">${cat.nome}</h2>
                    <div class="swiper swiper-produtos relative py-4">
                        <div class="swiper-wrapper">${cardsHtml}</div>
                    </div>
                </section>`;
    }).join('');
}

function iniciarSliders() { const bannerSwiperEl = document.querySelector('.swiper-banners'); if (bannerSwiperEl) new Swiper(bannerSwiperEl, { loop: bannerSwiperEl.querySelectorAll('.swiper-slide').length > 1, autoplay: { delay: 4000, disableOnInteraction: false }, effect: 'slide' }); const categoriasSwiperEl = document.querySelector('.swiper-categorias'); if (categoriasSwiperEl) new Swiper(categoriasSwiperEl, { slidesPerView: 'auto', spaceBetween: 24 }); document.querySelectorAll('.swiper-produtos').forEach(el => new Swiper(el, { slidesPerView: 'auto', spaceBetween: 16 })); }
function showAlert(message, type = 'success') { const container = document.getElementById('alert-container'); if (!container) return; const toast = document.createElement('div'); toast.className = 'custom-toast'; let iconClass = 'bi-check-circle-fill text-green-400'; if (type === 'error') iconClass = 'bi-x-circle-fill text-red-400'; else if (type === 'info') iconClass = 'bi-info-circle-fill text-blue-400'; toast.innerHTML = `<i class="bi ${iconClass} text-2xl"></i><span class="font-semibold">${message}</span>`; container.appendChild(toast); setTimeout(() => toast.classList.add('show'), 10); setTimeout(() => { toast.classList.remove('show'); toast.addEventListener('transitionend', () => toast.remove()); }, 2500); }
function abrirModalDetalhes(produtoId) { const produto = produtosDaVitrine.find(p => p.id === produtoId); if (!produto) return; const modalElement = document.getElementById('detalhesProdutoModal'); if (!modalElement) return; const modalTitle = modalElement.querySelector('#detalhesProdutoModalLabel'); const modalBody = modalElement.querySelector('#detalhesProdutoBody'); const btnAdicionar = modalElement.querySelector('#btn-adicionar-do-modal'); modalTitle.textContent = produto.nome; const imagensDisponiveis = produto.imagens_urls && produto.imagens_urls.length > 0 ? produto.imagens_urls : ['https://via.placeholder.com/800x400.png?text=Sem+Imagem']; const imagensHtml = imagensDisponiveis.map(url => `<div class="swiper-slide"><img src="${url}" class="w-full h-64 object-cover rounded-lg"></div>`).join(''); const ingredientesHtml = (produto.ingredientes && produto.ingredientes.length > 0) ? produto.ingredientes.map(ing => `<span class="bg-fundo px-3 py-1 rounded-full text-sm">${ing}</span>`).join('') : '<p class="text-texto-muted text-sm">Ingredientes não informados.</p>'; modalBody.innerHTML = `<div class="swiper swiper-modal-produto w-full mb-4 h-64 rounded-lg overflow-hidden"><div class="swiper-wrapper">${imagensHtml}</div></div><div class="space-y-4"><div><h4 class="font-bold text-xl text-principal">Descrição</h4><p class="text-texto-muted">${produto.descricao || 'Sem descrição para este item.'}</p></div><div><h4 class="font-bold text-xl text-principal">Ingredientes</h4><div class="flex flex-wrap gap-2 mt-2">${ingredientesHtml}</div></div><div class="text-right pt-2"><span class="text-4xl font-bold text-principal">R$ ${Number(produto.preco).toFixed(2)}</span></div></div>`; const modalInstance = new bootstrap.Modal(modalElement); btnAdicionar.onclick = () => { window.carrinhoFunctions.adicionar(produto); modalInstance.hide(); showAlert(`${produto.nome} adicionado!`); }; modalElement.addEventListener('shown.bs.modal', () => { new Swiper(modalBody.querySelector('.swiper-modal-produto'), { loop: imagensDisponiveis.length > 1 }); }, { once: true }); modalInstance.show(); }

async function finalizarPedido() {
    if (window.carrinhoFunctions.getItens().filter(i => i.id !== 99999).length === 0) { 
        Swal.fire({icon: 'info', title: 'Carrinho Vazio', text: 'Adicione produtos antes de finalizar.', background: '#2c2854', color: '#ffffff'}); 
        return; 
    }
    const dadosFormulario = {
        nome_cliente: document.getElementById('clienteNome').value.trim().toUpperCase(),
        whatsapp_cliente: document.getElementById('clienteWhatsapp').value.trim(),
        forma_pagamento: document.getElementById('clienteFormaPagamento').value,
        rua: document.getElementById('clienteRua').value.trim().toUpperCase(),
        bairro: document.getElementById('clienteBairro').value.trim().toUpperCase(),
        quadra: document.getElementById('clienteQuadra').value.trim().toUpperCase(),
        lote: document.getElementById('clienteLote').value.trim().toUpperCase(),
        referencia: document.getElementById('clienteReferencia').value.trim().toUpperCase(),
        observacoes: document.getElementById('clienteObservacoes').value.trim(),
    };
    if (!/^\d{10,11}$/.test(dadosFormulario.whatsapp_cliente)) {
        Swal.fire({icon: 'warning', title: 'WhatsApp Inválido', text: 'Use um número válido com DDD.', background: '#2c2854', color: '#ffffff'});
        return;
    }
    if (!dadosFormulario.nome_cliente || !dadosFormulario.bairro || !dadosFormulario.forma_pagamento || !dadosFormulario.rua) { 
        Swal.fire({icon: 'warning', title: 'Faltam Dados', text: 'Preencha todos os campos de entrega.', background: '#2c2854', color: '#ffffff'}); 
        return; 
    }
    Swal.fire({ title: 'Confirmando seu pedido...', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });
    
    const pedido = { 
        ...dadosFormulario,
        id_pedido_publico: gerarIdPedidoPublico(),
        itens: window.carrinhoFunctions.getItensParaPedido(), 
        total: window.carrinhoFunctions.getTotal(), 
        origem: 'WHATSAPP'
    };

    try {
        const resultado = await enviarParaN8N(window.N8N_CONFIG.create_order_app, pedido);
        if (resultado.success) {
            localStorage.setItem('pedidoSucessoCliente', 'true');
            localStorage.setItem('novoPedidoAdmin', 'external'); 
            window.carrinhoFunctions.limpar();
            const modal = bootstrap.Modal.getInstance(document.getElementById('enderecoModal'));
            if(modal) modal.hide();
            window.location.href = 'acompanhar.html';
        } else {
            throw new Error(resultado.message || 'Erro desconhecido.');
        }
    } catch (error) {
        Swal.fire({icon: 'error', title: 'Ops!', text: `Tivemos um problema: ${error.message}`, background: '#2c2854', color: '#ffffff'});
    }
}

export async function initClientePage() {
    console.log("Maestro: Página do Cliente - Reconstrução Final com Letreiro.");
    initCarrinho(); 
    // AGORA SÓ PRECISAMOS CHAMAR ESTA FUNÇÃO INTELIGENTE
    await carregarConfiguracoesDaLoja();
    
    document.getElementById('form-endereco')?.addEventListener('submit', (e) => { e.preventDefault(); finalizarPedido(); });
    
    window.clientFunctions = {
        handleAdicionarAoCarrinho: (id) => {
            const produto = produtosDaVitrine.find(p => p.id === id);
            if (produto) { window.carrinhoFunctions.adicionar(produto); showAlert(`${produto.nome} adicionado!`); }
        },
        abrirModalDetalhes: abrirModalDetalhes,
        rolarParaCategoria: (id) => {
            const secao = document.getElementById(`categoria-${id}`);
            if (secao) secao.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };
}