
import { fetchDeN8N } from './api.js';

let lojaConfig = null;
let todosOsProdutos = [];  
let modalDetalhes = null; 

async function getLojaConfig() {
    if (!lojaConfig) {
        try {
            const configs = await fetchDeN8N(window.N8N_CONFIG.get_loja_config);
            if (configs && configs.length > 0) {
                lojaConfig = configs[0];
            }
        } catch (error) {
            console.error("Erro ao buscar configurações da loja:", error);
        }
    }
    return lojaConfig;
}

function renderLogo(containerId) {
    const logoContainer = document.getElementById(containerId);
    if (!logoContainer || !lojaConfig) return;

    logoContainer.classList.remove('animate-pulse');
    if (lojaConfig.logo_vitrine_url) {
        logoContainer.innerHTML = `<img src="${lojaConfig.logo_vitrine_url}" alt="Logo ${lojaConfig.nome_loja}" class="max-h-full w-auto">`;
    } else {
        logoContainer.innerHTML = `<span class="text-3xl font-bold text-principal">${lojaConfig.nome_loja || 'Nosso Cardápio'}</span>`;
    }
}

// ===================================================================
// LÓGICA PARA A PÁGINA DE BOAS-VINDAS (cardapio-mesa.html)
// ===================================================================
export async function initPaginaBoasVindas() {
    await getLojaConfig();
    if (lojaConfig) {
        document.title = `Bem-Vindo a ${lojaConfig.nome_loja}`;
        const saudacaoEl = document.getElementById('saudacao-loja');
        if (saudacaoEl) {
            saudacaoEl.textContent = `Seja bem-vindo(a) ao ${lojaConfig.nome_loja}!`;
        }
        renderLogo('logo-container-mesa');
    }
}

function abrirModalDetalhesMesa(produtoId) {
    const produto = todosOsProdutos.find(p => p.id === produtoId);
    if (!produto) return;

    if (!modalDetalhes) {
        const modalEl = document.getElementById('detalhesProdutoModalMesa');
        if (modalEl) {
            modalDetalhes = new bootstrap.Modal(modalEl);
        } else {
            console.error("Elemento do modal não encontrado!");
            return;
        }
    }
    
    const modalTitle = document.getElementById('detalhesProdutoModalMesaLabel');
    const modalBody = document.getElementById('detalhesProdutoBodyMesa');

    modalTitle.textContent = produto.nome;
    const imagensDisponiveis = produto.imagens_urls && produto.imagens_urls.length > 0 ? produto.imagens_urls : ['https://via.placeholder.com/800x400.png?text=Sem+Imagem'];
    const imagensHtml = imagensDisponiveis.map(url => `<div class="swiper-slide"><img src="${url}" loading="lazy" class="w-full h-64 object-cover rounded-lg"></div>`).join('');
    const ingredientesHtml = (produto.ingredientes && produto.ingredientes.length > 0) ? produto.ingredientes.map(ing => `<span class="bg-fundo px-3 py-1 rounded-full text-sm">${ing}</span>`).join('') : '<p class="text-texto-muted text-sm">Ingredientes não informados.</p>';

    modalBody.innerHTML = `
        <div class="swiper swiper-modal-produto-mesa w-full mb-4 h-64 rounded-lg overflow-hidden">
            <div class="swiper-wrapper">${imagensHtml}</div>
        </div>
        <div class="space-y-4">
            <div>
                <h4 class="font-bold text-xl text-principal">Descrição</h4>
                <p class="text-texto-muted">${produto.descricao || 'Sem descrição para este item.'}</p>
            </div>
            <div>
                <h4 class="font-bold text-xl text-principal">Ingredientes</h4>
                <div class="flex flex-wrap gap-2 mt-2">${ingredientesHtml}</div>
            </div>
            <div class="text-right pt-2">
                <span class="text-4xl font-bold text-principal">R$ ${Number(produto.preco).toFixed(2)}</span>
            </div>
        </div>`;

    modalDetalhes.show();

    const modalEl = document.getElementById('detalhesProdutoModalMesa');
    modalEl.addEventListener('shown.bs.modal', () => {
        new Swiper(modalBody.querySelector('.swiper-modal-produto-mesa'), { loop: imagensDisponiveis.length > 1 });
    }, { once: true });
}

// ===================================================================
// LÓGICA PARA O CARDÁPIO DIGITAL (cardapio-digital.html)
// ===================================================================
export async function initCardapioDigital() {
    window.cardapioMesaFunctions = { abrirModalDetalhesMesa };

    await getLojaConfig();
    if (lojaConfig) {
        document.title = `Cardápio - ${lojaConfig.nome_loja}`;
        renderLogo('logo-header-cardapio');
    }

    const produtosContainer = document.getElementById('lista-produtos-cardapio');
    const categoriasNav = document.querySelector('#nav-categorias div');

    try {
        const [categorias, produtosDoBanco] = await Promise.all([
            fetchDeN8N(window.N8N_CONFIG.get_all_categories),
            fetchDeN8N(window.N8N_CONFIG.get_all_products)
        ]);
        
        todosOsProdutos = produtosDoBanco; // ➕ Guarda os produtos na variável global
        produtosContainer.innerHTML = '';
        categoriasNav.innerHTML = '';

        if (!categorias || categorias.length === 0) {
             produtosContainer.innerHTML = '<p class="text-texto-muted text-center py-20">Nenhuma categoria encontrada.</p>';
             return;
        }

        categorias.forEach(cat => {
            const navLink = document.createElement('a');
            navLink.href = `#cat-${cat.id}`;
            navLink.className = 'nav-categoria py-2 border-b-2 border-transparent transition-all duration-300';
            navLink.textContent = cat.nome;
            navLink.onclick = (e) => {
                e.preventDefault();
                document.querySelector(`#cat-${cat.id}`).scrollIntoView({ behavior: 'smooth' });
            };
            categoriasNav.appendChild(navLink);
        });

        const produtosPorCategoria = todosOsProdutos.reduce((acc, produto) => {
            if (produto.ativo && produto.tipo_item === 'PRODUTO') {
                (acc[produto.categoria_id] = acc[produto.categoria_id] || []).push(produto);
            }
            return acc;
        }, {});

        categorias.forEach(cat => {
            const produtosDaCategoria = produtosPorCategoria[cat.id];
            if (produtosDaCategoria && produtosDaCategoria.length > 0) {
                const section = document.createElement('section');
                section.id = `cat-${cat.id}`;
                section.className = 'pt-6'; 

                let produtosHtml = '';
                produtosDaCategoria.forEach(p => {
                    const imagem = (p.imagens_urls && p.imagens_urls.length > 0) ? p.imagens_urls[0] : 'https://via.placeholder.com/150';
                    produtosHtml += `
                        <div class="flex items-start gap-4 mb-6 cursor-pointer hover:bg-card/50 p-2 rounded-lg transition-colors" onclick="cardapioMesaFunctions.abrirModalDetalhesMesa(${p.id})">
                            <img src="${imagem}" alt="${p.nome}" class="w-24 h-24 rounded-lg object-cover flex-shrink-0">
                            <div class="flex-grow">
                                <h4 class="text-xl font-bold">${p.nome}</h4>
                                <p class="text-texto-muted text-sm mt-1">${p.descricao || ''}</p>
                                <p class="text-2xl font-bold text-principal mt-2">R$ ${Number(p.preco).toFixed(2)}</p>
                            </div>
                        </div>
                    `;
                });

                section.innerHTML = `
                    <h2 class="text-3xl font-bold border-l-4 border-principal pl-4">${cat.nome}</h2>
                    <div class="mt-6">${produtosHtml}</div>
                `;
                produtosContainer.appendChild(section);
            }
        });
        
        window.addEventListener('scroll', handleScrollSpy);

    } catch (error) {
        console.error("Erro ao montar o cardápio digital:", error);
        produtosContainer.innerHTML = '<p class="text-red-500 text-center py-20">Ops! Não foi possível carregar o cardápio.</p>';
    }
}

function handleScrollSpy() {
    const fromTop = window.scrollY + 200; // Offset para ativar antes
    const navLinks = document.querySelectorAll('.nav-categoria');

    navLinks.forEach(link => {
        const section = document.querySelector(link.hash);
        if (section && section.offsetTop <= fromTop && section.offsetTop + section.offsetHeight > fromTop) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}