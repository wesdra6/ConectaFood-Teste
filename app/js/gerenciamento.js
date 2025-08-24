// REESCREVA O ARQUIVO COMPLETO: js/gerenciamento.js

import { supabase } from './supabaseClient.js';
import { fetchDeAPI } from './functions/api.js';
import { API_ENDPOINTS } from './config.js';

const contentArea = document.getElementById('content-area');
const navLinks = document.querySelectorAll('#admin-sidebar .nav-link');

const modulos = {
    'financeiro.html': () => import('./financeiro.js').then(m => m.initFinanceiroPage()),
    'garcons-admin.html': () => import('./garcons-admin.js').then(m => m.initGarconsAdminPage()),
    'hub-integracao.html': () => import('./functions/hub-integracao.js').then(m => m.initHubIntegracaoPage()),
    'precificacao.html': () => import('./precificacao.js').then(m => m.initPrecificacaoPage()),
    'rentabilidade.html': () => import('./rentabilidade.js').then(m => m.initRentabilidadePage()),
};

async function loadPage(pageUrl) {
    if (!contentArea) {
        console.error("Área de conteúdo principal '#content-area' não encontrada.");
        return;
    }

    try {
        contentArea.innerHTML = '<p class="text-center text-xl text-texto-muted animate-pulse p-10">Carregando módulo...</p>';
        
        // ✅ CORREÇÃO AQUI: O caminho agora aponta para a raiz do servidor
        // O servidor de desenvolvimento (Live Server) serve a pasta /app/ como raiz
        const response = await fetch(`./${pageUrl}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        contentArea.innerHTML = html;

        if (modulos[pageUrl]) {
            await modulos[pageUrl]();
            console.log(`Maestro do Hub: Módulo '${pageUrl}' carregado e inicializado com sucesso! 🚀`);
        } else {
            console.warn(`Nenhum módulo JS de inicialização encontrado para '${pageUrl}'.`);
        }

        const pageName = pageUrl.replace('.html', '');
        history.pushState({ page: pageUrl }, '', `?view=${pageName}`);

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageUrl) {
                link.classList.add('active');
            }
        });

    } catch (error) {
        console.error('Erro ao carregar a página:', error);
        contentArea.innerHTML = `<p class="text-red-500 text-center p-10">Ops! Não foi possível carregar este módulo.</p>`;
    }
}

window.loadPage = loadPage;

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

async function handleLogout() {
    Swal.fire({ title: 'Saindo...', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.replace('./login.html');
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Ops!', text: 'Não foi possível sair.', background: '#2c2854', color: '#ffffff' });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configs = await fetchDeAPI(API_ENDPOINTS.get_loja_config);
        if (configs && configs.length > 0) {
            atualizarLogoHub(configs[0].logo_vitrine_url, configs[0].nome_loja);
        }
    } catch (error) {
        console.error("Não foi possível carregar a logo do hub.", error);
    }
    
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('menu-overlay');
    const closeMenu = () => { if(sidebar) sidebar.classList.add('-translate-x-full'); if(overlay) overlay.classList.add('hidden'); };
    const openMenu = () => { if(sidebar) sidebar.classList.remove('-translate-x-full'); if(overlay) overlay.classList.remove('hidden'); };
    
    document.getElementById('btn-mobile-menu')?.addEventListener('click', openMenu);
    document.getElementById('btn-close-menu')?.addEventListener('click', closeMenu);
    document.getElementById('menu-overlay')?.addEventListener('click', closeMenu);
    document.getElementById('btn-logout')?.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                closeMenu();
            }
        });
    });

    const params = new URLSearchParams(window.location.search);
    const initialPage = params.get('view') ? `${params.get('view')}.html` : 'financeiro.html';
    loadPage(initialPage);
});

window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page) {
        loadPage(event.state.page);
    } else {
        loadPage('financeiro.html');
    }
});