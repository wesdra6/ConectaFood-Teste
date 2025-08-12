// js/authVigia.js

// Função auto-executável para não poluir o escopo global
(async () => {
    console.log("AuthVigia 2.0 Ativado. 🕵️‍♂️");

    // ➕ Pega a instância do Supabase que já deve estar globalmente disponível
    // Se o nome da variável for diferente (ex: supabaseClient), ajuste aqui.
    const supabase = window.supabase; 

    if (!supabase) {
        console.error("VIGIA: Instância do Supabase não encontrada. Abortando verificação.");
        return;
    }

    // ➕ Pega o usuário da sessão ATUAL. Se não houver, ele é null.
    const { data: { user } } = await supabase.auth.getUser();

    // =====================================================================
    // ➕ CAMADA 1: VERIFICAÇÃO DE USUÁRIO DEMO ➕
    // =====================================================================
    if (user) {
        const isDemoUser = user.email.endsWith('@demo.conecta.food');

        if (isDemoUser) {
            console.log("VIGIA: Usuário de demonstração detectado. Verificando permissões...");

            const { data: controle, error } = await supabase
                .from('acessos_demo_controle')
                .select('acesso_utilizado')
                .eq('user_id_supabase', user.id) // Busca pelo ID do usuário logado
                .single();

            if (error && error.code !== 'PGRST116') { // Ignora erro "PGRST116" (nenhuma linha encontrada)
                console.error("VIGIA: Erro ao consultar a tabela de controle de demo.", error);
                return; // Em caso de erro, melhor não fazer nada.
            }

            if (controle) {
                if (controle.acesso_utilizado) {
                    console.log("VIGIA: Acesso de demonstração já utilizado. Revogando acesso.");
                    await supabase.auth.signOut();
                    if (!window.location.pathname.endsWith('vendas.html')) {
                        window.location.replace('vendas.html'); // Leva para a página de vendas
                    }
                    return; // PARA a execução do script aqui.
                } else {
                    console.log("VIGIA: Primeiro acesso. Marcando como utilizado.");
                    // É O PRIMEIRO ACESSO DELE!
                    // Marca como utilizado para que ele não possa entrar de novo.
                    await supabase
                        .from('acessos_demo_controle')
                        .update({ acesso_utilizado: true })
                        .eq('user_id_supabase', user.id);
                }
            }
            // Se não encontrar o registro de controle, pode ser um admin logado no ambiente de demo.
            // Nesse caso, o vigia não faz nada e deixa ele passar.
        }
    }
    
    // =====================================================================
    // CAMADA 2: VERIFICAÇÃO DE LOJA ATIVA (Lógica original, intacta)
    // =====================================================================
    const N8N_BASE_URL = window.N8N_CONFIG?.get_loja_config.split('loja/config/obter')[0];

    if (!N8N_BASE_URL) {
        console.error("VIGIA: Configuração do N8N não encontrada. Abortando verificação.");
        return;
    }

    const endpoint = N8N_BASE_URL + 'loja/config/obter';

    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Falha na comunicação com o servidor.');

        const configs = await response.json();
        
        if (configs && configs.length > 0) {
            const { cliente_ativo } = configs[0];

            if (cliente_ativo === false) {
                if (!window.location.pathname.endsWith('bloqueado.html')) {
                    window.location.replace('bloqueado.html');
                }
            }
        }
    } catch (error) {
        console.error("VIGIA: Erro ao verificar status da loja.", error);
    }
})();
