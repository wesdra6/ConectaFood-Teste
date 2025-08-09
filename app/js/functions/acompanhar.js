// --- START OF FILE js/functions/acompanhar.js ---

import { fetchDeN8N } from './api.js';

const STATUS_INFO = {
    'CONFIRMADO':          { texto: 'Pedido Confirmado', icone: 'bi-patch-check-fill' },
    'EM_PREPARO':          { texto: 'Em Preparo na Cozinha', icone: 'bi-egg-fried' },
    'PRONTO_PARA_ENTREGA': { texto: 'Pronto para Entrega', icone: 'bi-box-seam-fill' },
    'A_CAMINHO':           { texto: 'Pedido a Caminho', icone: 'bi-bicycle' },
    'ENTREGUE':            { texto: 'Entregue com Sucesso!', icone: 'bi-house-heart-fill' },
    'CANCELADO':           { texto: 'Pedido Cancelado', icone: 'bi-x-circle-fill' }
};
const flowOrder = ['CONFIRMADO', 'EM_PREPARO', 'PRONTO_PARA_ENTREGA', 'A_CAMINHO', 'ENTREGUE'];

async function carregarConfiguracoesDaLoja() {
    try {
        const configs = await fetchDeN8N(window.N8N_CONFIG.get_loja_config);
        if (configs && configs.length > 0) {
            const { nome_loja, logo_vitrine_url } = configs[0];
            const logoContainer = document.getElementById('logo-acompanhar-container');

            document.title = `Acompanhar Pedido - ${nome_loja || 'Meu Negócio'}`;

            if (logo_vitrine_url) {
                logoContainer.innerHTML = `<img src="${logo_vitrine_url}" alt="${nome_loja}" class="max-h-20 w-auto">`;
            } else if (nome_loja) {
                logoContainer.innerHTML = `<span class="text-2xl font-bold text-principal">${nome_loja}</span>`;
            } else {
                logoContainer.innerHTML = `<span class="text-2xl font-bold text-principal">Meu Negócio</span>`;
            }
        }
    } catch (error) {
        console.error("Erro ao carregar as configurações da loja:", error);
        const logoContainer = document.getElementById('logo-acompanhar-container');
        if (logoContainer) {
            logoContainer.innerHTML = `<span class="text-2xl font-bold text-principal">Meu Negócio</span>`;
        }
    }
}

function renderizarMensagemInicial() {
    const container = document.getElementById('resultado-busca');
    const msgSucesso = document.getElementById('msg-sucesso');
    
    if (msgSucesso) msgSucesso.style.display = 'none';
    
    if (container) {
        container.innerHTML = `<div class="max-w-2xl bg-sidebar p-6 rounded-lg text-center"><i class="bi bi-whatsapp text-5xl text-green-400 mb-4"></i><h2 class="text-2xl font-bold">Fique de olho no seu Zap! 😉</h2><p class="text-texto-muted mt-2">Enviaremos todas as atualizações do seu pedido diretamente no seu WhatsApp.</p><p class="text-texto-muted mt-4 text-sm">Mas, se a ansiedade bater, pode digitar o código do pedido lá em cima para espiar.</p></div>`;
    }
}


function renderizarStatus(pedido) {
    const container = document.getElementById('resultado-busca');
    if (!pedido || !pedido.status) {
        container.innerHTML = `<div class="text-center p-8 bg-card rounded-lg shadow-lg max-w-md"><i class="bi bi-search text-5xl text-red-500"></i><h3 class="text-2xl font-bold mt-4">Pedido não encontrado</h3><p class="text-texto-muted">Nenhum pedido encontrado com esse código. Verifique e tente novamente.</p></div>`;
        return;
    }

    const primeiroNome = pedido.nome_cliente ? pedido.nome_cliente.split(' ')[0] : 'Cliente';
    const idPublico = pedido.id_pedido_publico || '????';

    const saudacaoHtml = `
        <div class="text-center mb-8">
            <h2 class="text-3xl font-bold">Então, <span class="text-principal capitalize">${primeiroNome.toLowerCase()}</span>!</h2>
            <p class="text-texto-muted mt-1">Bora dar uma espiada no seu pedido <span class="font-semibold text-white">#${idPublico}</span>? 👀👇</p>
        </div>
    `;

    const statusAtualIndex = flowOrder.indexOf(pedido.status);
    let timelineHtml = '';
    flowOrder.forEach((status, index) => {
        const info = STATUS_INFO[status];
        const isCompleted = index <= statusAtualIndex;
        const isActive = index === statusAtualIndex;
        timelineHtml += `<div class="relative flex items-start sm:items-center mb-8 last:mb-0"><div class="flex flex-col items-center mr-4"><div class="flex items-center justify-center w-12 h-12 rounded-full ${isCompleted ? 'bg-principal' : 'bg-sidebar'} border-2 ${isActive ? 'border-principal animate-pulse' : 'border-borda'} z-10 flex-shrink-0"><i class="bi ${info.icone} text-2xl"></i></div>${index < flowOrder.length - 1 ? '<div class="w-1 h-20 bg-borda"></div>' : ''}</div><div class="bg-card p-4 rounded-lg flex-grow mt-1 sm:mt-0"><h4 class="font-bold text-lg ${isCompleted ? 'text-white' : 'text-texto-muted'}">${info.texto}</h4>${isActive ? `<p class="text-sm text-green-400 font-semibold">Seu pedido está nesta etapa!</p>` : ''}</div></div>`;
    });

    container.innerHTML = `<div class="max-w-2xl bg-sidebar p-4 sm:p-6 rounded-lg">${saudacaoHtml}<div>${timelineHtml}</div></div>`;
}

async function buscarPedido(codigo) {
    const container = document.getElementById('resultado-busca');
    const msgSucesso = document.getElementById('msg-sucesso');
    if (msgSucesso) msgSucesso.style.display = 'none';
    if(container) container.innerHTML = `<p class="text-center animate-pulse text-lg">Buscando seu pedido, aguenta aí...</p>`;
    
    try {
        const codigoFormatado = codigo.toUpperCase();
        const url = `${window.N8N_CONFIG.get_order_status}?id=${codigoFormatado}`;
        
        const resposta = await fetchDeN8N(url);
        const pedido = (Array.isArray(resposta) && resposta.length > 0) ? resposta[0] : null;
        renderizarStatus(pedido);

    } catch (error) {
        console.error("Erro na busca do pedido:", error);
        container.innerHTML = `<div class="text-center p-8 bg-card rounded-lg shadow-lg max-w-md"><i class="bi bi-wifi-off text-5xl text-red-500"></i><h3 class="text-2xl font-bold mt-4">Erro de Comunicação</h3><p class="text-texto-muted">Não conseguimos verificar o status agora.</p></div>`;
    }
}

export function initAcompanharPage() {
    console.log("Maestro: Página de Acompanhamento (Modo Consulta) iniciada. 🎵");
    carregarConfiguracoesDaLoja();
    
    const form = document.getElementById('form-busca-pedido');
    const inputCodigo = document.getElementById('codigo-pedido');
    const msgSucesso = document.getElementById('msg-sucesso');
    const resultadoBusca = document.getElementById('resultado-busca');

    // 👇 ELE AGORA OLHA A PISTA CERTA! 👇
    if (localStorage.getItem('pedidoSucessoCliente') === 'true') {
        if(msgSucesso) msgSucesso.style.display = 'block';
        // 👇 E SÓ APAGA A PISTA DELE 👇
        localStorage.removeItem('pedidoSucessoCliente');
        if (resultadoBusca) resultadoBusca.innerHTML = ''; 
    } else {
        renderizarMensagemInicial();
    }
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const codigo = inputCodigo.value.trim();
        if (codigo) {
            buscarPedido(codigo);
        }
    });
}
// --- END OF FILE js/functions/acompanhar.js ---