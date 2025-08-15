
import { supabase } from './supabaseClient.js';
import { fetchDeN8N } from './functions/api.js';

const contentArea = document.getElementById('content-area');
const navLinks = document.querySelectorAll('#admin-sidebar .nav-link');

async function loadPage(pageUrl) {
    if (!contentArea) {
        console.error("Área de conteúdo principal '#content-area' não encontrada.");
        return;
    }
    try {
        contentArea.innerHTML = '<p class="text-center text-xl text-texto-muted animate-pulse p-10">Carregando módulo...</p>';
        const response = await fetch(pageUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        contentArea.innerHTML = html;
        Array.from(contentArea.querySelectorAll("script")).forEach(oldScript => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
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
        contentArea.innerHTML = '<p class="text-red-500 text-center p-10">Ops! Não foi possível carregar este módulo.</p>';
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
        window.location.replace('login.html');
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Ops!', text: 'Não foi possível sair.', background: '#2c2854', color: '#ffffff' });
    }
}

function initDemoMode() {
    if (!window.APP_CONFIG.isDemoMode) return;
    console.log("Gerenciamento: MODO DEMONSTRAÇÃO ATIVO! 🛡️");
    const style = document.createElement('style');
    style.innerHTML = `.btn-demo-disable { opacity: 0.7; cursor: not-allowed !important; }`;
    document.head.appendChild(style);

    document.body.addEventListener('click', (event) => {
        const target = event.target.closest('.btn-demo-disable');
        if (target) {
            event.preventDefault();
            event.stopPropagation();
            Swal.fire({
                icon: 'info',
                title: 'Ação Bloqueada no Modo Demo!',
                html: `
                    <p class="text-texto-muted text-lg leading-relaxed">
                        Para manter a organização, as ações de salvar, editar ou apagar estão desativadas.
                        <br><br>
                        Mas a melhor parte está funcionando! Que tal testar o fluxo completo?
                    </p>
                    <a href="cliente.html" target="_blank" class="swal2-confirm swal2-styled mt-4" style="background-color: #ff6b35; display: inline-block;">
                        <i class="bi bi-eye-fill"></i> Ir para a Vitrine e Fazer um Pedido
                    </a>
                `,
                background: '#2c2854',
                color: '#ffffff',
                showConfirmButton: false
            });
        }
    }, true);
}


document.addEventListener('DOMContentLoaded', async () => {
    initDemoMode();
    try {
        const configs = await fetchDeN8N(window.N8N_CONFIG.get_loja_config);
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