import { supabase } from '../supabaseClient.js';
import { fetchDeAPI } from './api.js';
import { API_ENDPOINTS } from '../config.js';

(async () => {
    const path = window.location.pathname;

    // ✅ CORREÇÃO FINAL E DEFINITIVA DA LÓGICA 👇
    // Lista de páginas que o Vigia DEVE IGNORAR.
    const paginasDeExcecao = ['/login.html', '/bloqueado.html'];

    // Verifica se o final do 'path' corresponde a alguma das exceções.
    // Usamos 'some' e 'endsWith' para garantir que funcione mesmo se o caminho completo for complexo.
    const isPaginaExcecao = paginasDeExcecao.some(excecao => path.endsWith(excecao));

    if (isPaginaExcecao) {
        console.log(`VIGIA 9.0 (Inteligente): Página de exceção (${path}) detectada. Missão abortada aqui.`);
        return;
    }

    console.log(`VIGIA 9.0: Patrulhando a rota: ${path}. Verificando status geral da loja... 🚦`);
    
    try {
        const configs = await fetchDeAPI(API_ENDPOINTS.get_loja_config);
        
        if (configs && configs.length > 0) {
            const { cliente_ativo } = configs[0];

            if (cliente_ativo === false) {
                console.log("VIGIA 9.0: LOJA INATIVA. Bloqueio geral ativado! 🛑");
                // Tenta deslogar, mas não trava o processo se falhar.
                await supabase.auth.signOut().catch(err => console.warn("Vigia: Falha no logout durante bloqueio, mas prosseguindo.", err));
                window.location.replace('bloqueado.html'); 
                return;
            }
            console.log("VIGIA 9.0: Loja ATIVA. Acesso liberado. ✅");

        } else {
            throw new Error("Configurações da loja não encontradas ou resposta inválida da API.");
        }

    } catch (error) {
        console.error("VIGIA 9.0: Erro crítico ao verificar status. Acionando bloqueio de segurança.", error);
        await supabase.auth.signOut().catch(err => console.warn("Vigia: Falha no logout durante erro, prosseguindo.", err));
        window.location.replace('bloqueado.html'); 
    }
})();