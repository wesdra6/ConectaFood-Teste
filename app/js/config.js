// REESCREVA O ARQUIVO COMPLETO: js/config.js

// ===================================================================
// CONFIGURAÇÕES DO N8N
// ===================================================================

// Detecta se estamos em ambiente de desenvolvimento (Live Server)
const IS_DEV = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

// Define a URL base dinamicamente: se for DEV, usa a URL completa. Se for produção, usa o proxy.
const N8N_BASE_URL = IS_DEV 
    ? 'https://n8n-webhook.uptecnology.com.br/webhook/' 
    : '/api/'; 

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
    get_order_acompanhar:  N8N_BASE_URL + 'pedido/buscar-acompanhar',
    send_whatsapp_status:  N8N_BASE_URL + 'pedido/enviar-status-whatsapp',
    send_delivery_details: N8N_BASE_URL + 'delivery/send-details',
    get_finalized_orders_by_date: N8N_BASE_URL + 'pedidos/listar-por-data',
    get_finalized_order_by_code: N8N_BASE_URL + 'pedido/buscar-finalizado-por-codigo', 
    cancel_order:          N8N_BASE_URL +  'pedido/cancelar',
    finalize_order_and_table: N8N_BASE_URL + 'pedido/finalizar-e-liberar-mesa',
    add_item_to_order:     N8N_BASE_URL + 'pedido/adicionar-item',
    remove_item_from_order: N8N_BASE_URL + 'pedido/remover-item',

    // BUSCAR TODOS OS ITENS (PRODUTOS E SERVIÇOS)
    get_all_products_with_type: N8N_BASE_URL + 'produtos/listar-com-tipo',
    
    // FINALIZAR PEDIDO ADICIONANDO SERVIÇOS
    finalize_order_with_services: N8N_BASE_URL + 'pedido/finalizar-com-servicos',

    // ENDPOINT FISCAL 
    emitir_nfce:           N8N_BASE_URL + 'fiscal/emitir-nfce',
    retorno_status_fiscal: N8N_BASE_URL + 'fiscal/retorno-status',
    download_documento_fiscal: N8N_BASE_URL + 'fiscal/download',

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
    update_loja_status:    N8N_BASE_URL + 'loja/status/atualizar',
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
// CONFIGURAÇÕES GLOBAIS DA APLICAÇÃO
// ===================================================================
const APP_CONFIG = {
    origemCores: { 
        'DELIVERY': 'bg-blue-500', 
        'WHATSAPP': 'bg-green-500', 
        'IFOOD': 'bg-red-500', 
        'MESA': 'bg-purple-500', 
        'BALCAO': 'bg-yellow-500' 
    },
    statusFlowPadrao: [ 
        { text: 'ACEITAR', textCompleted: 'ACEITO', nextStatus: 'EM_PREPARO', requiredStatus: 'CONFIRMADO' }, 
        { text: 'EM PREPARO', textCompleted: 'PRONTO', nextStatus: 'PRONTO_PARA_ENTREGA',  requiredStatus: 'EM_PREPARO' }, 
        { text: 'CHAMAR ENTREGADOR', nextStatus: 'A_CAMINHO', requiredStatus: 'PRONTO_PARA_ENTREGA' }, 
        { text: 'IMPRIMIR NOTA', isPrintOnly: true, requiredStatus: 'A_CAMINHO' },
        { text: 'FINALIZAR', isFinalAction: true, nextStatus: 'ENTREGUE', requiredStatus: 'A_CAMINHO' }
    ],
    statusFlowBalcao: [ 
        { text: 'ACEITAR', textCompleted: 'ACEITO', nextStatus: 'EM_PREPARO', requiredStatus: 'CONFIRMADO' },
        { text: 'EM PREPARO', textCompleted: 'PRONTO', nextStatus: 'PRONTO_PARA_ENTREGA', requiredStatus: 'EM_PREPARO' }
    ],
    statusFlowMesa: [ 
        { text: 'ACEITAR', textCompleted: 'ACEITO', nextStatus: 'EM_PREPARO', requiredStatus: 'CONFIRMADO' }, 
        { text: 'PRONTO P/ SERVIR', textCompleted: 'SERVIDO', nextStatus: 'PRONTO_PARA_ENTREGA', requiredStatus: 'EM_PREPARO' }
    ],
    flowOrder: ['CONFIRMADO', 'EM_PREPARO', 'PRONTO_PARA_ENTREGA', 'A_CAMINHO', 'ENTREGUE', 'CANCELADO']
};

// ===================================================================
// DISPONIBILIZA AS CONFIGURAções GLOBALMENTE
// ===================================================================
window.N8N_CONFIG = N8N_ENDPOINTS;
window.ZIPLINE_CONFIG = ZIPLINE_CONFIG;
window.EVOLUTION_CONFIG = EVOLUTION_API_CONFIG;
window.APP_CONFIG = APP_CONFIG;