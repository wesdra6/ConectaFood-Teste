import { supabase } from './supabaseClient.js';
import { fetchDeAPI, enviarParaAPI } from './functions/api.js';
import { API_ENDPOINTS } from './config.js';

const contentArea = document.getElementById('content-area');
const navLinks = document.querySelectorAll('#admin-sidebar .nav-link');

const modulos = {
    'financeiro.html': () => import('./financeiro.js').then(m => m.initFinanceiroPage()),
    'garcons-admin.html': () => import('./garcons-admin.js').then(m => m.initGarconsAdminPage()),
    'hub-integracao.html': () => import('./functions/hub-integracao.js').then(m => m.initHubIntegracaoPage()),
    'precificacao.html': () => import('./precificacao.js').then(m => m.initPrecificacaoPage()),
    'rentabilidade.html': () => import('./rentabilidade.js').then(m => m.initRentabilidadePage()),
    'estoque.html': () => import('./estoque.js').then(m => m.initEstoquePage()),
    'custos.html': () => import('./custos.js').then(m => m.initCustosPage()),
};

async function loadPage(pageUrl) {
    if (!contentArea) {
        console.error("Área de conteúdo principal '#content-area' não encontrada.");
        return;
    }

    try {
        contentArea.innerHTML = '<p class="text-center text-xl text-texto-muted animate-pulse p-10">Carregando módulo...</p>';
        
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
        await enviarParaAPI(API_ENDPOINTS.registrar_logout, {});
        sessionStorage.removeItem('userRole');
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.replace('./login.html');
    } catch (error) {
        console.error("Erro no processo de logout:", error);
        sessionStorage.clear();
        window.location.replace('./login.html');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Verificação de sessão básica. A lógica de role foi removida.
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.replace('login.html');
            return;
        }
        // Apenas para garantir que a role está na sessão para os módulos internos
        if (!sessionStorage.getItem('userRole')) {
             const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

            if (profileError) throw profileError;
            if (!profileData) throw new Error('Perfil de usuário não encontrado.');
            sessionStorage.setItem('userRole', profileData.role);
        }
        console.log(`VIGIA do Gerenciamento: Sessão OK. Carregando...`);

    } catch (error) {
        console.error("Falha na verificação de sessão do Gerenciamento:", error);
        await handleLogout();
        return;
    }

    // O resto da inicialização continua normal
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