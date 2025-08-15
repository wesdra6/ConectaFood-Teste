// NOVO ARQUIVO: app/js/gerenciamento.js

// Importa funções globais que podem ser necessárias no hub
import { supabase } from './supabaseClient.js';
import { fetchDeN8N } from './functions/api.js';

const contentArea = document.getElementById('content-area');
const navLinks = document.querySelectorAll('#admin-sidebar .nav-link'); // Busca na sidebar correta

/**
 * Carrega dinamicamente o conteúdo de uma página e o injeta na área principal.
 * @param {string} pageUrl - O caminho do arquivo HTML a ser carregado.
 */
async function loadPage(pageUrl) {
    if (!contentArea) {
        console.error("Área de conteúdo principal '#content-area' não encontrada.");
        return;
    }

    try {
        // Mostra um feedback visual de carregamento
        contentArea.innerHTML = '<p class="text-center text-xl text-texto-muted animate-pulse p-10">Carregando módulo...</p>';
        
        const response = await fetch(pageUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        contentArea.innerHTML = html;

        // Re-executa os scripts do conteúdo carregado para que a página ganhe vida
        Array.from(contentArea.querySelectorAll("script")).forEach(oldScript => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });

        // Atualiza a URL na barra de endereço
        const pageName = pageUrl.replace('.html', '');
        history.pushState({ page: pageUrl }, '', `?view=${pageName}`);

        // Atualiza o link ativo na sidebar
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageUrl) {
                link.classList.add('active');
            }
        });

    } catch (error) {
        console.error('Erro ao carregar a página:', error);
        contentArea.innerHTML = '<p class="text-red-500 text-center p-10">Ops! Não foi possível carregar este módulo.</p>';
    }
}

// Expõe a função globalmente para ser chamada pelo 'onclick' no HTML
window.loadPage = loadPage;

/**
 * Função para atualizar a logo no header do hub.
 * @param {string} url - A URL da imagem da logo.
 * @param {string} nomeLoja - O nome da loja para fallback.
 */
function atualizarLogoHub(url, nomeLoja) {
    const logoDesktop = document.getElementById('logo-header-desktop');
    const logoMobile = document.getElementById('logo-header-mobile');
    const fallbackDesktop = `<span class="text-3xl font-bold text-principal">${nomeLoja || 'Gerenciamento'}</span>`;
    const fallbackMobile = `<span class="text-2xl font-bold text-principal">${nomeLoja || 'Gerenciamento'}</span>`;
    
    if (url) {
        const imgHtml = `<img src="${url}" alt="${nomeLoja || 'Logo'}" class="max-h-20 w-auto">`;
        if (logoDesktop) logoDesktop.innerHTML = imgHtml;
        if (logoMobile) logoMobile.innerHTML = imgHtml;
    } else {
        if (logoDesktop) logoDesktop.innerHTML = fallbackDesktop;
        if (logoMobile) logoMobile.innerHTML = fallbackMobile;
    }
}

/**
 * Lida com o processo de logout.
 */
async function handleLogout() {
    Swal.fire({ title: 'Saindo...', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.replace('login.html');
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Ops!', text: 'Não foi possível sair.', background: '#2c2854', color: '#ffffff' });
    }
}

// --- PONTO DE ENTRADA DO HUB ---
document.addEventListener('DOMContentLoaded', async () => {
    // Carrega a logo da loja
    try {
        const configs = await fetchDeN8N(window.N8N_CONFIG.get_loja_config);
        if (configs && configs.length > 0) {
            atualizarLogoHub(configs[0].logo_vitrine_url, configs[0].nome_loja);
        }
    } catch (error) {
        console.error("Não foi possível carregar a logo do hub.", error);
    }
    
    // Configura os botões do menu mobile e logout
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('menu-overlay');
    const closeMenu = () => { if(sidebar) sidebar.classList.add('-translate-x-full'); if(overlay) overlay.classList.add('hidden'); };
    const openMenu = () => { if(sidebar) sidebar.classList.remove('-translate-x-full'); if(overlay) overlay.classList.remove('hidden'); };
    
    document.getElementById('btn-mobile-menu')?.addEventListener('click', openMenu);
    document.getElementById('btn-close-menu')?.addEventListener('click', closeMenu);
    document.getElementById('menu-overlay')?.addEventListener('click', closeMenu);
    document.getElementById('btn-logout')?.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });

    // Adiciona evento de fechar menu ao clicar em um link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                closeMenu();
            }
        });
    });

    // Carrega a página inicial com base na URL ou define um padrão
    const params = new URLSearchParams(window.location.search);
    const initialPage = params.get('view') ? `${params.get('view')}.html` : 'financeiro.html';
    loadPage(initialPage);
});

// Lida com os botões "voltar" e "avançar" do navegador
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page) {
        loadPage(event.state.page);
    } else {
        // Se não houver estado, carrega a página padrão
        loadPage('financeiro.html');
    }
});