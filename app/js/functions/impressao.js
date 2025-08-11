// REESCREVA O ARQUIVO COMPLETO: app/js/functions/impressao.js

export function gerarHtmlImpressao(pedido, lojaConfig, ehPreConta = false) {
    if (!pedido || !pedido.itens_pedido) return '';
    
    const config = lojaConfig || {};
    const dataHora = new Date().toLocaleString('pt-BR');
    
    let titulo = ehPreConta ? 'PRÉ-CONTA (Conferência)' : (config.nome_loja || 'Meu Negócio');
    
    // ➕ AQUI ESTÁ A LÓGICA NOVA 👇
    // Criamos uma variável que só gera o HTML do garçom se o nome dele existir no pedido.
    let garcomHtml = pedido.garcom_responsavel ? `<p><strong>Garçom:</strong> ${pedido.garcom_responsavel}</p>` : '';

    let itensHtml = (pedido.itens_pedido || []).map(item => {
        const precoItem = Number(item.preco_unitario || item.preco || 0).toFixed(2);
        const nomeItem = item.item || item.nome;
        return `<tr>
                    <td style="vertical-align: top; padding-right: 5px; padding-bottom: 2px;">(${item.quantidade}x)</td>
                    <td style="padding-bottom: 2px;">${nomeItem}</td>
                    <td style="text-align: right; padding-bottom: 2px;">${precoItem}</td>
                </tr>`;
    }).join('');

    const totalCalculado = pedido.itens_pedido.reduce((acc, item) => {
        return acc + ( (item.quantidade || 0) * (item.preco_unitario || item.preco || 0) );
    }, 0);
    const totalPedido = totalCalculado.toFixed(2);

    const mensagemFinal = ehPreConta
        ? `<p style="font-size: 10px; text-align: center; border: 1px dashed #000; padding: 5px; margin-top: 10px;">
             <b>Atenção:</b> Este é um comprovante de conferência.<br>
             Valores de Couvert e/ou Taxa de Serviço poderão ser adicionados na conta final.
           </p>`
        : `<p>${config.mensagem_rodape || 'Obrigado pela preferência!'}</p>
           <p style="margin-top: 5px; font-weight: bold;">NÃO SERVE COMO CUPOM FISCAL</p>`;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Impressão de Comprovante</title>
            <style>
                body { width: 280px; font-size: 12px; font-family: 'Courier New', monospace; color: #000; }
                .center { text-align: center; }
                .mb-10 { margin-bottom: 10px; }
                .m-0 { margin: 0; }
                .mt-5 { margin-top: 5px; }
                .mt-10 { margin-top: 10px; }
                .mt-15 { margin-top: 15px; }
                .fs-16 { font-size: 16px; }
                .fs-14 { font-size: 14px; }
                .fs-11 { font-size: 11px; }
                .fw-bold { font-weight: bold; }
                .text-right { text-align: right; }
                hr { border: 0; border-top: 1px dashed #000; margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 2px; }
                th:first-child, td:first-child { text-align: left; }
                th:nth-child(2), td:nth-child(2) { text-align: left; }
                th:last-child, td:last-child { text-align: right; }
                img { max-width: 150px; max-height: 80px; margin: 0 auto; }
            </style>
        </head>
        <body>
            <div class="center mb-10">
                ${config.logo_url ? `<img src="${config.logo_url}" alt="Logo"/>` : ''}
                <h2 class="m-0 mt-5 fs-16">${titulo}</h2>
                ${!ehPreConta ? `<p class="m-0">${config.endereco || ''}</p><p class="m-0">${config.cnpj_cpf || ''}</p><p class="m-0">${config.telefone || ''}</p>` : ''}
            </div>
            <hr>
            <p><strong>Pedido:</strong> #${pedido.id_pedido_publico}</p>
            <p><strong>Cliente:</strong> ${pedido.nome_cliente}</p>
            ${garcomHtml} <!-- E AQUI A GENTE IMPRIME A VARIÁVEL -->
            <p><strong>Data:</strong> ${dataHora}</p>
            <hr>
            <table>
                <thead><tr><th>Qtd</th><th>Item</th><th>Valor</th></tr></thead>
                <tbody>${itensHtml}</tbody>
            </table>
            <hr>
            <div class="text-right fs-14 mt-10"><strong>TOTAL: R$ ${totalPedido}</strong></div>
            
            <div class="center mt-15 fs-11">${mensagemFinal}</div>
        </body>
        </html>`;
}

export function imprimirComprovante(html) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    
    // Adiciona um pequeno delay para garantir que a imagem da logo tenha tempo de carregar
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    }, 500); // Meio segundo de "tolerância"

    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 1500);

    return true;
}