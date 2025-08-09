// js/supabaseClient.js
// Ponto central para inicialização e exportação do cliente Supabase

// IMPORTANTE: Use as credenciais da sua instância self-hosted
const SUPABASE_URL = 'https://ferramentas-supabase-demos.lblzl4.easypanel.host/'; // Ex: 'http://localhost:8000'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzM3NDI4NDAwLAogICJleHAiOiAxODk1MTk0ODAwCn0.xSC1u_LpBqMbarBrlsMS_adc9JVzyiHETWOnzopJMDs';

// Usamos a desestruturação para pegar a função createClient do objeto global supabase
const { createClient } = window.supabase;
// Exportamos a instância do cliente para que outros módulos possam usá-la
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);