import { supabase } from './supabaseClient.js';
import { API_ENDPOINTS } from './config.js';
import { fetchDeAPI } from './functions/api.js';

// --- Funções Auxiliares ---
console.log("Maestro: Iniciando com calma e sabedoria.");
const VIGIA_RATE_MS = 5000;
let audioContextDesbloqueado = false;
let vigiaInterval = null;

// ✅ OBJETO DE MÓDULOS REFINADO
// Mapeia a view (da URL) para seu HTML, JS e função de inicialização.
const viewModules = {
    'dashboard':     { html: './dashboard.html',      js: './functions/admin.js',          initFunc: 'initAdminPage' },
    'meus-produtos': { html: './meus-produtos.html',  js: './functions/admin.js',          initFunc: 'initAdminPage' },
    'pedidos':       { html: './pedidos.html',        js: './functions/pedidos.js',        initFunc: 'initPedidosPage' },
    'caixa':         { html: './caixa.html',          js: './functions/caixa.js',          initFunc: 'initCaixaPage' },
    'configuracoes': { html: './configuracoes.html',  js: './functions/configuracoes.js',  initFunc: 'initConfiguracoesPage' },
};

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

// ✅ FUNÇÃO navigateTo ATUALIZADA PARA UMA ARQUITETURA MAIS ROBUSTA
async function navigateTo(view, params = {}) { 
    // Esconde todos os containers de view e limpa o conteúdo deles
    document.querySelectorAll('.view-container').forEach(v => {
        v.classList.add('hidden');
        v.innerHTML = ''; 
    });
    
    // Define o ID do container alvo
    const containerId = `${view}-page`;
    let container = document.getElementById(containerId);
    
    // Fallback para o dashboard se o container não for encontrado
    if (!container) {
        console.warn(`Container #${containerId} não encontrado. Usando o de dashboard como fallback.`);
        container = document.getElementById('dashboard-page');
        view = 'dashboard';
    }

    try {
        container.innerHTML = `<p class="text-center text-xl text-texto-muted animate-pulse p-10">Carregando módulo...</p>`;

        const moduleInfo = viewModules[view];
        if (!moduleInfo || !moduleInfo.html) throw new Error(`Configuração de módulo não encontrada para a view '${view}'.`);

        // Busca o HTML da página
        const response = await fetch(moduleInfo.html);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} para ${moduleInfo.html}`);
        
        const html = await response.text();
        container.innerHTML = html;
        container.classList.remove('hidden');

        // IMPORTA E EXECUTA O JAVASCRIPT CORRESPONDENTE
        if (moduleInfo.js && moduleInfo.initFunc) {
            const module = await import(moduleInfo.js);
            if (module && typeof module[moduleInfo.initFunc] === 'function') {
                // Chama a função de inicialização daquele módulo específico
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

    // Atualiza o link ativo na navegação
    document.querySelectorAll('.nav-link, .nav-link-button').forEach(btn => btn.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[href*="view=${view}"], #nav-${view}`);
    if (activeLink) activeLink.classList.add('active');
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

// ➕ NOVA VERSÃO COMPLETA E BLINDADA 👇
async function initApp() {
    // Primeiro, checamos se estamos no painel principal ou em uma página externa
    const isAdminPanel = !!document.getElementById('admin-sidebar');

    // Se NÃO for o painel admin (ex: cliente.html, acompanhar.html), ele roda a lógica específica e para por aqui.
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
        return; // Fim da execução para páginas externas.
    }

    // --- A PARTIR DAQUI, É SÓ LÓGICA DO PAINEL DE ADMIN ---
    console.log("Maestro: Iniciando verificação de segurança do painel...");

    // ✅ MURALHA DE SEGURANÇA #1: VERIFICAÇÃO DE SESSÃO
    // Nenhuma linha de código de inicialização do painel roda antes disso.
    let session = null;
    try {
        // Tentamos primeiro pegar uma sessão de demonstração pela URL
        session = await handleDemoAccess();

        // Se não for demo, buscamos a sessão normal no Supabase
        if (!session) {
            const { data } = await supabase.auth.getSession();
            session = data.session;
        }

        // O PORTEIRO: Se depois de tudo não houver sessão, a festa acaba aqui.
        if (!session) {
            console.warn("Maestro: Nenhuma sessão encontrada. Redirecionando para o login.");
            window.location.replace('login.html');
            return; // TRAVA a execução do resto da função. Ninguém entra.
        }
        
        console.log("Maestro: Sessão válida encontrada. Prosseguindo com a inicialização.");

    } catch (error) {
        console.error("Maestro: Erro CRÍTICO na verificação de sessão. Redirecionando para login por segurança.", error);
        window.location.replace('login.html');
        return;
    }


    // ✅ MURALHA DE SEGURANÇA #2: VERIFICAÇÃO DE PERFIL/ROLE
    // Se temos uma sessão, precisamos saber QUEM é o usuário.
    try {
        // Caso especial para o usuário de demonstração
        if (session.user.app_metadata.role === 'visitante') {
            console.log("Maestro: Usuário 'visitante' (demo) detectado.");
            sessionStorage.setItem('userRole', 'visitante');
        } else {
            // Para usuários normais, buscamos o perfil no nosso banco de dados
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
        // Se a sessão existe mas o perfil não, é um problema grave. Desloga por segurança.
        console.error("Maestro: Erro CRÍTICO ao buscar perfil do usuário. Fazendo logout forçado.", error);
        await handleLogout();
        return;
    }

    // --- INICIALIZAÇÃO DO PAINEL (SÓ RODA SE PASSAR NAS MURALHAS) ---
    console.log("Maestro: Segurança OK. Iniciando componentes do painel...");
    
    fetchAndSetLogo();
    iniciarVigiaDePedidos();
    document.body.addEventListener('click', unlockAudio, { once: true });
    document.body.addEventListener('keydown', unlockAudio, { once: true });
    
    // Listeners do menu mobile
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('menu-overlay');
    const closeMenu = () => { if(sidebar) sidebar.classList.add('-translate-x-full'); if(overlay) overlay.classList.add('hidden'); };
    const openMenu = () => { if(sidebar) sidebar.classList.remove('-translate-x-full'); if(overlay) overlay.classList.remove('hidden'); };
    
    document.getElementById('btn-mobile-menu')?.addEventListener('click', openMenu);
    document.getElementById('btn-close-menu')?.addEventListener('click', closeMenu);
    document.getElementById('menu-overlay')?.addEventListener('click', closeMenu);

    // Listener de Logout
    document.getElementById('btn-logout')?.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });

    // Listeners dos links de navegação (coração da SPA)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = new URL(link.href).searchParams.get('view') || 'dashboard';
            history.pushState({ view }, '', `?view=${view}`);
            navigateTo(view);
            if (window.innerWidth < 768) closeMenu();
        });
    });

    // Listener do botão "Inserir Produto"
    const btnAbrirModal = document.getElementById('btn-abrir-modal-produto');
    if (btnAbrirModal) {
        btnAbrirModal.addEventListener('click', async () => {
            if (window.innerWidth < 768) closeMenu();
            const currentView = new URLSearchParams(window.location.search).get('view') || 'dashboard';
            if (currentView !== 'meus-produtos') {
                 history.pushState({ view: 'meus-produtos' }, '', `?view=meus-produtos`);
                 await navigateTo('meus-produtos');
            }
            setTimeout(() => {
                if (window.adminFunctions && typeof window.adminFunctions.abrirModalParaCriar === 'function') {
                    window.adminFunctions.abrirModalParaCriar();
                }
            }, 150);
        });
    }

    // Listener para os botões de voltar/avançar do navegador
    window.addEventListener('popstate', (e) => {
        const view = e.state?.view || 'dashboard';
        navigateTo(view, e.state?.params || {});
    });

    // Carrega a view inicial baseada na URL
    const initialView = new URLSearchParams(window.location.search).get('view') || 'dashboard';
    navigateTo(initialView);
}

initApp();