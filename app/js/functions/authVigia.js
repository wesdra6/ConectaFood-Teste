
import { supabase } from '../supabaseClient.js';

(async () => {
    console.log("VIGIA 3.0: Verificando status da loja PRIMEIRO... 🚦");

    const API_BASE_URL = window.API_CONFIG?.get_loja_config.split('loja/config/obter')[0];

    if (!API_BASE_URL) {
        // Adiciona um pequeno delay para dar chance ao config.js carregar, se for o caso
        await new Promise(resolve => setTimeout(resolve, 100));
        // Se mesmo assim não carregar, aí sim damos o erro.
        if (!window.API_CONFIG) {
            console.error("VIGIA 3.0: Configuração do API não encontrada na window. Abortando verificação.");
            return;
        }
    }

    const endpoint = window.API_CONFIG.get_loja_config;

    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Falha na comunicação com o servidor.');

        const configs = await response.json();
        
        if (configs && configs.length > 0) {
            const { cliente_ativo } = configs[0];

            if (cliente_ativo === false) {
                console.log("VIGIA 3.0: Loja com status INATIVO. Bloqueio geral ativado! 🛑");
                
                if (!window.location.pathname.endsWith('bloqueado.html')) {
                    await supabase.auth.signOut(); 
                    window.location.replace('../bloqueado.html'); // Corrigido o caminho para sair da pasta /js/functions
                }
                
                return; 
            }
            
            console.log("VIGIA 3.0: Loja ATIVA. Acesso permitido. ✅");

        } else {
            throw new Error("Configurações da loja não encontradas no banco de dados.");
        }
    } catch (error) {
        console.error("VIGIA 3.0: Erro crítico ao verificar status da loja. Acionando bloqueio de segurança.", error);
        
        if (!window.location.pathname.endsWith('bloqueado.html')) {
            await supabase.auth.signOut();
            window.location.replace('../bloqueado.html'); // Corrigido o caminho
        }
    }
})();