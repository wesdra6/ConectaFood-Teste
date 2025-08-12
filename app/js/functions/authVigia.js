// js/authVigia.js

// Função auto-executável para não poluir o escopo global
(async () => {
    console.log("AuthVigia 3.0 Ativado. 🕵️‍♂️");

    const supabase = window.supabase; 

    if (!supabase) {
        console.error("VIGIA: Instância do Supabase não encontrada. Abortando verificação.");
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    // =====================================================================
    // CAMADA 1: VERIFICAÇÃO DE USUÁRIO DEMO E MANIPULAÇÃO DA UI
    // =====================================================================
    if (user) {
        const isDemoUser = user.email.endsWith('@demo.conecta.food');

        if (isDemoUser) {
            console.log("VIGIA: Usuário de demonstração detectado.");
            
            // ➕ AÇÃO IMEDIATA: Aplica a classe de bloqueio na UI
            document.body.classList.add('modo-demo');

            const { data: controle, error } = await supabase
                .from('acessos_demo_controle')
                .select('acesso_utilizado')
                .eq('id', user.id) // 🎯 CORREÇÃO: A coluna é 'id', não 'user_id_supabase'
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error("VIGIA: Erro ao consultar a tabela de controle de demo.", error);
                return;
            }

            if (controle) {
                if (controle.acesso_utilizado) {
                    console.log("VIGIA: Acesso de demonstração já utilizado. Revogando acesso.");
                    await supabase.auth.signOut();
                    if (!window.location.pathname.endsWith('vendas.html')) {
                        window.location.replace('vendas.html');
                    }
                    return;
                } else {
                    console.log("VIGIA: Primeiro acesso. Marcando como utilizado e exibindo aviso.");
                    
                    // ➕ AVISO ÚTIL: Mostra um toast na primeira vez que ele loga
                    // Usando a biblioteca Swal (SweetAlert2) que já usamos na Torre
                    if (window.Swal) {
                        const Toast = Swal.mixin({
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 5000,
                            timerProgressBar: true,
                            didOpen: (toast) => {
                                toast.onmouseenter = Swal.stopTimer;
                                toast.onmouseleave = Swal.resumeTimer;
                            }
                        });
                        Toast.fire({
                            icon: 'info',
                            title: 'Você está em modo de demonstração!',
                            background: '#2c2854', // Cor da sidebar
                            color: '#ffffff'
                        });
                    }

                    await supabase
                        .from('acessos_demo_controle')
                        .update({ acesso_utilizado: true })
                        .eq('id', user.id); // 🎯 CORREÇÃO
                }
            }
        }
    }
    
    // =====================================================================
    // CAMADA 2: VERIFICAÇÃO DE LOJA ATIVA (Lógica original, intacta)
    // =====================================================================
    const N8N_BASE_URL = window.N8N_CONFIG?.get_loja_config.split('loja/config/obter')[0];

    if (!N8N_BASE_URL) {
        // ... Lógica de erro do N8N ...
        return;
    }

    const endpoint = N8N_BASE_URL + 'loja/config/obter';

    try {
        // ... Lógica de verificação de cliente_ativo ...
    } catch (error) {
        console.error("VIGIA: Erro ao verificar status da loja.", error);
    }
})();
