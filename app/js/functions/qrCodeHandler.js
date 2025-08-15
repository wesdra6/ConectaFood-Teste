
/**
 * @param {string} elementId - O ID do elemento onde o QR Code será renderizado.
 */
export function generateAndDisplayQRCode(elementId) {
    const qrCodeContainer = document.getElementById(elementId);
    
    if (window.innerWidth >= 768 && qrCodeContainer) {
        console.log("QR Code Handler: Detectado desktop, gerando código...");

        const currentUrl = window.location.href;

        qrCodeContainer.innerHTML = '';

        new QRCode(qrCodeContainer, {
            text: currentUrl,
            width: 160, 
            height: 160,
            colorDark: "#ff6b35", 
            colorLight: "#00000000", 
            correctLevel: QRCode.CorrectLevel.H
        });

        console.log(`QR Code gerado para a URL: ${currentUrl}`);
    }
}