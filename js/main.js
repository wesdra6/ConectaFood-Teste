// REESCREVA O ARQUIVO COMPLETO: js/main.js

import { supabase } from './supabaseClient.js';

console.log("Maestro: Iniciando com calma e sabedoria.");

const VIGIA_RATE_MS = 5000;
let audioContextDesbloqueado = false;
let vigiaInterval = null;
const viewModulePaths = {
    'dashboard': './functions/admin.js',
    'meus-produtos': './functions/admin.js',
    'pedidos': './functions/pedidos.js',
    'caixa': './functions/caixa.js',
    'configuracoes': './functions/configuracoes.js',
    'cliente': './functions/cliente.js',
    'acompanhar': './functions/acompanhar.js',
    'garcom-login': './functions/garcom.js',
    'garcom-mesas': './functions/garcom.js'
};

async function navigateTo(view, params = {}) { 
    document.querySelectorAll('.view-container').forEach(v => v.classList.add('hidden'));
    const containerId = `${view}-page`;
    const container = document.getElementById(containerId);
    if (container) {
        container.classList.remove('hidden');
    } else {
        document.getElementById('dashboard-page').classList.remove('hidden');
        view = 'dashboard';
    }
    document.querySelectorAll('.nav-link, .nav-link-button').forEach(btn => btn.classList.remove('active'));
    const activeLink = document.getElementById(`nav-${view}`);
    if (activeLink) activeLink.classList.add('active');
    const modulePath = viewModulePaths[view];
    if (modulePath) {
        try {
            const module = await import(modulePath);
            const initParams = { view, ...params };
            if (view === 'dashboard' || view === 'meus-produtos') {
                if (typeof module.initAdminPage === 'function') await module.initAdminPage(initParams);
            } else if (view === 'pedidos') {
                if (typeof module.initPedidosPage === 'function') await module.initPedidosPage();
            } else if (view === 'caixa') {
                if (typeof module.initCaixaPage === 'function') await module.initCaixaPage();
            } else if (view === 'configuracoes') {
                if (typeof module.initConfiguracoesPage === 'function') await module.initConfiguracoesPage();
            }
        } catch(err) {
            console.error(`Erro ao carregar módulo para a view '${view}':`, err);
        }
    }
}
async function handleLogout() {
    Swal.fire({ title: 'Saindo...', text: 'Aguarde um momento.', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        if (vigiaInterval) clearInterval(vigiaInterval);
        window.location.replace('login.html');
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Ops!', text: 'Não foi possível sair.', background: '#2c2854', color: '#ffffff' });
    }
}
function atualizarLogoPainel(url, nomeLoja) {
    const logoDesktopContainer = document.getElementById('logo-header-desktop');
    const logoMobileContainer = document.getElementById('logo-header-mobile');
    const fallbackHtmlDesktop = `<span class="text-3xl font-bold text-principal">${nomeLoja || 'LegalConnect'}</span>`;
    const fallbackHtmlMobile = `<span class="text-2xl font-bold text-principal">${nomeLoja || 'LegalConnect'}</span>`;
    if (url) {
        const imgDesktopHtml = `<img src="${url}" alt="${nomeLoja || 'Logo'}" class="max-h-20 w-auto">`;
        const imgMobileHtml = `<img src="${url}" alt="${nomeLoja || 'Logo'}" class="max-h-20 w-auto">`;
        if (logoDesktopContainer) logoDesktopContainer.innerHTML = imgDesktopHtml;
        if (logoMobileContainer) logoMobileContainer.innerHTML = imgMobileHtml;
    } else {
        if (logoDesktopContainer) logoDesktopContainer.innerHTML = fallbackHtmlDesktop;
        if (logoMobileContainer) logoMobileContainer.innerHTML = fallbackHtmlMobile;
    }
}
async function fetchAndSetLogo() {
    try {
        const {fetchDeN8N} = await import('./functions/api.js');
        const configs = await fetchDeN8N(window.N8N_CONFIG.get_loja_config);
        if (configs && configs.length > 0) {
            const { logo_vitrine_url, nome_loja } = configs[0];
            atualizarLogoPainel(logo_vitrine_url, nome_loja);
        }
    } catch (error) {
        console.error("Não foi possível carregar a logo do painel.", error);
    }
}
function tocarNotificacao() {
    if (!audioContextDesbloqueado) {
        console.warn("Contexto de áudio não desbloqueado. O som da notificação pode não tocar.");
        return;
    }
    const sound = document.getElementById('notification-sound');
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.error("Erro ao tocar som:", e));
    }
}
function unlockAudio() {
    if (audioContextDesbloqueado) return;
    const audio = document.getElementById('notification-sound');
    if (audio) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                audio.pause(); audio.currentTime = 0; audioContextDesbloqueado = true;
                console.log("Áudio desbloqueado com sucesso! 🔊");
                document.body.removeEventListener('click', unlockAudio);
                document.body.removeEventListener('keydown', unlockAudio);
            }).catch(error => console.log("Desbloqueio de áudio adiado. Aguardando interação do usuário."));
        }
    }
}
function iniciarVigiaDePedidos() {
    if (vigiaInterval) clearInterval(vigiaInterval);

    vigiaInterval = setInterval(() => {
        const tipoDeAlerta = localStorage.getItem('novoPedidoAdmin');
        if (!tipoDeAlerta) return;

        localStorage.removeItem('novoPedidoAdmin');

        window.dispatchEvent(new CustomEvent('novoPedidoRecebido', {
            detail: { tipo: tipoDeAlerta }
        }));

        if (tipoDeAlerta === 'external') {
            tocarNotificacao();
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Novo pedido na área!',
                showConfirmButton: false,
                timer: 4000,
                background: '#38326b',
                color: '#ffffff'
            });
        }
    }, VIGIA_RATE_MS);
}


document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-sidebar')) {
        // --- MODO PAINEL ADMIN ---
        console.log("Detectado: Painel Admin. Iniciando modo SPA.");
        
        fetchAndSetLogo();
        iniciarVigiaDePedidos();
        document.body.addEventListener('click', unlockAudio, { once: true });
        document.body.addEventListener('keydown', unlockAudio, { once: true });
        
        let currentView = new URLSearchParams(window.location.search).get('view') || 'dashboard';

        const sidebar = document.getElementById('admin-sidebar');
        const overlay = document.getElementById('menu-overlay');
        const closeMenu = () => { sidebar.classList.add('-translate-x-full'); overlay.classList.add('hidden'); };
        const openMenu = () => { sidebar.classList.remove('-translate-x-full'); overlay.classList.remove('hidden'); };
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const url = new URL(link.href);
                const view = url.searchParams.get('view') || 'dashboard';
                history.pushState({ view }, '', url.pathname + `?view=${view}`);
                navigateTo(view);
                closeMenu();
            });
        });

        const btnAbrirModalProduto = document.getElementById('btn-abrir-modal-produto');
        if (btnAbrirModalProduto) {
            btnAbrirModalProduto.addEventListener('click', async () => {
                document.querySelectorAll('.nav-link, .nav-link-button').forEach(btn => btn.classList.remove('active'));
                btnAbrirModalProduto.classList.add('active');
                closeMenu();
                try {
                    const module = await import('./functions/admin.js');
                    await module.initAdminPage({ view: 'meus-produtos' }); 
                    if (window.adminFunctions && typeof window.adminFunctions.abrirModalParaCriar === 'function') {
                        window.adminFunctions.abrirModalParaCriar();
                    }
                } catch(err) {
                    console.error("Erro ao carregar módulo admin para abrir modal:", err);
                }
            });
        }

        window.addEventListener('popstate', (e) => {
            const state = e.state || {};
            navigateTo(state.view || 'dashboard', state.params || {});
        });

        navigateTo(currentView, {});

        const openBtn = document.getElementById('btn-mobile-menu');
        const closeBtn = document.getElementById('btn-close-menu');
        
        if(openBtn) openBtn.addEventListener('click', openMenu);
        if(closeBtn) closeBtn.addEventListener('click', closeMenu);
        if(overlay) overlay.addEventListener('click', closeMenu);

        document.getElementById('btn-logout').addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });

    } else {
        // --- MODO PÁGINA PÚBLICA (CLIENTE, ACOMPANHAR E AGORA, GARÇOM) ---
        console.log("Detectado: Página Pública ou Módulo Externo. Iniciando modo simples.");
        
        requestAnimationFrame(async () => {
            const pageName = window.location.pathname.split('/').pop().replace('.html', '');
            
            if (pageName && viewModulePaths[pageName]) {
                const modulePath = viewModulePaths[pageName];
                try {
                    const module = await import(modulePath);
                    const functionName = `init${pageName.replace(/-(\w)/g, (match, letter) => letter.toUpperCase()).charAt(0).toUpperCase() + pageName.replace(/-(\w)/g, (match, letter) => letter.toUpperCase()).slice(1)}Page`;
                    if (typeof module[functionName] === 'function') {
                        await module[functionName]();
                        console.log(`Módulo '${pageName}' finalizou a inicialização.`);
                    } else {
                        console.warn(`Função de inicialização '${functionName}' não encontrada no módulo '${modulePath}'.`);
                    }
                } catch(err) {
                    console.error(`Erro ao carregar módulo para a página '${pageName}':`, err);
                }
            }
        });
    }
});