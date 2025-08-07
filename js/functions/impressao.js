// NOVO ARQUIVO: js/functions/impressao.js

// Função para gerar o HTML do comprovante.
// Agora ela é uma ferramenta universal, exportada para quem quiser usar.
export function gerarHtmlImpressao(pedido, lojaConfig) {
    if (!pedido) return '<div>Erro: Pedido não encontrado para impressão.</div>';
    
    const config = lojaConfig || {};
    const dataHora = new Date().toLocaleString('pt-BR');
    
    let garcomHtml = '';
    if (pedido.garcom_responsavel) {
        garcomHtml = `<p><strong>Garçom:</strong> ${pedido.garcom_responsavel}</p>`;
    }

    let itensHtml = '';
    pedido.itens_pedido.forEach(item => {
        const precoItem = Number(item.preco_unitario || item.preco).toFixed(2);
        const nomeItem = item.item || item.nome;
        itensHtml += `<tr><td style="vertical-align: top;">(${item.quantidade}x)</td><td>${nomeItem}</td><td style="text-align: right;">${precoItem}</td></tr>`;
    });
    const totalPedido = Number(pedido.total).toFixed(2);

    return `<div style="width: 280px; font-size: 12px; font-family: 'Courier New', monospace;">
                <div style="text-align: center; margin-bottom: 10px;">
                    ${config.logo_url ? `<img src="${config.logo_url}" alt="Logo" style="max-width: 150px; max-height: 80px; margin: 0 auto;"/>` : ''}
                    <h2 style="margin: 5px 0 0 0; font-size: 16px;">${config.nome_loja || 'Meu Negócio'}</h2>
                    <p style="margin: 2px 0;">${config.endereco || 'Endereço não configurado'}</p>
                    <p style="margin: 2px 0;">${config.cnpj_cpf || ''}</p>
                    <p style="margin: 2px 0;">${config.telefone || ''}</p>
                </div>
                <hr style="border-top: 1px dashed #000; margin: 5px 0;">
                <p><strong>Pedido:</strong> #${pedido.id_pedido_publico}</p>
                <p><strong>Cliente:</strong> ${pedido.nome_cliente}</p>
                ${garcomHtml}
                <p><strong>Data:</strong> ${dataHora}</p>
                <hr style="border-top: 1px dashed #000; margin: 5px 0;">
                <table style="width: 100%;">
                    <thead><tr><th style="text-align: left;">Qtd</th><th style="text-align: left;">Item</th><th style="text-align: right;">Valor</th></tr></thead>
                    <tbody>${itensHtml}</tbody>
                </table>
                <hr style="border-top: 1px dashed #000; margin: 5px 0;">
                <div style="text-align: right; font-size: 14px; margin-top: 10px;"><strong>TOTAL: R$ ${totalPedido}</strong></div>
                <div style="text-align: center; margin-top: 15px; font-size: 11px;">
                    <p>${config.mensagem_rodape || 'Obrigado pela preferência!'}</p>
                    <p style="margin-top: 5px; font-weight: bold;">NÃO SERVE COMO CUPOM FISCAL</p>
                </div>
            </div>`;
}

// Função para disparar a impressão
export function imprimirComprovante(html) {
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close(); 
        printWindow.print();
        return true;
    } else {
        Swal.fire('Bloqueado!', 'Seu navegador bloqueou a janela de impressão. Por favor, habilite os pop-ups para este site.', 'warning');
        return false;
    }
}