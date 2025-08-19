// REESCREVA O ARQUIVO COMPLETO: js/functions/authVigia.js

// Importa a instância do Supabase para verificar a sessão do admin
import { supabase } from '../supabaseClient.js';

// Função auto-executável para não poluir o escopo global
(async () => {
    console.log("VIGIA 3.0: Verificando status da loja PRIMEIRO... 🚦");

    // ===================================================================
    // Passo 1: A loja está em dia? Essa é a ÚNICA pergunta que importa no começo.
    // ===================================================================

    // Pega a URL base do N8N direto do config.js que já deve estar carregado
    const N8N_BASE_URL = window.N8N_CONFIG?.get_loja_config.split('loja/config/obter')[0];

    if (!N8N_BASE_URL) {
        console.error("VIGIA 3.0: Configuração do N8N não encontrada. Abortando verificação.");
        return;
    }

    const endpoint = N8N_BASE_URL + 'loja/config/obter';

    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Falha na comunicação com o servidor.');

        const configs = await response.json();
        
        if (configs && configs.length > 0) {
            // Usando a coluna 'cliente_ativo' para verificar a adimplência.
            // Certifique-se que este campo existe na sua tabela loja_config.
            const { cliente_ativo } = configs[0];

            // A REGRA MESTRA: Se o cliente está INATIVO, bloqueio GERAL e IMEDIATO.
            if (cliente_ativo === false) {
                console.log("VIGIA 3.0: Loja com status INATIVO. Bloqueio geral ativado! 🛑");
                
                // Redireciona para a página de bloqueio
                if (!window.location.pathname.endsWith('bloqueado.html')) {
                    // Limpa qualquer sessão de admin para forçar o logout
                    await supabase.auth.signOut(); 
                    window.location.replace('bloqueado.html');
                }
                
                // PARA a execução aqui. Nada mais importa.
                return; 
            }
            
            // Se chegou até aqui, significa que cliente_ativo é TRUE.
            console.log("VIGIA 3.0: Loja ATIVA. Acesso permitido. ✅");
            // A vida segue. O script termina e a página carrega normalmente
            // para qualquer pessoa (admin ou cliente final).

        } else {
            // Se não encontrar configs, é um problema sério. 
            // Por segurança, vamos tratar como inativo.
            throw new Error("Configurações da loja não encontradas no banco de dados.");
        }
    } catch (error) {
        console.error("VIGIA 3.0: Erro crítico ao verificar status da loja. Acionando bloqueio de segurança.", error);
        
        // Em caso de qualquer erro de comunicação ou de dados, a regra mais segura
        // é bloquear o acesso para evitar exposição indevida.
        if (!window.location.pathname.endsWith('bloqueado.html')) {
            await supabase.auth.signOut();
            window.location.replace('bloqueado.html');
        }
    }
})();