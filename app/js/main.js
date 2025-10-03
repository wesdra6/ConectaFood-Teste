import { supabase } from './supabaseClient.js';
import { API_ENDPOINTS } from './config.js';
import { fetchDeAPI } from './functions/api.js';

// --- Funções Auxiliares ---
console.log("Maestro: Iniciando com calma e sabedoria.");
const VIGIA_RATE_MS = 5000;
let audioContextDesbloqueado = false;
let vigiaInterval = null;

const viewModules = {
    'dashboard':     { html: './dashboard.html',      js: './functions/admin.js',          initFunc: 'initAdminPage' },
    'meus-produtos': { html: './meus-produtos.html',  js: './functions/admin.js',          initFunc: 'initAdminPage' },
    'pedidos':       { html: './pedidos.html',        js: './functions/pedidos.js',        initFunc: 'initPedidosPage' },
    'caixa':         { html: './caixa.html',          js: './functions/caixa.js',          initFunc: 'initCaixaPage' },
    'configuracoes': { html: './configuracoes.html',  js: './functions/configuracoes.js',  initFunc: 'initConfiguracoesPage' },
};

function initSidebar() {
    const body = document.body;
    const toggleButton = document.getElementById('btn-toggle-sidebar');

    if (!toggleButton) return;

    const toggleSidebar = () => {
        body.classList.toggle('sidebar-collapsed');
        body.classList.toggle('sidebar-expanded');
        const state = body.classList.contains('sidebar-collapsed') ? 'collapsed' : 'expanded';
        localStorage.setItem('sidebarState', state);
        
        const tooltipText = body.classList.contains('sidebar-collapsed') ? 'Expandir Menu' : 'Encolher Menu';
        toggleButton.setAttribute('data-tooltip', tooltipText);
    };

    toggleButton.addEventListener('click', toggleSidebar);

    const savedState = localStorage.getItem('sidebarState');
    if (savedState === 'collapsed') {
        body.classList.add('sidebar-collapsed');
        body.classList.remove('sidebar-expanded');
    } else {
        body.classList.add('sidebar-expanded');
        body.classList.remove('sidebar-collapsed');
    }
    
    const initialTooltipText = body.classList.contains('sidebar-collapsed') ? 'Expandir Menu' : 'Encolher Menu';
    toggleButton.setAttribute('data-tooltip', initialTooltipText);
}

function initSidebarTooltips() {
    let tooltipElement = null;
    let hideTimeout;

    document.querySelectorAll('#admin-sidebar [data-tooltip]').forEach(element => {
        
        const showTooltip = () => {
            if (!document.body.classList.contains('sidebar-collapsed')) return;
            
            clearTimeout(hideTimeout);

            const tooltipText = element.getAttribute('data-tooltip');
            if (!tooltipText) return;

            if (!tooltipElement) {
                tooltipElement = document.createElement('div');
                tooltipElement.className = 'sidebar-tooltip';
                document.body.appendChild(tooltipElement);
            }

            tooltipElement.textContent = tooltipText;
            const rect = element.getBoundingClientRect();
            const topPos = rect.top + (rect.height / 2) - (tooltipElement.offsetHeight / 2);
            const leftPos = rect.right + 10;

            tooltipElement.style.top = `${topPos}px`;
            tooltipElement.style.left = `${leftPos}px`;

            if (!tooltipElement.classList.contains('show')) {
                 setTimeout(() => tooltipElement?.classList.add('show'), 10);
            }
        };

        const hideTooltip = () => {
            hideTimeout = setTimeout(() => {
                if (tooltipElement) {
                    tooltipElement.classList.remove('show');
                }
            }, 100);
        };

        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}


async function handleDemoAccess() {
    const params = new URLSearchParams(window.location.search);
    const demoToken = params.get('token_demo');

    if (demoToken) {
        console.log("[Acesso Demo] Token encontrado. Tentando criar sessão...");
        history.replaceState(null, '', window.location.pathname);
        
        const { data, error } = await supabase.auth.setSession({
            access_token: demoToken,
            refresh_token: demoToken 
        });

        if (error) {
            console.error("[Acesso Demo] Erro ao definir a sessão:", error.message);
            return null;
        }
        
        console.log("[Acesso Demo] Sessão criada com sucesso! 🚀");
        return data.session;
    }
    return null;
}

async function navigateTo(view, params = {}) { 
    const body = document.body;
    if (view === 'pedidos') {
        body.classList.add('sidebar-collapsed');
        body.classList.remove('sidebar-expanded');
    } else {
        const userPreference = localStorage.getItem('sidebarState');
        if (userPreference === 'collapsed') {
            body.classList.add('sidebar-collapsed');
            body.classList.remove('sidebar-expanded');
        } else {
            body.classList.remove('sidebar-collapsed');
            body.classList.add('sidebar-expanded');
        }
    }

    document.querySelectorAll('.view-container').forEach(v => {
        v.classList.add('hidden');
        v.innerHTML = ''; 
    });
    
    const containerId = `${view}-page`;
    let container = document.getElementById(containerId);
    
    if (!container) {
        console.warn(`Container #${containerId} não encontrado. Usando o de dashboard como fallback.`);
        container = document.getElementById('dashboard-page');
        view = 'dashboard';
    }

    try {
        container.innerHTML = `<p class="text-center text-xl text-texto-muted animate-pulse p-10">Carregando módulo...</p>`;

        const moduleInfo = viewModules[view];
        if (!moduleInfo || !moduleInfo.html) throw new Error(`Configuração de módulo não encontrada para a view '${view}'.`);

        const response = await fetch(moduleInfo.html);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} para ${moduleInfo.html}`);
        
        const html = await response.text();
        container.innerHTML = html;
        container.classList.remove('hidden');

        if (moduleInfo.js && moduleInfo.initFunc) {
            const module = await import(moduleInfo.js);
            if (module && typeof module[moduleInfo.initFunc] === 'function') {
                await module[moduleInfo.initFunc]({ view, ...params });
                console.log(`Maestro do Painel: Módulo '${view}' carregado e inicializado com sucesso! 🚀`);
            } else {
                 console.error(`Função '${moduleInfo.initFunc}' não encontrada no módulo '${moduleInfo.js}'.`);
            }
        }

    } catch(err) {
        console.error(`Erro ao carregar a view '${view}':`, err);
        if (container) {
            container.innerHTML = `<p class="text-red-500 text-center p-10">Ops! Não foi possível carregar este módulo.</p>`;
            container.classList.remove('hidden');
        }
    }

    document.querySelectorAll('.nav-link, .nav-link-button').forEach(btn => btn.classList.remove('active'));
    
    const sourceId = params.sourceElementId;
    if (sourceId) {
        document.getElementById(sourceId)?.classList.add('active');
    } else {
        const activeLink = document.querySelector(`.nav-link[href*="view=${view}"], #nav-${view}`);
        if (activeLink) activeLink.classList.add('active');
    }
}

async function handleLogout() {
    Swal.fire({ title: 'Saindo...', text: 'Aguarde um momento.', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });
    try {
        sessionStorage.removeItem('userRole');
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
    const fallbackHtmlDesktop = `<span class="text-3xl font-bold text-principal sidebar-text">${nomeLoja || 'LegalConnect'}</span>`;
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
        const configs = await fetchDeAPI(API_ENDPOINTS.get_loja_config);
        if (configs && configs.length > 0) {
            const { logo_vitrine_url, nome_loja } = configs[0];
            atualizarLogoPainel(logo_vitrine_url, nome_loja);
        }
    } catch (error) {
        console.error("Não foi possível carregar a logo do painel.", error);
        atualizarLogoPainel(null, 'Falha ao carregar');
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

    vigiaInterval = setInterval(async () => {
        try {
            const novosPedidos = await fetchDeAPI(API_ENDPOINTS.get_new_orders_and_mark);
            
            if (Array.isArray(novosPedidos) && novosPedidos.length > 0) {
                console.log(`[VIGIA ATÔMICO] ${novosPedidos.length} novo(s) pedido(s) detectado(s)!`);
                
                const temPedidoExterno = novosPedidos.some(pedido => 
                    pedido.origem !== 'MESA' && pedido.origem !== 'BALCAO'
                );

                const tipoDeAlerta = temPedidoExterno ? 'external' : 'internal';
                
                console.log(`[VIGIA ATÔMICO] Tipo de alerta: ${tipoDeAlerta}. Disparando notificação.`);
                
                if (tipoDeAlerta === 'external') {
                    const sound = document.getElementById('notification-sound');
                    if (sound) sound.play().catch(e => console.error("Erro ao tocar som:", e));
    
                    Swal.fire({
                        title: '<strong>NOVO PEDIDO NA ÁREA! 🔥</strong>',
                        icon: 'success',
                        html: 'Um novo pedido acabou de chegar. Corra para o painel!',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 5000,
                        timerProgressBar: true,
                        background: '#2c2854',
                        color: '#ffffff'
                    });
                }
                
                window.dispatchEvent(new CustomEvent('novoPedidoRecebido', { 
                    detail: { 
                        tipo: tipoDeAlerta
                    } 
                }));
            }
        } catch (error) {
            if (!(error.message.includes('Failed to fetch'))) {
                 console.warn('[VIGIA ATÔMICO] Não foi possível verificar novos pedidos, tentando novamente em breve.');
            }
        }
    }, VIGIA_RATE_MS);
}

async function initApp() {
    const isAdminPanel = !!document.getElementById('admin-sidebar');

    if (!isAdminPanel) {
        const pageName = window.location.pathname.split('/').pop().replace('.html', '');
        const externalPages = {
            'cliente':      { path: './functions/cliente.js', func: 'initClientePage' },
            'acompanhar':   { path: './functions/acompanhar.js', func: 'initAcompanharPage' },
            'garcom-login': { path: './functions/garcom.js', func: 'initGarcomLoginPage' },
            'garcom-mesas': { path: './functions/garcom.js', func: 'initGarcomMesasPage' },
        };
        const pageInfo = externalPages[pageName];
        if (pageInfo) {
            const module = await import(pageInfo.path);
            if (module && typeof module[pageInfo.func] === 'function') module[pageInfo.func]();
        }
        return; 
    }

    console.log("Maestro: Iniciando verificação de segurança do painel...");

    let session = null;
    try {
        session = await handleDemoAccess();

        if (!session) {
            const { data } = await supabase.auth.getSession();
            session = data.session;
        }

        if (!session) {
            console.warn("Maestro: Nenhuma sessão encontrada. Redirecionando para o login.");
            window.location.replace('login.html');
            return; 
        }
        
        console.log("Maestro: Sessão válida encontrada. Prosseguindo com a inicialização.");

    } catch (error) {
        console.error("Maestro: Erro CRÍTICO na verificação de sessão. Redirecionando para login por segurança.", error);
        window.location.replace('login.html');
        return;
    }


    try {
        if (session.user.app_metadata.role === 'visitante') {
            console.log("Maestro: Usuário 'visitante' (demo) detectado.");
            sessionStorage.setItem('userRole', 'visitante');
        } else {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (profileError) throw profileError;
            if (!profileData) throw new Error('Perfil de usuário não encontrado no banco de dados.');
            
            sessionStorage.setItem('userRole', profileData.role);
            console.log(`Maestro: Role '${profileData.role}' carregada para a sessão.`);
        }
    } catch (error) {
        console.error("Maestro: Erro CRÍTICO ao buscar perfil do usuário. Fazendo logout forçado.", error);
        await handleLogout();
        return;
    }

    console.log("Maestro: Segurança OK. Iniciando componentes do painel...");
    
    initSidebar();
    initSidebarTooltips(); 
    
    fetchAndSetLogo();
    iniciarVigiaDePedidos();
    document.body.addEventListener('click', unlockAudio, { once: true });
    document.body.addEventListener('keydown', unlockAudio, { once: true });
    
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('menu-overlay');
    const closeMenu = () => { if(sidebar) sidebar.classList.add('-translate-x-full'); if(overlay) overlay.classList.add('hidden'); };
    const openMenu = () => { if(sidebar) sidebar.classList.remove('-translate-x-full'); if(overlay) overlay.classList.remove('hidden'); };
    
    document.getElementById('btn-mobile-menu')?.addEventListener('click', openMenu);
    document.getElementById('btn-close-menu')?.addEventListener('click', closeMenu);
    document.getElementById('menu-overlay')?.addEventListener('click', closeMenu);

    document.getElementById('btn-logout')?.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            // ✅ CORREÇÃO FINAL: Se for um link externo (nova aba), não faz nada.
            if (link.getAttribute('target') === '_blank') {
                return; // Deixa o navegador seguir o link normalmente.
            }

            e.preventDefault();
            const view = new URL(link.href).searchParams.get('view') || 'dashboard';
            const params = { sourceElementId: link.id };
            history.pushState({ view, params }, '', `?view=${view}`);
            navigateTo(view, params);
            if (window.innerWidth < 768) closeMenu();
        });
    });

    const btnAbrirModal = document.getElementById('btn-abrir-modal-produto');
    if (btnAbrirModal) {
        btnAbrirModal.addEventListener('click', async () => {
            if (window.innerWidth < 768) closeMenu();
            const currentView = new URLSearchParams(window.location.search).get('view') || 'dashboard';
            const targetView = 'meus-produtos';
            const params = { sourceElementId: 'btn-abrir-modal-produto' };

            if (currentView !== targetView) {
                 history.pushState({ view: targetView, params }, '', `?view=${targetView}`);
                 await navigateTo(targetView, params);
            } else {
                document.querySelectorAll('.nav-link, .nav-link-button').forEach(btn => btn.classList.remove('active'));
                btnAbrirModal.classList.add('active');
            }

            setTimeout(() => {
                if (window.adminFunctions && typeof window.adminFunctions.abrirModalParaCriar === 'function') {
                    window.adminFunctions.abrirModalParaCriar();
                }
            }, 150);
        });
    }

    window.addEventListener('popstate', (e) => {
        const view = e.state?.view || 'dashboard';
        navigateTo(view, e.state?.params || {});
    });

    const initialView = new URLSearchParams(window.location.search).get('view') || 'dashboard';
    navigateTo(initialView);
}

initApp();