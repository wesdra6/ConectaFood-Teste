
const { createClient } = window.supabase;

export let supabase = null;

(async () => {
    try {
        const IS_DEV = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

        let supabaseUrl;
        let supabaseAnonKey;

        if (IS_DEV) {
            console.log("Modo DEV: Tentando carregar credenciais locais do dev-config.js.");
            try {
                const devConfig = await import('./dev-config.js');
                supabaseUrl = devConfig.DEV_SUPABASE_URL;
                supabaseAnonKey = devConfig.DEV_SUPABASE_ANON_KEY;
            } catch (error) {
                console.error("Arquivo dev-config.js não encontrado. Crie um se for desenvolver localmente.");
                throw new Error("Configuração de desenvolvimento local ausente.");
            }
        } else {
            console.log("Modo PROD: Usando credenciais seguras injetadas pelo Nginx.");
            supabaseUrl = window.APP_ENV.SUPABASE_URL;
            supabaseAnonKey = window.APP_ENV.SUPABASE_ANON_KEY;
        }
        
        if (!supabaseUrl || !supabaseAnonKey || (typeof supabaseUrl === 'string' && supabaseUrl.startsWith('VITE_'))) {
            throw new Error('As credenciais do Supabase não foram carregadas corretamente.');
        }

        supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('Cliente Supabase inicializado com sucesso! ✅');

        document.dispatchEvent(new CustomEvent('supabaseReady'));

    } catch (error) {
        console.error('Falha CRÍTICA ao inicializar o Supabase:', error);
        document.addEventListener('DOMContentLoaded', () => {
             document.body.innerHTML = '<div style="color: white; font-family: sans-serif; text-align: center; padding-top: 50px;"><h1>Erro Crítico de Configuração.</h1><p>Por favor, contate o suporte.</p></div>';
        });
    }
})();