
(async () => {
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