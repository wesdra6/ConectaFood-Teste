const API_BASE_URL = window.ENVIRONMENT_CONFIG?.API_BASE_URL;


export const API_ENDPOINTS = {
    admin_create_user: API_BASE_URL + 'admin/criar-usuario',
    admin_list_profiles: API_BASE_URL + 'admin/listar-perfis',
    registrar_logout: API_BASE_URL + 'usuario/registrar-logout',
    recover_password_whatsapp: API_BASE_URL + 'auth/recuperar-via-whatsapp',
    admin_delete_user: API_BASE_URL + 'admin/deletar-usuario',

    get_financial_report: API_BASE_URL + 'financeiro/relatorio',
    get_dashboard_stats: API_BASE_URL + 'dashboard/stats',
    
    get_all_products:      API_BASE_URL + 'produtos/listar', 
    create_product:        API_BASE_URL + 'produto/criar',
    update_product:        API_BASE_URL + 'produto/atualizar',
    toggle_product_status: API_BASE_URL + 'produto/alternar-status',
    get_all_products_with_type: API_BASE_URL + 'produtos/listar-com-tipo',
    
    get_all_categories:    API_BASE_URL + 'categorias/listar',
    create_category:       API_BASE_URL + 'categoria/criar',
    update_category:       API_BASE_URL + 'categoria/atualizar',
    delete_category:       API_BASE_URL + 'categoria/deletar',
    reorder_categories:    API_BASE_URL + 'categorias/reordenar',
    
    get_all_banners:       API_BASE_URL + 'banners/listar',
    create_banner:         API_BASE_URL + 'banner/criar',
    update_banner:         API_BASE_URL + 'banner/atualizar',
    reorder_banners:       API_BASE_URL + 'banners/reordenar',
    delete_banner:         API_BASE_URL + 'banner/deletar',
    toggle_banner_status:  API_BASE_URL + 'banner/alternar-status',
    delete_banner_on_clear: API_BASE_URL + 'banner/deletar-limpar',
    
    create_order_app:      API_BASE_URL + 'pedido/criar-app',
    create_order_internal: API_BASE_URL + 'pedido/lancar-interno', 
    update_order_status:   API_BASE_URL + 'pedido/atualizar-status',
    get_all_orders:        API_BASE_URL + 'pedidos/listar-todos',
    get_order_status:      API_BASE_URL + 'pedido/buscar-status',
    get_order_acompanhar:  API_BASE_URL + 'pedido/buscar-acompanhar',
    send_whatsapp_status:  API_BASE_URL + 'proxy/evolution/send-status',
    send_delivery_details: API_BASE_URL + 'proxy/evolution/send-delivery-details',
    get_finalized_orders_by_date: API_BASE_URL + 'pedidos/listar-por-data',
    get_finalized_order_by_code: API_BASE_URL + 'pedido/buscar-finalizado-por-codigo', 
    cancel_order:          API_BASE_URL +  'pedido/cancelar',
    finalize_order_and_table: API_BASE_URL + 'pedido/finalizar-e-liberar-mesa',
    add_item_to_order:     API_BASE_URL + 'pedido/adicionar-item',
    remove_item_from_order: API_BASE_URL + 'pedido/remover-item',
    finalize_order_with_services: API_BASE_URL + 'pedido/finalizar-com-servicos',
    get_new_orders_and_mark: API_BASE_URL + 'rpc/obter_e_marcar_pedidos_novos', 

    emitir_nfce:           API_BASE_URL + 'fiscal/emitir-nfce',
    retorno_status_fiscal: API_BASE_URL + 'fiscal/retorno-status',
    download_documento_fiscal: API_BASE_URL + 'fiscal/download',
    
    get_all_tables:        API_BASE_URL + 'mesas/listar',
    update_table_status:   API_BASE_URL + 'mesa/atualizar-status', 
    create_table:          API_BASE_URL + 'mesas/criar',
    delete_table:          API_BASE_URL + 'mesas/deletar',
    update_table_assignments: API_BASE_URL + 'mesas/atualizar-atribuicao',
    clear_table_assignments:  API_BASE_URL + 'mesas/limpar-atribuicao',
    
    get_all_garcons:       API_BASE_URL + 'garcons/listar',
    create_garcom:         API_BASE_URL + 'garcom/criar',
    update_garcom:         API_BASE_URL + 'garcom/atualizar',
    delete_garcom:         API_BASE_URL + 'garcom/deletar',
    garcom_login:          API_BASE_URL + 'garcom/login',
    get_garcons_resumo:    API_BASE_URL + 'garcons/resumo',
    
    get_all_insumos:       API_BASE_URL + 'insumos/listar',
    create_insumo:         API_BASE_URL + 'insumo/criar',
    update_insumo:         API_BASE_URL + 'insumo/atualizar',
    delete_insumo:         API_BASE_URL + 'insumo/deletar',
    get_ficha_produto:     API_BASE_URL + 'produto/ficha/listar',
    add_insumo_ficha:      API_BASE_URL + 'produto/ficha/adicionar',
    remove_insumo_ficha:   API_BASE_URL + 'produto/ficha/remover',
    get_all_products_with_cmv: API_BASE_URL + 'produtos/listar-com-cmv',
    
    get_rentabilidade_produtos: API_BASE_URL + 'relatorios/rentabilidade',
    get_dre_report:             API_BASE_URL + 'relatorios/dre',
    get_ranking_produtos:       API_BASE_URL + 'relatorios/ranking-produtos',
    get_sold_products_report:   API_BASE_URL + 'relatorios/produtos-vendidos',

    add_stock_entry:       API_BASE_URL + 'estoque/entrada',
    add_stock_exit:        API_BASE_URL + 'estoque/saida-manual',
    reverse_stock_movement: API_BASE_URL + 'estoque/estornar',
    get_stock_history:     API_BASE_URL + 'estoque/historico',
    
    get_operational_costs:    API_BASE_URL + 'custos/listar',
    create_operational_cost:  API_BASE_URL + 'custos/criar',
    delete_operational_cost:  API_BASE_URL + 'custos/deletar',

    get_loja_config:       API_BASE_URL + 'loja/config/obter',
    update_loja_config:    API_BASE_URL + 'loja/config/atualizar',
    update_loja_status:    API_BASE_URL + 'loja/status/atualizar',
    call_ia_proxy:         API_BASE_URL + 'ia/proxy/suporte',
    endereco_validar_raio: API_BASE_URL + 'endereco/validar-raio',
};  

export const ZIPLINE_CONFIG = {
    upload: window.ENVIRONMENT_CONFIG?.ZIPLINE_UPLOAD_URL,
    delete: window.ENVIRONMENT_CONFIG?.ZIPLINE_DELETE_URL,
};

export const APP_CONFIG = {
    origemCores: { 
        'DELIVERY': 'bg-blue-500', 
        'WHATSAPP': 'bg-green-500', 
        'IFOOD': 'bg-red-500', 
        'MESA': 'bg-purple-500', 
        'BALCAO': 'bg-yellow-500',
        'RETIRADA': 'bg-pink-500'
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
    statusFlowRetirada: [ 
        { text: 'ACEITAR', textCompleted: 'ACEITO', nextStatus: 'EM_PREPARO', requiredStatus: 'CONFIRMADO' },
        { text: 'EM PREPARO', textCompleted: 'PRONTO P/ RETIRADA', nextStatus: 'PRONTO_PARA_RETIRADA', requiredStatus: 'EM_PREPARO' },
        { text: 'FINALIZAR', isFinalAction: true, nextStatus: 'ENTREGUE', requiredStatus: 'PRONTO_PARA_RETIRADA' }
    ],
    flowOrder: ['CONFIRMADO', 'EM_PREPARO', 'PRONTO_PARA_ENTREGA', 'PRONTO_PARA_RETIRADA', 'A_CAMINHO', 'ENTREGUE', 'CANCELADO']
};

if (typeof window !== 'undefined') {
    window.API_CONFIG = API_ENDPOINTS;
    window.ZIPLINE_CONFIG = ZIPLINE_CONFIG;
    window.APP_CONFIG = APP_CONFIG;
}