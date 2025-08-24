// Lê as configurações do Supabase do objeto global injetado pelo NGINX.
const SUPABASE_URL = window.ENVIRONMENT_CONFIG?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.ENVIRONMENT_CONFIG?.SUPABASE_ANON_KEY;

// Usamos a desestruturação para pegar a função createClient do objeto global supabase
const { createClient } = window.supabase;

// Exportamos a instância do cliente para que outros módulos possam usá-la
// O código vai dar erro se as variáveis forem nulas, o que é bom para debug.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);