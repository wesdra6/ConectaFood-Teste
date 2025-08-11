// REESCREVA O ARQUIVO COMPLETO: js/supabaseClient.js

const { createClient } = window.supabase;

export let supabase = null;

(async () => {
    try {
        const IS_DEV = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

        let supabaseUrl;
        let supabaseAnonKey;

        if (IS_DEV) {
            console.log("Modo DEV: Tentando carregar credenciais locais do dev-secrets.js.");
            try {
                // A importação agora está DENTRO de um try...catch
                // Isso garante que se o arquivo não existir (como em produção), não quebre o script.
                const devSecrets = await import('./dev-secrets.js');
                supabaseUrl = devSecrets.DEV_SUPABASE_URL;
                supabaseAnonKey = devSecrets.DEV_SUPABASE_ANON_KEY;
            } catch (error) {
                console.error("Arquivo dev-secrets.js não encontrado. Crie o arquivo /app/js/dev-secrets.js para desenvolver localmente.");
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
             document.body.innerHTML = '<div style="color: white; font-family: sans-serif; text-align: center; padding-top: 50px;"><h1>Erro Crítico de Configuração.</h1></div>';
        });
    }
})();