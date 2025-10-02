// ===================================================================
// ARQUIVO DE CONFIGURAÇÃO DE AMBIENTE - DESENVOLVIMENTO
// ===================================================================
// ATENÇÃO: Este arquivo NÃO DEVE ser enviado para o repositório Git.
// Ele contém as chaves e URLs para o seu ambiente de teste local.
// Cada cliente em produção terá um arquivo deste com suas próprias chaves.
// ===================================================================

window.ENVIRONMENT_CONFIG = {
  
  // -- API (N8N) --
  // URL pública do seu N8N de desenvolvimento
  API_BASE_URL: 'https://n8n-webhook.uptecnology.com.br/webhook/',
  
  // Chave de API do N8N (Header Auth - X-N8N-API-KEY)
  // Esta é a chave que permite o front-end se comunicar com os workflows.
  API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNDhlNjMzNy02OTJhLTQzYWUtOTRkYS02ZGYwYTNiNDZkNTciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NzA2MDgzfQ.NqMm6Vrr60Z2fIlZzNsVSKe4kqmJodCo4zZBOpO24OI',

  // -- SUPABASE --
  // URL do seu projeto Supabase de desenvolvimento
  SUPABASE_URL: 'https://ferramentas-supabase-food.lblzl4.easypanel.host',
  
  // Chave Anônima (pública) do seu projeto Supabase de desenvolvimento
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzM3NDI4NDAwLAogICJleHAiOiAxODk1MTk0ODAwCn0.xSC1u_LpBqMbarBrlsMS_adc9JVzyiHETWOnzopJMDs',
  
  // -- EVOLUTION API --
  // (Se você ainda precisar de alguma informação no front, como o nome da instância para gerar um QR Code)
  EVOLUTION_INSTANCE_NAME: 'NOME_DA_SUA_INSTANCIA_DEV',

  // -- ZIPLINE (Upload de Arquivos) --
  ZIPLINE_UPLOAD_URL: 'https://n8n-webhook.uptecnology.com.br/webhook/enviar-imagem',
  // ✅ CORREÇÃO AQUI 👇 - Vírgula adicionada!
  ZIPLINE_DELETE_URL: 'https://n8n-webhook.uptecnology.com.br/webhook/deletar-imagem',

};
