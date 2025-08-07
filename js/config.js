// REESCREVA O ARQUIVO COMPLETO: js/config.js

// ===================================================================
// CONFIGURAÇÕES DO N8N
// ===================================================================
const N8N_BASE_URL = 'https://n8n-webhook.uptecnology.com.br/webhook/';

const N8N_ENDPOINTS = {
    // --- FINANCEIRO ---
    get_financial_report: N8N_BASE_URL + 'financeiro/relatorio',

    // --- DASHBOARD ---
    get_dashboard_stats: N8N_BASE_URL + 'dashboard/stats',

    // --- PRODUTOS ---
    get_all_products:      N8N_BASE_URL + 'produtos/listar', 
    create_product:        N8N_BASE_URL + 'produto/criar',
    update_product:        N8N_BASE_URL + 'produto/atualizar',
    toggle_product_status: N8N_BASE_URL + 'produto/alternar-status',

    // --- CATEGORIAS ---
    get_all_categories:    N8N_BASE_URL + 'categorias/listar',
    create_category:       N8N_BASE_URL + 'categoria/criar',
    update_category:       N8N_BASE_URL + 'categoria/atualizar',
    delete_category:       N8N_BASE_URL + 'categoria/deletar',
    reorder_categories:    N8N_BASE_URL + 'categorias/reordenar',

    // --- BANNERS ---
    get_all_banners:       N8N_BASE_URL + 'banners/listar',
    create_banner:         N8N_BASE_URL + 'banner/criar',
    update_banner:         N8N_BASE_URL + 'banner/atualizar',
    reorder_banners:       N8N_BASE_URL + 'banners/reordenar',
    delete_banner:         N8N_BASE_URL + 'banner/deletar',
    toggle_banner_status:  N8N_BASE_URL + 'banner/alternar-status',
    delete_banner_on_clear: N8N_BASE_URL + 'banner/deletar-limpar',

    // --- PEDIDOS ---
    create_order_app:      N8N_BASE_URL + 'pedido/criar-app',
    create_order_internal: N8N_BASE_URL + 'pedido/lancar-interno', 
    update_order_status:   N8N_BASE_URL + 'pedido/atualizar-status',
    get_all_orders:        N8N_BASE_URL + 'pedidos/listar-todos',
    get_order_status:      N8N_BASE_URL + 'pedido/buscar-status',
    send_whatsapp_status:  N8N_BASE_URL + 'pedido/enviar-status-whatsapp',
    send_delivery_details: N8N_BASE_URL + 'delivery/send-details',
    get_finalized_orders_by_date: N8N_BASE_URL + 'pedidos/listar-por-data',
    get_finalized_order_by_code: N8N_BASE_URL + 'pedido/buscar-finalizado-por-codigo', 
    cancel_order:          N8N_BASE_URL +  'pedido/cancelar',
    finalize_order_and_table: N8N_BASE_URL + 'pedido/finalizar-e-liberar-mesa',
    finalize_delivery:     N8N_BASE_URL + 'pedido/atualizar-entregador',
    add_item_to_order:     N8N_BASE_URL + 'pedido/adicionar-item',
    remove_item_from_order: N8N_BASE_URL + 'pedido/remover-item',
    
    // BUSCAR TODOS OS ITENS (PRODUTOS E SERVIÇOS)
    get_all_products_with_type: N8N_BASE_URL + 'produtos/listar-com-tipo',

    // FINALIZAR PEDIDO ADICIONANDO SERVIÇOS
    finalize_order_with_services: N8N_BASE_URL + 'pedido/finalizar-com-servicos',

    // --- MESAS ---
    get_all_tables:        N8N_BASE_URL + 'mesas/listar',
    update_table_status:   N8N_BASE_URL + 'mesa/atualizar-status', 
    create_table:          N8N_BASE_URL + 'mesas/criar',
    delete_table:          N8N_BASE_URL + 'mesas/deletar',
    update_table_assignments: N8N_BASE_URL + 'mesas/atualizar-atribuicao',
    clear_table_assignments:  N8N_BASE_URL + 'mesas/limpar-atribuicao',

    // GARÇONS
    get_all_garcons:       N8N_BASE_URL + 'garcons/listar',
    create_garcom:         N8N_BASE_URL + 'garcom/criar',
    update_garcom:         N8N_BASE_URL + 'garcom/atualizar',
    delete_garcom:         N8N_BASE_URL + 'garcom/deletar',
    garcom_login:          N8N_BASE_URL + 'garcom/login',
    get_garcons_resumo:    N8N_BASE_URL + 'garcons/resumo',

    // --- LOJA ---
    get_loja_config:       N8N_BASE_URL + 'loja/config/obter',
    update_loja_config:    N8N_BASE_URL + 'loja/config/atualizar',
};

// ===================================================================
// CONFIGURAÇÕES DE SERVIÇOS EXTERNOS
// ===================================================================
// --- ARMAZENAMENTO DE IMAGENS ---
const ZIPLINE_CONFIG = {
    upload: 'https://n8n-webhook.uptecnology.com.br/webhook/enviar-imagem',
    delete: 'https://n8n-webhook.uptecnology.com.br/webhook/deletar-imagem',
    
};

// --- API DE WHATSAPP ---
const EVOLUTION_API_CONFIG = {
    baseUrl:      'https://evolution-up.uptecnology.com.br',
    instanceName: 'NOME_DA_SUA_INSTANCIA',
    apiKey:       'SUA_API_KEY_SECRETA_VAI_AQUI' 
};

// ===================================================================
// DISPONIBILIZA AS CONFIGURAções GLOBALMENTE
// ===================================================================
window.N8N_CONFIG = N8N_ENDPOINTS;
window.ZIPLINE_CONFIG = ZIPLINE_CONFIG;
window.EVOLUTION_CONFIG = EVOLUTION_API_CONFIG;