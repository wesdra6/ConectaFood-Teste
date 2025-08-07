// --- START OF FILE js/entregador.js ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("Portal do Entregador: Pronto para a missão!");

    // Função para carregar a logo da loja
    async function carregarConfiguracoesDaLoja() {
        try {
            const response = await fetch(window.N8N_CONFIG.get_loja_config);
            if (!response.ok) throw new Error('Falha ao buscar config da loja');
            const configs = await response.json();
            
            if (configs && configs.length > 0) {
                const { nome_loja, logo_vitrine_url } = configs[0];
                const logoContainer = document.getElementById('logo-entregador-container');
                document.title = `Portal do Entregador - ${nome_loja || 'Meu Negócio'}`;

                if (logo_vitrine_url) {
                    logoContainer.innerHTML = `<img src="${logo_vitrine_url}" alt="${nome_loja}" class="max-h-16 w-auto">`;
                } else if (nome_loja) {
                    logoContainer.innerHTML = `<span class="text-2xl font-bold text-principal">${nome_loja}</span>`;
                }
            }
        } catch (error) {
            console.error("Erro ao carregar as configurações da loja:", error);
        }
    }

    // Função que envia os dados para o N8N
    async function finalizarEntrega(codigo) {
        Swal.fire({
            title: 'Confirmando entrega...',
            text: `Dando baixa no pedido #${codigo}. Aguarde!`,
            allowOutsideClick: false,
            background: '#2c2854',
            color: '#ffffff',
            didOpen: () => Swal.showLoading()
        });

        try {
            const response = await fetch(window.N8N_CONFIG.finalize_delivery, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo_pedido: codigo })
            });

            const resultado = await response.json();

            if (!response.ok || !resultado.success) {
                throw new Error(resultado.message || 'Erro na comunicação com o servidor.');
            }

            Swal.fire({
                icon: 'success',
                title: 'Valeu!',
                text: `O pedido #${codigo} foi finalizado com sucesso!`,
                background: '#2c2854',
                color: '#ffffff'
            });
            document.getElementById('codigo-pedido-entregador').value = ''; // Limpa o campo

        } catch (error) {
            console.error("Erro ao finalizar a entrega:", error);
            Swal.fire({
                icon: 'error',
                title: 'Não foi possível finalizar!',
                text: 'Verifique se o código do pedido está correto e tente novamente.',
                background: '#2c2854',
                color: '#ffffff'
            });
        }
    }

    // Ponto de entrada
    carregarConfiguracoesDaLoja();

    const form = document.getElementById('form-finalizar-entrega');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const inputCodigo = document.getElementById('codigo-pedido-entregador');
        const codigo = inputCodigo.value.trim().toUpperCase();

        if (codigo) {
            finalizarEntrega(codigo);
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Opa!',
                text: 'Você precisa digitar o código do pedido.',
                background: '#2c2854',
                color: '#ffffff'
            });
        }
    });
});
// --- END OF FILE js/entregador.js ---