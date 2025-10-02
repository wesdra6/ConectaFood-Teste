import { supabase } from './supabaseClient.js';
import { fetchDeAPI, enviarParaAPI } from './functions/api.js';
import { API_ENDPOINTS } from './config.js';

// ... (a função verificarEAbirLoja continua igual)
async function verificarEAbirLoja() {
    try {
        const configs = await fetchDeAPI(API_ENDPOINTS.get_loja_config);
        const lojaEstaAberta = configs[0]?.loja_aberta || false;
        if (lojaEstaAberta) return;
        const resultado = await Swal.fire({
            title: 'Sua loja está fechada!',
            text: 'Deseja abrir a loja para receber pedidos agora?',
            icon: 'question', showCancelButton: true, confirmButtonText: 'Sim, abrir a loja!',
            cancelButtonText: 'Não, manter fechada', confirmButtonColor: '#28a745',
            cancelButtonColor: '#d33', background: '#2c2854', color: '#ffffff'
        });
        if (resultado.isConfirmed) {
            Swal.fire({ title: 'Abrindo a loja...', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });
            await enviarParaAPI(API_ENDPOINTS.update_loja_status, { loja_aberta: true });
            Swal.close();
        }
    } catch (error) {
        console.error("Erro ao tentar abrir a loja:", error);
        Swal.fire({ icon: 'error', title: 'Ops!', text: 'Não foi possível comunicar o status da loja.', background: '#2c2854', color: '#ffffff' });
    }
}

async function handleEsqueciSenha(event) {
    event.preventDefault();
    const email = document.getElementById('email-recuperacao').value;
    const whatsapp = document.getElementById('whatsapp-recuperacao').value.replace(/\D/g, '');
    if (!email || !whatsapp) {
        Swal.fire({ icon: 'warning', title: 'Campos vazios', text: 'Por favor, preencha o e-mail e o WhatsApp.', background: '#2c2854', color: '#ffffff' });
        return;
    }
    Swal.fire({
        title: 'Verificando dados...', allowOutsideClick: false, background: '#2c2854',
        color: '#ffffff', didOpen: () => Swal.showLoading()
    });
    try {
        const resposta = await enviarParaAPI(API_ENDPOINTS.recover_password_whatsapp, { email: email, whatsapp: whatsapp });
        const modalElement = document.getElementById('modal-esqueci-senha');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
        if (resposta.success) {
            Swal.fire({
                icon: 'success', title: 'Solicitação enviada!',
                text: 'Se os dados estiverem corretos, você receberá um link de acesso no seu WhatsApp em instantes.',
                background: '#2c2854', color: '#ffffff'
            });
        } else {
            throw new Error(resposta.message || 'Ocorreu um erro no servidor.');
        }
    } catch (error) {
        // Silêncio aqui! O api.js já cuidou do alerta.
        console.error("Erro ao solicitar recuperação, tratado globalmente:", error);
    }
}


// ➕ NOVA FUNÇÃO PARA AUTO-LOGIN DE DEMO
async function handleAutoLoginDemo() {
    const params = new URLSearchParams(window.location.search);
    const demoUserEncoded = params.get('user');
    const demoPassEncoded = params.get('pass');

    if (demoUserEncoded && demoPassEncoded) {
        try {
            // Decodifica os dados da URL
            const email = atob(demoUserEncoded);
            const password = atob(demoPassEncoded);

            // Preenche os campos e simula o envio do formulário
            document.getElementById('email').value = email;
            document.getElementById('password').value = password;
            
            console.log("Detectado acesso demo. Realizando auto-login...");
            
            // Simula o clique no botão de submit
            document.getElementById('form-login').querySelector('button[type="submit"]').click();

        } catch (e) {
            console.error("Falha ao processar dados de demonstração da URL.", e);
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            Swal.fire({ title: 'Entrando...', text: 'Validando suas credenciais...', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });

            try {
                const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
                if (loginError) throw loginError;

                const user = sessionData.user;
                if (!user) throw new Error('Usuário não encontrado.');

                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profileError) throw profileError;
                if (!profileData) throw new Error('Perfil de usuário não configurado. Contate o suporte.');

                sessionStorage.setItem('userRole', profileData.role);
                
                // Limpa a URL caso seja um login demo
                if (window.location.search.includes('user=')) {
                    history.replaceState(null, '', window.location.pathname);
                }

                await verificarEAbirLoja();
                window.location.replace('index.html');

            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Ops!', text: error.message || 'Email ou senha incorretos. Tente novamente.', background: '#2c2854', color: '#ffffff' });
            }
        });
    }
    
    // ... (formEsqueciSenha e carregamento da logo continuam iguais)
    const formEsqueciSenha = document.getElementById('form-esqueci-senha');
    if(formEsqueciSenha){
        formEsqueciSenha.addEventListener('submit', handleEsqueciSenha);
    }
    (async () => {
        try {
            const configs = await fetchDeAPI(API_ENDPOINTS.get_loja_config);
            if (configs && configs.length > 0) {
                const { logo_vitrine_url, nome_loja } = configs[0];
                const logoContainer = document.getElementById('logo-container');
                if (logoContainer) {
                    logoContainer.innerHTML = logo_vitrine_url 
                        ? `<img src="${logo_vitrine_url}" alt="Logo ${nome_loja}" class="max-w-xs w-full h-auto mx-auto">` 
                        : `<span class="text-4xl font-bold text-principal text-center block">${nome_loja || 'LegalConnect'}</span>`;
                }
            }
        } catch (error) {
            console.error("Não foi possível carregar a logo na tela de login.", error);
        }
    })();

    // ✅ CHAMA A NOVA FUNÇÃO AQUI
    handleAutoLoginDemo();
});