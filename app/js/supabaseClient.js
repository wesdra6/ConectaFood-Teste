
const SUPABASE_URL = 'https://ferramentas-supabase-demos.lblzl4.easypanel.host/'; // Ex: 'http://localhost:8000'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzM3NDI4NDAwLAogICJleHAiOiAxODk1MTk0ODAwCn0.xSC1u_LpBqMbarBrlsMS_adc9JVzyiHETWOnzopJMDs';

const { createClient } = window.supabase;
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);