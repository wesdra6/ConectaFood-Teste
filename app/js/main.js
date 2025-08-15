
import { supabase } from './supabaseClient.js';

console.log("Maestro: Iniciando com calma e sabedoria.");

const VIGIA_RATE_MS = 5000;
let audioContextDesbloqueado = false;
let vigiaInterval = null;

const viewModules = {
    'dashboard':     { path: './functions/admin.js', initFunc: 'initAdminPage' },
    'meus-produtos': { path: './functions/admin.js', initFunc: 'initAdminPage' },
    'pedidos':       { path: './functions/pedidos.js', initFunc: 'initPedidosPage' },
    'caixa':         { path: './functions/caixa.js', initFunc: 'initCaixaPage' },
    'configuracoes': { path: './functions/configuracoes.js', initFunc: 'initConfiguracoesPage' },
};

async function handleDemoAccess() {
    const params = new URLSearchParams(window.location.search);
    const demoToken = params.get('token_demo');

    if (demoToken) {
        const { error } = await supabase.auth.setSession({
            access_token: demoToken,
            refresh_token: demoToken 
        });

        if (error) {
            console.error("Erro no login com token demo:", error.message);
            window.location.replace('login.html');
        } else {
            console.log("Acesso DEMO concedido! 🚀");
            history.replaceState(null, '', window.location.pathname);
        }
    }
}

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
    const activeLink = document.querySelector(`.nav-link[href*="view=${view}"], #nav-${view}`);
    if (activeLink) activeLink.classList.add('active');

    const moduleInfo = viewModules[view];
    if (moduleInfo && moduleInfo.path && moduleInfo.initFunc) {
        try {
            const module = await import(moduleInfo.path);
            if (typeof module[moduleInfo.initFunc] === 'function') {
                await module[moduleInfo.initFunc]({ view, ...params });
            } else {
                 console.error(`Função '${moduleInfo.initFunc}' não encontrada no módulo '${moduleInfo.path}'.`);
            }
        } catch(err) {
            console.error(`Erro ao carregar ou inicializar módulo para a view '${view}':`, err);
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
    if (url && url !== 'data:image/svg+xml;base64,') { 
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
        atualizarLogoPainel(null, 'Falha ao carregar');
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
    console.log("Tentativa de desbloqueio de áudio..."); 
    const audio = document.getElementById('notification-sound');
    if (audio) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                audio.pause(); 
                audio.currentTime = 0; 
                audioContextDesbloqueado = true;
                console.log("Áudio desbloqueado com sucesso! 🔊");
                document.body.removeEventListener('click', unlockAudio);
                document.body.removeEventListener('keydown', unlockAudio);
            }).catch(error => {
                console.log("Desbloqueio de áudio adiado. Aguardando mais interação do usuário.");
            });
        }
    }
}

function iniciarVigiaDePedidos() {
    if (vigiaInterval) clearInterval(vigiaInterval);
    vigiaInterval = setInterval(() => {
        const tipoDeAlerta = localStorage.getItem('novoPedidoAdmin');
        if (!tipoDeAlerta) return;
        localStorage.removeItem('novoPedidoAdmin');
        window.dispatchEvent(new CustomEvent('novoPedidoRecebido', { detail: { tipo: tipoDeAlerta } }));
        if (tipoDeAlerta === 'external') {
            tocarNotificacao();
            Swal.fire({
                toast: true, position: 'top-end', icon: 'info', title: 'Novo pedido na área!',
                showConfirmButton: false, timer: 4000, background: '#38326b', color: '#ffffff'
            });
        }
    }, VIGIA_RATE_MS);
}

function initDemoMode() {
    if (!window.APP_CONFIG.isDemoMode) return;
    console.log("Maestro: MODO DEMONSTRAÇÃO ATIVO! 🛡️");
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
    await handleDemoAccess();
    
    const isAdminPanel = !!document.getElementById('admin-sidebar');

    if (isAdminPanel) {
        console.log("Detectado: Painel Admin. Verificando sessão...");
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.replace('login.html');
            return;
        }

        console.log("Sessão válida. Iniciando modo SPA.");
        
        initDemoMode();
        fetchAndSetLogo();
        iniciarVigiaDePedidos();
        document.body.addEventListener('click', unlockAudio, { once: true });
        document.body.addEventListener('keydown', unlockAudio, { once: true });
        
        const sidebar = document.getElementById('admin-sidebar');
        const overlay = document.getElementById('menu-overlay');
        const closeMenu = () => { if(sidebar) sidebar.classList.add('-translate-x-full'); if(overlay) overlay.classList.add('hidden'); };
        const openMenu = () => { if(sidebar) sidebar.classList.remove('-translate-x-full'); if(overlay) overlay.classList.remove('hidden'); };
        
        const openBtn = document.getElementById('btn-mobile-menu');
        const closeBtn = document.getElementById('btn-close-menu');
        if(openBtn) openBtn.addEventListener('click', openMenu);
        if(closeBtn) closeBtn.addEventListener('click', closeMenu);
        if(overlay) overlay.addEventListener('click', closeMenu);

        document.getElementById('btn-logout').addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const url = new URL(link.href);
                const view = url.searchParams.get('view') || 'dashboard';
                history.pushState({ view }, '', `?view=${view}`);
                navigateTo(view);
                if (window.innerWidth < 768) {
                    closeMenu();
                }
            });
        });

        document.getElementById('btn-abrir-modal-produto').addEventListener('click', async () => {
            if (window.innerWidth < 768) closeMenu();
            await navigateTo('meus-produtos');
            setTimeout(() => {
                if (window.adminFunctions && typeof window.adminFunctions.abrirModalParaCriar === 'function') {
                    window.adminFunctions.abrirModalParaCriar();
                } else {
                    console.error("Função 'abrirModalParaCriar' não disponível.");
                }
            }, 100);
        });

        window.addEventListener('popstate', (e) => {
            const view = e.state?.view || 'dashboard';
            navigateTo(view, e.state?.params || {});
        });

        const initialView = new URLSearchParams(window.location.search).get('view') || 'dashboard';
        navigateTo(initialView);

    } else {
        console.log("Detectado: Página Pública ou Módulo Externo. Acesso liberado, iniciando modo simples.");
        
        const pageName = window.location.pathname.split('/').pop().replace('.html', '');
        const externalPages = {
            'cliente': { path: './functions/cliente.js', func: 'initClientePage' },
            'acompanhar': { path: './functions/acompanhar.js', func: 'initAcompanharPage' },
            'garcom-login': { path: './functions/garcom.js', func: 'initGarcomLoginPage' },
            'garcom-mesas': { path: './functions/garcom.js', func: 'initGarcomMesasPage' },
            'hub-integracao': { path: './functions/hub-integracao.js', func: 'initHubIntegracaoPage' },
            'financeiro': { path: './financeiro.js', func: 'initFinanceiroPage' },
            'garcons-admin': { path: './garcons-admin.js', func: 'initGarconsAdminPage' }
        };

        const pageInfo = externalPages[pageName];
        if (pageInfo) {
            import(pageInfo.path)
            .then(module => {
                if (typeof module[pageInfo.func] === 'function') {
                    module[pageInfo.func]();
                } else {
                    console.warn(`Função '${pageInfo.func}' não encontrada no módulo '${pageInfo.path}'.`);
                }
            })
            .catch(err => console.error(`Erro ao carregar módulo para '${pageName}':`, err));
        }
    }
});