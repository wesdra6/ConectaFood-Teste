// A URL agora será lida do nosso objeto de configuração global
// const WEBHOOK_URL_IA = "https://n8n-webhook.uptecnology.com.br/webhook/agente/suporte"; // LINHA REMOVIDA

// Elementos da DOM que vamos manipular
let botao, janela, corpoChat, form, input, btnFechar;

/**
 * Adiciona uma mensagem na tela do chat.
 * @param {string} texto - O conteúdo da mensagem.
 * @param {('user' | 'ia' | 'loading')} autor - Quem enviou a mensagem.
 */
function adicionarMensagem(texto, autor) {
    if (!corpoChat) return;

    // Remove a mensagem de "digitando..." se houver
    const loadingMsg = corpoChat.querySelector('.loading-message');
    if (loadingMsg) {
        loadingMsg.remove();
    }

    const divMensagem = document.createElement('div');
    divMensagem.classList.add('flex', 'items-end', 'gap-2', 'max-w-[85%]');

    let conteudoHtml = '';

    if (autor === 'user') {
        divMensagem.classList.add('self-end');
        conteudoHtml = `<div class="bg-principal p-3 rounded-lg rounded-br-none"><p class="text-white">${texto}</p></div>`;
    } else if (autor === 'ia') {
        divMensagem.classList.add('self-start');
        conteudoHtml = `
            <div class="w-8 h-8 bg-card rounded-full flex items-center justify-center flex-shrink-0"><i class="bi bi-robot"></i></div>
            <div class="bg-card p-3 rounded-lg rounded-bl-none"><p class="text-texto-muted">${texto}</p></div>
        `;
    } else if (autor === 'loading') {
        divMensagem.classList.add('self-start', 'loading-message');
        conteudoHtml = `
            <div class="w-8 h-8 bg-card rounded-full flex items-center justify-center flex-shrink-0"><i class="bi bi-robot"></i></div>
            <div class="bg-card p-3 rounded-lg rounded-bl-none">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-texto-muted rounded-full animate-bounce"></span>
                    <span class="w-2 h-2 bg-texto-muted rounded-full animate-bounce" style="animation-delay: 0.2s;"></span>
                    <span class="w-2 h-2 bg-texto-muted rounded-full animate-bounce" style="animation-delay: 0.4s;"></span>
                </div>
            </div>
        `;
    }

    divMensagem.innerHTML = conteudoHtml;
    corpoChat.appendChild(divMensagem);

    // Scroll automático para a última mensagem
    corpoChat.scrollTop = corpoChat.scrollHeight;
}

/**
 * Envia a pergunta do usuário para a API e aguarda a resposta.
 * @param {string} pergunta - A pergunta digitada pelo usuário.
 */
async function enviarPerguntaParaIA(pergunta) {
    adicionarMensagem(pergunta, 'user');
    adicionarMensagem('', 'loading'); // Mostra o "digitando..."

    try {
        const response = await fetch(window.API_CONFIG.call_ia_proxy, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pergunta: pergunta })
        });

        if (!response.ok) {
            throw new Error('A resposta da rede não foi ok.');
        }

        const data = await response.json();
        // A resposta do proxy da IA pode vir encapsulada
        const respostaIA = data[0]?.output || data.resposta || "Desculpe, não consegui processar sua pergunta agora.";

        adicionarMensagem(respostaIA, 'ia');

    } catch (error) {
        console.error('Erro ao chamar o Agente IA:', error);
        adicionarMensagem("Tive um probleminha de conexão. 😥 Poderia tentar de novo?", 'ia');
    }
}

/**
 * Alterna a visibilidade da janela do chat.
 */
function toggleJanela() {
    if (janela.classList.contains('hidden')) {
        janela.classList.remove('hidden');
        setTimeout(() => {
            janela.classList.remove('translate-y-8', 'opacity-0');
        }, 10);
    } else {
        janela.classList.add('translate-y-8', 'opacity-0');
        setTimeout(() => {
            janela.classList.add('hidden');
        }, 300);
    }
}

/**
 * Ponto de entrada: inicializa o chat, busca os elementos e adiciona os listeners.
 */
export function initAgenteIA() {
    // Roda somente na página principal (index.html), onde o chat flutuante existe
    if (!document.getElementById('dashboard-page')) {
        return;
    }

    console.log("Maestro: Agente IA de plantão! 🤖");

    // Mapeia os elementos do HTML
    botao = document.getElementById('agente-ia-botao');
    janela = document.getElementById('agente-ia-janela');
    corpoChat = document.getElementById('agente-ia-corpo');
    form = document.getElementById('agente-ia-form');
    input = document.getElementById('agente-ia-input');
    btnFechar = document.getElementById('agente-ia-fechar');

    if (!botao || !janela) return;

    // Adiciona os "escutadores" de eventos
    botao.addEventListener('click', toggleJanela);
    btnFechar.addEventListener('click', toggleJanela);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const pergunta = input.value.trim();
        if (pergunta) {
            enviarPerguntaParaIA(pergunta);
            input.value = '';
        }
    });

    // Mensagem de boas-vindas
    adicionarMensagem("Olá! Sou seu assistente virtual. Como posso te ajudar a gerenciar seu negócio hoje?", 'ia');
}