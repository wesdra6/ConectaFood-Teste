import { enviarParaAPI, fetchDeAPI, buscarComPOST } from './api.js';
import { initCarrinho } from './carrinho.js';
import { criaCardProduto } from './components.js';
import { generateAndDisplayQRCode } from './qrCodeHandler.js';
import { API_ENDPOINTS } from '../config.js';

let produtosDaVitrine = [];

const DADOS_CLIENTE_KEY = 'dadosClienteLegalConnect';
const ENDERECO_VALIDADO_KEY = 'enderecoValidadoLegalConnect';

function handleScrollSpy() {
    const fromTop = window.scrollY + (window.innerHeight / 3);
    const secoes = document.querySelectorAll('#vitrine-builder-container section[id^="categoria-"]');
    let secaoAtiva = null;

    secoes.forEach(section => {
        if (section.offsetTop <= fromTop) {
            secaoAtiva = section;
        }
    });

    secoes.forEach(section => {
        const titulo = section.querySelector('h2');
        if (titulo) {
            if (section === secaoAtiva) {
                titulo.classList.add('text-principal');
                titulo.classList.remove('text-texto-base');
            } else {
                titulo.classList.remove('text-principal');
                titulo.classList.add('text-texto-base');
            }
        }
    });
}


function salvarDadosCliente(dados) {
    localStorage.setItem(DADOS_CLIENTE_KEY, JSON.stringify(dados));
}

function carregarDadosCliente() {
    const dadosSalvos = localStorage.getItem(DADOS_CLIENTE_KEY);
    if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos);
        document.getElementById('clienteWhatsapp').value = dados.whatsapp_cliente || '';
        document.getElementById('clienteNome').value = dados.nome_cliente || '';
        document.getElementById('clienteRua').value = dados.rua || '';
        document.getElementById('clienteBairro').value = dados.bairro || '';
        document.getElementById('clienteQuadra').value = dados.quadra || '';
        document.getElementById('clienteLote').value = dados.lote || '';
        document.getElementById('clienteReferencia').value = dados.referencia || '';
        document.getElementById('clienteCep').value = dados.cep || '';
        document.getElementById('lembrar-dados').checked = true;
    }

    const enderecoValidado = JSON.parse(sessionStorage.getItem(ENDERECO_VALIDADO_KEY));
    if (enderecoValidado) {
        document.getElementById('clienteCep').value = enderecoValidado.cep || document.getElementById('clienteCep').value;
        document.getElementById('clienteRua').value = enderecoValidado.logradouro || document.getElementById('clienteRua').value;
        document.getElementById('clienteBairro').value = enderecoValidado.bairro || document.getElementById('clienteBairro').value;
    }
}

function handleAdicionarAoCarrinho(id) {
    const produto = produtosDaVitrine.find(p => p.id === id);
    if (produto) {
        window.carrinhoFunctions.adicionar(produto);
        showAlert(`${produto.nome} adicionado!`);
    }
}

function abrirModalDetalhes(produtoId) {
    const produto = produtosDaVitrine.find(p => p.id === produtoId);
    if (!produto) return;
    const modalElement = document.getElementById('detalhesProdutoModal');
    if (!modalElement) return;
    const modalTitle = modalElement.querySelector('#detalhesProdutoModalLabel');
    const modalBody = modalElement.querySelector('#detalhesProdutoBody');
    const btnAdicionar = modalElement.querySelector('#btn-adicionar-do-modal');
    modalTitle.textContent = produto.nome;
    const imagensDisponiveis = produto.imagens_urls && produto.imagens_urls.length > 0 ? produto.imagens_urls : ['https://via.placeholder.com/800x400.png?text=Sem+Imagem'];
    const imagensHtml = imagensDisponiveis.map(url => `<div class="swiper-slide"><img src="${url}" loading="lazy" class="w-full h-64 object-cover rounded-lg"></div>`).join('');
    const ingredientesHtml = (produto.ingredientes && produto.ingredientes.length > 0) ? produto.ingredientes.map(ing => `<span class="bg-fundo px-3 py-1 rounded-full text-sm">${ing}</span>`).join('') : '<p class="text-texto-muted text-sm">Ingredientes não informados.</p>';
    modalBody.innerHTML = `<div class="swiper swiper-modal-produto w-full mb-4 h-64 rounded-lg overflow-hidden"><div class="swiper-wrapper">${imagensHtml}</div></div><div class="space-y-4"><div><h4 class="font-bold text-xl text-principal">Descrição</h4><p class="text-texto-muted">${produto.descricao || 'Sem descrição para este item.'}</p></div><div><h4 class="font-bold text-xl text-principal">Ingredientes</h4><div class="flex flex-wrap gap-2 mt-2">${ingredientesHtml}</div></div><div class="text-right pt-2"><span class="text-4xl font-bold text-principal">R$ ${Number(produto.preco).toFixed(2)}</span></div></div>`;
    const modalInstance = new bootstrap.Modal(modalElement);
    btnAdicionar.onclick = () => {
        handleAdicionarAoCarrinho(produto.id);
        modalInstance.hide();
    };
    modalElement.addEventListener('shown.bs.modal', () => { new Swiper(modalBody.querySelector('.swiper-modal-produto'), { loop: imagensDisponiveis.length > 1 }); }, { once: true });
    modalInstance.show();
}

function rolarParaCategoria(id) {
    const secao = document.getElementById(`categoria-${id}`);
    if (secao) {
        const headerOffset = 100;
        const elementPosition = secao.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
}

async function finalizarPedido() {
    const tipoPedido = window.carrinhoFunctions.getTipoPedido();
    const itensNoCarrinho = window.carrinhoFunctions.getItens().filter(i => i.id !== 99999);

    if (itensNoCarrinho.length === 0) {
        Swal.fire({ icon: 'info', title: 'Carrinho Vazio', text: 'Adicione produtos antes de finalizar.', background: '#2c2854', color: '#ffffff' });
        return;
    }

    const dadosFormulario = {
        nome_cliente: document.getElementById('clienteNome').value.trim().toUpperCase(),
        whatsapp_cliente: document.getElementById('clienteWhatsapp').value.trim(),
        forma_pagamento: document.getElementById('clienteFormaPagamento').value,
        cep: document.getElementById('clienteCep').value.trim(),
        rua: tipoPedido === 'ENTREGA' ? document.getElementById('clienteRua').value.trim().toUpperCase() : 'RETIRADA',
        bairro: tipoPedido === 'ENTREGA' ? document.getElementById('clienteBairro').value.trim().toUpperCase() : 'RETIRADA',
        quadra: tipoPedido === 'ENTREGA' ? document.getElementById('clienteQuadra').value.trim().toUpperCase() : '-',
        lote: tipoPedido === 'ENTREGA' ? document.getElementById('clienteLote').value.trim().toUpperCase() : '-',
        referencia: tipoPedido === 'ENTREGA' ? document.getElementById('clienteReferencia').value.trim().toUpperCase() : 'RETIRADA NO LOCAL',
        observacoes: document.getElementById('clienteObservacoes').value.trim(),
    };

    if (!/^\d{10,13}$/.test(dadosFormulario.whatsapp_cliente) || !dadosFormulario.nome_cliente || !dadosFormulario.forma_pagamento) {
        Swal.fire({ icon: 'warning', title: 'Faltam Dados', text: 'Preencha seu nome, WhatsApp (com DDD) e a forma de pagamento.', background: '#2c2854', color: '#ffffff' });
        return;
    }

    if (tipoPedido === 'ENTREGA' && (!dadosFormulario.rua || !dadosFormulario.bairro || !dadosFormulario.cep)) {
        Swal.fire({ icon: 'warning', title: 'Faltam Dados', text: 'Preencha todos os campos de endereço, incluindo o CEP.', background: '#2c2854', color: '#ffffff' });
        return;
    }

    if (tipoPedido === 'ENTREGA' && (!dadosFormulario.quadra || !dadosFormulario.lote || !dadosFormulario.referencia)) {
        const { isConfirmed } = await Swal.fire({
            icon: 'question',
            title: 'Endereço Incompleto?',
            html: `Percebemos que os campos de <strong>Quadra, Lote ou Referência</strong> não foram preenchidos. <br><br>Isso ajuda muito o entregador. Deseja continuar mesmo assim?`,
            background: '#2c2854',
            color: '#ffffff',
            showCancelButton: true,
            confirmButtonColor: '#ff6b35',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sim, continuar',
            cancelButtonText: 'Vou preencher'
        });
        if (!isConfirmed) {
            return;
        }
    }

    const lembrar = document.getElementById('lembrar-dados').checked;
    if (lembrar) {
        if (tipoPedido === 'RETIRADA') {
            const dadosParaSalvar = {
                whatsapp_cliente: dadosFormulario.whatsapp_cliente,
                nome_cliente: dadosFormulario.nome_cliente,
                cep: document.getElementById('clienteCep').value,
                rua: document.getElementById('clienteRua').value,
                bairro: document.getElementById('clienteBairro').value,
                quadra: document.getElementById('clienteQuadra').value,
                lote: document.getElementById('clienteLote').value,
                referencia: document.getElementById('clienteReferencia').value
            };
            salvarDadosCliente(dadosParaSalvar);
        } else {
            salvarDadosCliente(dadosFormulario);
        }
    } else {
        localStorage.removeItem(DADOS_CLIENTE_KEY);
    }

    Swal.fire({ title: 'Confirmando seu pedido...', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });

    const origemPedido = tipoPedido === 'ENTREGA' ? 'WHATSAPP' : 'RETIRADA';

    const pedido = {
        ...dadosFormulario,
        id_pedido_publico: gerarIdPedidoPublico(),
        itens: window.carrinhoFunctions.getItensParaPedido(),
        total: window.carrinhoFunctions.getTotal(),
        origem: origemPedido
    };

    try {
        const resultado = await enviarParaAPI(API_ENDPOINTS.create_order_app, pedido);
        if (resultado.success) {
            localStorage.setItem('pedidoSucessoCliente', 'true');
            sessionStorage.removeItem(ENDERECO_VALIDADO_KEY);
            window.carrinhoFunctions.limpar();
            const modal = bootstrap.Modal.getInstance(document.getElementById('enderecoModal'));
            if (modal) modal.hide();
            window.location.href = 'acompanhar.html';
        } else {
            throw new Error(resultado.message || 'Erro desconhecido.');
        }
    } catch (error) {
        console.error("Erro ao finalizar pedido do cliente, tratado globalmente:", error);
    }
}

function gerarIdPedidoPublico() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012243456789';
    let resultado = '';
    for (let i = 0; i < 6; i++) {
        resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return resultado;
}

function renderizarBanners(banners) {
    const bannersAtivos = banners.filter(b => b.ativo);
    if (bannersAtivos.length === 0) return null;

    const slidesHtml = bannersAtivos.map(banner => `
        <div class="swiper-slide">
            <a href="${banner.link_ancora || '#'}" class="block w-full h-full" aria-label="Banner promocional">
                <img src="${banner.url_imagem}" loading="lazy" class="w-full h-full object-cover" alt="Banner Promocional">
            </a>
        </div>`).join('');

    const container = document.createElement('section');
    container.className = 'mb-12';

    container.innerHTML = `<div class="swiper swiper-banners relative aspect-video h-auto rounded-2xl overflow-hidden"><div class="swiper-wrapper">${slidesHtml}</div></div>`;
    return container;
}

function renderizarIconesCategoria(categorias) {
    if (categorias.length === 0) return null;
    const container = document.createElement('section');
    container.className = 'mb-12';
    const slidesHtml = categorias.map(cat => `<div class="swiper-slide !w-auto"><a href="#categoria-${cat.id}" onclick="event.preventDefault(); clientFunctions.rolarParaCategoria('${cat.id}')" class="nav-categoria group flex flex-col items-center space-y-2 cursor-pointer text-center"><div class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center transition-colors" style="background-color: ${cat.cor_fundo || '#38326b'};">${cat.url_icone ? `<img src="${cat.url_icone}" alt="${cat.nome}" loading="lazy" class="w-10 h-10 sm:w-12 sm:h-12 object-contain group-hover:scale-110 transition-transform">` : `<i class="bi bi-tag-fill text-3xl sm:text-4xl group-hover:scale-110 transition-transform"></i>`}</div><span class="font-semibold text-xs sm:text-sm text-texto-base group-hover:text-principal transition-colors">${cat.nome}</span></a></div>`).join('');
    container.innerHTML = `<h2 class="text-2xl font-bold mb-2">Categorias</h2><div class="swiper swiper-categorias relative"><div class="swiper-wrapper py-2">${slidesHtml}</div></div>`;
    return container;
}

function renderizarProdutosPorCategoria(produtos, categorias) {
    if (produtos.length === 0 || categorias.length === 0) return [];

    const produtosAgrupados = produtos.reduce((acc, p) => {
        (acc[p.categoria_id] = acc[p.categoria_id] || []).push(p);
        return acc;
    }, {});

    return categorias.map(cat => {
        const produtosDaCategoria = produtosAgrupados[cat.id];
        if (!produtosDaCategoria || produtosDaCategoria.length === 0) return null;

        const section = document.createElement('section');
        section.id = `categoria-${cat.id}`;
        section.className = 'space-y-4 pt-8';

        const swiperWrapper = document.createElement('div');
        swiperWrapper.className = 'swiper-wrapper';

        produtosDaCategoria.forEach(p => {
            const cardProduto = criaCardProduto(p, 'cliente');
            if (cardProduto) {
                const swiperSlide = document.createElement('div');
                swiperSlide.className = 'swiper-slide !w-72 h-auto';
                swiperSlide.appendChild(cardProduto);
                swiperWrapper.appendChild(swiperSlide);
            }
        });

        section.innerHTML = `<h2 class="text-3xl font-bold border-l-4 border-principal pl-4 text-texto-base transition-colors duration-300">${cat.nome}</h2><div class="swiper swiper-produtos relative py-4"></div>`;
        section.querySelector('.swiper-produtos').appendChild(swiperWrapper);

        return section;
    }).filter(Boolean);
}


function iniciarSliders() {
    const bannerSwiperEl = document.querySelector('.swiper-banners');
    if (bannerSwiperEl) new Swiper(bannerSwiperEl, { loop: bannerSwiperEl.querySelectorAll('.swiper-slide').length > 1, autoplay: { delay: 4000, disableOnInteraction: false }, effect: 'slide' });
    const categoriasSwiperEl = document.querySelector('.swiper-categorias');
    if (categoriasSwiperEl) new Swiper(categoriasSwiperEl, { slidesPerView: 'auto', spaceBetween: 24 });
    document.querySelectorAll('.swiper-produtos').forEach(el => new Swiper(el, { slidesPerView: 'auto', spaceBetween: 16 }));
}

function showAlert(message, type = 'success') {
    const container = document.getElementById('alert-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    let iconClass = 'bi-check-circle-fill text-green-400';
    if (type === 'error') iconClass = 'bi-x-circle-fill text-red-400';
    else if (type === 'info') iconClass = 'bi-info-circle-fill text-blue-400';
    toast.innerHTML = `<i class="bi ${iconClass} text-2xl"></i><span class="font-semibold">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); toast.addEventListener('transitionend', () => toast.remove()); }, 2500);
}

function mostrarCardapio() {
    document.getElementById('cep-gate-container').classList.add('hidden');
    document.getElementById('vitrine-builder-container').classList.remove('hidden');
    fetchDadosDaVitrine();
}

async function handleCepValidation() {
    const cepInput = document.getElementById('cep-input');
    const cep = cepInput.value.replace(/\D/g, '');

    if (cep.length !== 8) {
        Swal.fire({ icon: 'warning', title: 'CEP Inválido', text: 'Por favor, digite um CEP com 8 números.', background: '#2c2854', color: '#ffffff' });
        return;
    }

    Swal.fire({ title: 'Verificando seu endereço...', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });

    try {
        const resultado = await buscarComPOST(API_ENDPOINTS.endereco_validar_raio, { cep });
        
        const dadosResposta = resultado; 

        if (dadosResposta && dadosResposta.entrega_disponivel) {
            Swal.close();
            sessionStorage.setItem(ENDERECO_VALIDADO_KEY, JSON.stringify(dadosResposta.endereco));
            mostrarCardapio();
        } else {
            const configs = await fetchDeAPI(API_ENDPOINTS.get_loja_config);
            const habilitar_retirada = configs[0]?.habilitar_retirada || false;
            
            let html = '<p>Que pena! No momento, não entregamos na sua região.</p>';
            if (habilitar_retirada) {
                html += '<p class="mt-4">Mas você ainda pode fazer seu pedido e retirar em nosso endereço. Que tal?</p>';
            }

            Swal.fire({
                icon: 'info',
                title: 'Fora da Área de Entrega',
                html: html,
                background: '#2c2854',
                color: '#ffffff'
            });
        }
    } catch (error) {
        console.error("Erro ao validar CEP, tratado globalmente na api.js:", error);
    }
}

async function fetchDadosDaVitrine() {
    const container = document.getElementById('vitrine-builder-container');
    if (!container) return;
    container.innerHTML = '<p class="text-texto-muted text-center py-10 text-xl animate-pulse">Montando nosso cardápio pra você... 👨‍🍳</p>';

    try {
        const [categorias, banners, produtos] = await Promise.all([
            fetchDeAPI(API_ENDPOINTS.get_all_categories),
            fetchDeAPI(API_ENDPOINTS.get_all_banners),
            fetchDeAPI(API_ENDPOINTS.get_all_products)
        ]);
        produtosDaVitrine = produtos || [];

        const idsCategoriasComProdutos = new Set(
            produtosDaVitrine
                .filter(p => p.ativo && p.tipo_item === 'PRODUTO' && p.categoria_id)
                .map(p => p.categoria_id)
        );

        const categoriasComProdutos = (categorias || []).filter(cat => idsCategoriasComProdutos.has(cat.id));

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        const bannersEl = renderizarBanners(banners || []);
        if (bannersEl) fragment.appendChild(bannersEl);

        const categoriasEl = renderizarIconesCategoria(categoriasComProdutos);
        if (categoriasEl) fragment.appendChild(categoriasEl);

        const secoesDeProdutos = renderizarProdutosPorCategoria(produtosDaVitrine, categoriasComProdutos);
        secoesDeProdutos.forEach(secao => fragment.appendChild(secao));

        container.appendChild(fragment);

        if (!bannersEl && !categoriasEl && secoesDeProdutos.length === 0) {
            container.innerHTML = `<div class="text-center py-20"><i class="bi bi-shop-window text-6xl text-texto-muted"></i><h2 class="text-3xl font-bold mt-4">Nossa cozinha está fechada.</h2><p class="text-lg text-texto-muted mt-2">Volte mais tarde!</p></div>`;
        }

        iniciarSliders();
        handleScrollSpy();
    } catch (error) {
        console.error("Falha CRÍTICA ao buscar dados da vitrine:", error);
        container.innerHTML = '<p class="text-red-500 text-center py-10 text-xl">Ops! Não conseguimos carregar o cardápio.</p>';
    }
}

async function carregarConfiguracoesDaLoja() {
    const container = document.getElementById('vitrine-builder-container');
    const badge = document.getElementById('status-loja-badge');

    try {
        const configs = await fetchDeAPI(API_ENDPOINTS.get_loja_config);
        if (configs && configs.length > 0) {
            const { nome_loja, logo_vitrine_url, taxa_entrega_fixa, loja_aberta, pedido_minimo_delivery, habilitar_retirada, raio_entrega_km } = configs[0];
            const logoContainer = document.getElementById('logo-vitrine-container');

            if (logoContainer) {
                document.title = nome_loja || 'Nosso Cardápio';
                logoContainer.innerHTML = logo_vitrine_url
                    ? `<img src="${logo_vitrine_url}" alt="${nome_loja}" class="max-h-20 w-auto">`
                    : `<span class="text-2xl font-bold text-principal">${nome_loja}</span>`;
            }

            if (window.carrinhoFunctions && typeof window.carrinhoFunctions.setValoresConfig === 'function') {
                window.carrinhoFunctions.setValoresConfig({
                    minimo: pedido_minimo_delivery,
                    taxa: taxa_entrega_fixa
                });
            } else {
                console.error("Erro crítico: carrinhoFunctions não foi inicializado a tempo.");
            }

            const seletorTipoPedido = document.getElementById('seletor-tipo-pedido');
            if (seletorTipoPedido && habilitar_retirada === true) {
                seletorTipoPedido.classList.remove('hidden');
            }

            if (loja_aberta) {
                if (badge) {
                    badge.innerHTML = `<span>ABERTO</span> <i class="bi bi-lightning-charge-fill"></i>`;
                    badge.className = 'px-3 py-1 rounded-full text-sm font-bold text-white bg-green-500 animate-pulse';
                }
                
                const enderecoValidado = sessionStorage.getItem(ENDERECO_VALIDADO_KEY);
                const isDeliveryEnabled = raio_entrega_km > 0;

                if (isDeliveryEnabled && !enderecoValidado) {
                    document.getElementById('cep-gate-container').classList.remove('hidden');
                    document.getElementById('vitrine-builder-container').classList.add('hidden');
                } else {
                    mostrarCardapio();
                }

            } else {
                if (badge) {
                    badge.innerHTML = `<span>FECHADO</span> <i class="bi bi-moon-stars-fill"></i>`;
                    badge.className = 'px-3 py-1 rounded-full text-sm font-bold text-white bg-red-600';
                }
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
        if (container) container.innerHTML = '<p class="text-red-500 text-center py-10 text-xl">Ops! Tivemos um problema de conexão.</p>';
    }
}

export async function initClientePage() {
    console.log("Maestro: Página do Cliente - Estratégia 'De Cima para Baixo' ativada.");

    initCarrinho();

    window.clientFunctions = {
        handleAdicionarAoCarrinho,
        abrirModalDetalhes,
        rolarParaCategoria
    };

    document.getElementById('form-endereco')?.addEventListener('submit', (e) => {
        e.preventDefault();
        finalizarPedido();
    });

    document.getElementById('btn-verificar-cep')?.addEventListener('click', handleCepValidation);
    document.getElementById('cep-input')?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleCepValidation();
    });

    window.addEventListener('scroll', handleScrollSpy);

    const modalEndereco = document.getElementById('enderecoModal');
    if (modalEndereco) {
        modalEndereco.addEventListener('show.bs.modal', () => {
            carregarDadosCliente();
            const tipoPedido = window.carrinhoFunctions.getTipoPedido();
            const containerEndereco = document.getElementById('container-campos-endereco');
            const camposEndereco = ['clienteRua', 'clienteBairro', 'clienteQuadra', 'clienteLote', 'clienteReferencia'];

            if (tipoPedido === 'RETIRADA') {
                containerEndereco.classList.add('hidden');
                camposEndereco.forEach(id => document.getElementById(id).required = false);
                document.getElementById('enderecoModalLabel').textContent = "Confirmar Pedido para Retirada";
            } else {
                containerEndereco.classList.remove('hidden');
                camposEndereco.forEach(id => document.getElementById(id).required = true);
                document.getElementById('enderecoModalLabel').textContent = "Quase lá! Onde entregamos?";
            }
        });
    }

    await carregarConfiguracoesDaLoja();

    generateAndDisplayQRCode('qrcode-desktop');
}