
/**
 * Pega a URL atual e gera um QR Code para ser exibido na tela de bloqueio de desktop.
 * @param {string} elementId - O ID do elemento onde o QR Code será renderizado.
 */
export function generateAndDisplayQRCode(elementId) {
    const qrCodeContainer = document.getElementById(elementId);
    
    // Verifica se estamos no contexto de desktop e se o container existe
    if (window.innerWidth >= 768 && qrCodeContainer) {
        console.log("QR Code Handler: Detectado desktop, gerando código...");

        // Pega a URL atual da página
        const currentUrl = window.location.href;

        // Limpa o container antes de adicionar o novo QR Code
        qrCodeContainer.innerHTML = '';

        // Cria a instância do QR Code
        new QRCode(qrCodeContainer, {
            text: currentUrl,
            width: 160, // Tamanho em pixels
            height: 160,
            colorDark: "#ffffff", // Cor dos pontos do QR Code
            colorLight: "#00000000", // Fundo transparente
            correctLevel: QRCode.CorrectLevel.H
        });

        console.log(`QR Code gerado para a URL: ${currentUrl}`);
    }
}