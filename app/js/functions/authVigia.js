// js/functions/authVigia.js

// ➖ REMOVEMOS A FUNÇÃO AUTO-EXECUTÁVEL QUE ENVOLVIA TODO O CÓDIGO ➖

// ➕ EXPORTAMOS a função principal para que ela possa ser chamada pelo main.js ➕
export async function iniciarVigia() {
    console.log("AuthVigia 3.1 Ativado. 🕵️‍♂️");

    // Pega a instância do Supabase que já deve estar globalmente disponível
    const supabase = window.supabase; 

    if (!supabase) {
        console.error("VIGIA: Instância do Supabase não foi encontrada no momento da execução.");
        return;
    }

    // Pega o usuário da sessão ATUAL. Se não houver, ele é null.
    // Agora temos certeza que supabase.auth existe.
    const { data: { user } } = await supabase.auth.getUser();

    // =====================================================================
    // CAMADA 1: VERIFICAÇÃO DE USUÁRIO DEMO E MANIPULAÇÃO DA UI
    // =====================================================================
    if (user) {
        const isDemoUser = user.email.endsWith('@demo.conecta.food');

        if (isDemoUser) {
            console.log("VIGIA: Usuário de demonstração detectado.");
            
            // Aplica a classe de bloqueio na UI
            document.body.classList.add('modo-demo');

            const { data: controle, error } = await supabase
                .from('acessos_demo_controle')
                .select('acesso_utilizado')
                .eq('id', user.id) // Busca pelo ID do usuário logado
                .single();

            if (error && error.code !== 'PGRST116') { // Ignora erro "nenhuma linha encontrada"
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
                    return; // PARA a execução do script aqui.
                } else {
                    console.log("VIGIA: Primeiro acesso. Marcando como utilizado e exibindo aviso.");
                    
                    // Mostra um toast na primeira vez que ele loga
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
                            background: '#2c2854',
                            color: '#ffffff'
                        });
                    }

                    await supabase
                        .from('acessos_demo_controle')
                        .update({ acesso_utilizado: true })
                        .eq('id', user.id);
                }
            }
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
}
