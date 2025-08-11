
const { createClient } = window.supabase;

const IS_DEV = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

const supabaseUrl = IS_DEV ? DEV_SUPABASE_URL : 'VITE_SUPABASE_URL';
const supabaseAnonKey = IS_DEV ? DEV_SUPABASE_ANON_KEY : 'VITE_SUPABASE_ANON_KEY';

if (!IS_DEV && supabaseUrl.startsWith('VITE_')) {
    console.error('Falha CRÍTICA: Variáveis de ambiente não foram injetadas pelo servidor!');
    document.body.innerHTML = '<h1>Erro Crítico de Configuração.</h1>';
    throw new Error("Configuração de produção ausente.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log(`Cliente Supabase inicializado em modo: ${IS_DEV ? 'DEV' : 'PROD'} ✅`);
