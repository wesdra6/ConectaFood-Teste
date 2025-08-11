// NOVO ARQUIVO: js/authVigia.js

// Função auto-executável para não poluir o escopo global
(async () => {
    // Pega a URL base do N8N direto do config.js que já deve estar carregado
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

            // A REGRA É CLARA: Se cliente_ativo for false, bloqueia na hora!
            if (cliente_ativo === false) {
                // Evita loops de redirecionamento se já estiver na página de bloqueio
                if (!window.location.pathname.endsWith('bloqueado.html')) {
                    window.location.replace('bloqueado.html');
                }
            }
        }
    } catch (error) {
        console.error("VIGIA: Erro ao verificar status da loja.", error);
        // Em caso de falha de rede, é melhor deixar passar do que bloquear indevidamente.
        // Ou você pode optar por uma página de "erro de conexão" aqui.
    }
})();