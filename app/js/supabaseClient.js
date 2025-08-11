
const { createClient } = window.supabase;

const DEV_SUPABASE_URL = 'https://ferramentas-supabase-demos.lblzl4.easypanel.host/';
const DEV_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzM3NDI4NDAwLAogICJleHAiOiAxODk1MTk0ODAwCn0.xSC1u_LpBqMbarBrlsMS_adc9JVzyiHETWOnzopJMDs'; 

export let supabase = null;

const initializeSupabase = async () => {
    if (supabase) return;

    const IS_DEV = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

    try {
        let supabaseUrl, supabaseAnonKey;

        if (IS_DEV) {
            console.log("Modo DEV: Usando credenciais locais do Supabase.");
            supabaseUrl = DEV_SUPABASE_URL;
            supabaseAnonKey = DEV_SUPABASE_ANON_KEY;
        } else {
            console.log("Modo PROD: Buscando credenciais seguras do Supabase via /api/env.");
            const response = await fetch('/api/env');
            if (!response.ok) {
                throw new Error(`Falha ao buscar config do servidor: ${response.statusText}`);
            }
            const env = await response.json();
            
            supabaseUrl = env.VITE_SUPABASE_URL; 
            supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
        }

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Credenciais do Supabase não foram carregadas.');
        }

        supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        console.log('Cliente Supabase inicializado com sucesso! ✅');
        
        document.dispatchEvent(new CustomEvent('supabaseReady'));

    } catch (error) {
        console.error('Falha CRÍTICA ao inicializar o Supabase:', error);
        document.body.innerHTML = '<div style="color: white; font-family: sans-serif; text-align: center; padding-top: 50px;"><h1>Erro Crítico de Configuração do Sistema.</h1><p>Por favor, contate o suporte.</p></div>';
    }
};

document.addEventListener('DOMContentLoaded', initializeSupabase);