let carrinho = JSON.parse(localStorage.getItem('carrinhoLegalConnect')) || [];
let tipoPedido = 'ENTREGA'; // Pode ser 'ENTREGA' ou 'RETIRADA'
let pedidoMinimoDelivery = 0;
let taxaEntregaFixa = 0;

function salvarCarrinho() {
    localStorage.setItem('carrinhoLegalConnect', JSON.stringify(carrinho));
}

function atualizarCarrinhoUI() {
    const containerItens = document.getElementById('carrinho-itens');
    const totalEl = document.getElementById('carrinho-total');
    const contadorEl = document.getElementById('contador-carrinho');
    const btnFinalizar = document.getElementById('btn-finalizar-pedido'); 
    const avisoMinimoEl = document.getElementById('aviso-pedido-minimo');
    
    if(!containerItens || !totalEl || !contadorEl || !btnFinalizar || !avisoMinimoEl) return;

    containerItens.innerHTML = '';
    
    const produtosNoCarrinho = carrinho.filter(item => item.id !== 99999);
    const subtotalProdutos = produtosNoCarrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    
    let totalFinal = subtotalProdutos;
    let totalItensVisiveis = produtosNoCarrinho.reduce((acc, item) => acc + item.quantidade, 0);

    produtosNoCarrinho.forEach((item, index) => {
        const subtotalItem = item.preco * item.quantidade;
        const imagemPrincipal = (item.imagens_urls && item.imagens_urls.length > 0) ? item.imagens_urls[0] : 'https://via.placeholder.com/150';

        const itemHtml = `
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center flex-grow overflow-hidden">
                    <img src="${imagemPrincipal}" class="w-16 h-16 rounded-md object-cover mr-4 flex-shrink-0" alt="${item.nome}">
                    <div class="flex-grow min-w-0">
                        <p class="font-semibold leading-tight truncate">${item.nome}</p>
                        <div class="flex items-center mt-1">
                            <button onclick="carrinhoFunctions.diminuir(${index})" class="px-2 rounded-md bg-borda text-lg font-bold">-</button>
                            <span class="px-3 font-bold text-lg">${item.quantidade}</span>
                            <button onclick="carrinhoFunctions.aumentar(${index})" class="px-2 rounded-md bg-borda text-lg font-bold">+</button>
                        </div>
                    </div>
                </div>
                <div class="text-right flex flex-col items-end ml-4" style="min-width: 90px;">
                    <span class="font-bold text-principal">R$ ${subtotalItem.toFixed(2)}</span>
                    <button onclick="carrinhoFunctions.remover(${index})" class="text-texto-muted hover:text-red-500 mt-2"><i class="bi bi-trash-fill text-lg"></i></button>
                </div>
            </div>`;
        containerItens.innerHTML += itemHtml;
    });

    if (produtosNoCarrinho.length === 0) {
        containerItens.innerHTML = `<div class="text-center py-10 text-texto-muted"><i class="bi bi-cart-x text-5xl"></i><p class="mt-2 font-semibold">Seu carrinho está vazio.</p><p class="text-sm">Adicione delícias do nosso cardápio!</p></div>`;
    }

    if (tipoPedido === 'ENTREGA' && taxaEntregaFixa > 0) {
        totalFinal += taxaEntregaFixa;
        if (produtosNoCarrinho.length > 0) {
            containerItens.innerHTML += `<div class="border-t border-borda/50 pt-3 mt-4 text-sm"><div class="flex justify-between text-texto-muted"><span>Subtotal</span><span>R$ ${subtotalProdutos.toFixed(2)}</span></div><div class="flex justify-between text-texto-muted"><span>Taxa de Entrega</span><span>R$ ${taxaEntregaFixa.toFixed(2)}</span></div></div>`;
        }
    }

    totalEl.textContent = `R$ ${totalFinal.toFixed(2)}`;
    contadorEl.textContent = totalItensVisiveis;
    contadorEl.style.display = totalItensVisiveis > 0 ? 'flex' : 'none';

    // ✅ A LÓGICA FINAL E CORRETA ESTÁ AQUI 👇
    if (produtosNoCarrinho.length > 0) {
        // A regra do pedido mínimo só se aplica se for ENTREGA e o valor mínimo for maior que zero.
        if (tipoPedido === 'ENTREGA' && pedidoMinimoDelivery > 0 && subtotalProdutos < pedidoMinimoDelivery) {
            const faltante = pedidoMinimoDelivery - subtotalProdutos;
            avisoMinimoEl.textContent = `Faltam R$ ${faltante.toFixed(2).replace('.',',')} para o pedido mínimo de R$ ${pedidoMinimoDelivery.toFixed(2).replace('.',',')}.`;
            avisoMinimoEl.classList.remove('hidden');
            btnFinalizar.disabled = true;
            btnFinalizar.classList.add('bg-sidebar', 'cursor-not-allowed');
            btnFinalizar.classList.remove('bg-principal', 'hover:bg-orange-600');
            btnFinalizar.removeAttribute('data-bs-toggle');
        } else {
            // Para RETIRADA ou se o valor mínimo for atingido/inexistente, o botão é liberado.
            avisoMinimoEl.classList.add('hidden');
            btnFinalizar.disabled = false;
            btnFinalizar.classList.remove('bg-sidebar', 'cursor-not-allowed');
            btnFinalizar.classList.add('bg-principal', 'hover:bg-orange-600');
            btnFinalizar.setAttribute('data-bs-toggle', 'modal');
        }
    } else {
        avisoMinimoEl.classList.add('hidden');
        btnFinalizar.disabled = true;
        btnFinalizar.classList.add('bg-sidebar', 'cursor-not-allowed');
        btnFinalizar.classList.remove('bg-principal', 'hover:bg-orange-600');
        btnFinalizar.removeAttribute('data-bs-toggle');
    }
}

const carrinhoFunctions = {
    adicionar: (produto) => {
        const itemExistente = carrinho.find(item => item.id === produto.id);
        if (itemExistente) {
            itemExistente.quantidade++;
        } else {
            carrinho.push({ ...produto, quantidade: 1 });
        }
        salvarCarrinho();
        atualizarCarrinhoUI();
    },

    aumentar: (index) => {
        const produto = carrinho.filter(item => item.id !== 99999)[index];
        if (produto) {
            produto.quantidade++;
            salvarCarrinho();
            atualizarCarrinhoUI();
        }
    },

    diminuir: (index) => {
        const produtosNoCarrinho = carrinho.filter(item => item.id !== 99999);
        const produto = produtosNoCarrinho[index];
        if (produto) {
            produto.quantidade--;
            if (produto.quantidade <= 0) {
                carrinho = carrinho.filter(item => item.id !== produto.id);
            }
            salvarCarrinho();
            atualizarCarrinhoUI();
        }
    },

    remover: (index) => {
        const produtosNoCarrinho = carrinho.filter(item => item.id !== 99999);
        const produtoParaRemover = produtosNoCarrinho[index];
        if (produtoParaRemover) {
            carrinho = carrinho.filter(item => item.id !== produtoParaRemover.id);
            salvarCarrinho();
            atualizarCarrinhoUI();
        }
    },

    limpar: () => {
        carrinho = [];
        salvarCarrinho();
        atualizarCarrinhoUI();
    },
    
    setValoresConfig: (configs) => {
        pedidoMinimoDelivery = Number(configs.minimo) || 0;
        taxaEntregaFixa = Number(configs.taxa) || 0;
        atualizarCarrinhoUI();
    },

    setTipoPedido: (tipo) => {
        if (tipo === tipoPedido) return;
        tipoPedido = tipo;
        
        document.getElementById('btn-tipo-entrega')?.classList.toggle('active', tipo === 'ENTREGA');
        document.getElementById('btn-tipo-retirada')?.classList.toggle('active', tipo === 'RETIRADA');
        
        atualizarCarrinhoUI();
    },

    getTipoPedido: () => tipoPedido,
    
    getItens: () => carrinho,
    
    getTotal: () => {
        const subtotal = carrinho.filter(item => item.id !== 99999).reduce((acc, item) => acc + item.preco * item.quantidade, 0);
        return tipoPedido === 'ENTREGA' ? subtotal + taxaEntregaFixa : subtotal;
    },
    
    getItensParaPedido: () => {
        let itensFinais = carrinho.map(item => ({ 
            produto_id: item.id, 
            quantidade: item.quantidade, 
            preco_unitario: item.preco 
        }));
        
        if (tipoPedido === 'ENTREGA' && taxaEntregaFixa > 0) {
            itensFinais.push({
                produto_id: 99999,
                quantidade: 1,
                preco_unitario: taxaEntregaFixa
            });
        }
        return itensFinais;
    }
};

export function initCarrinho() {
    window.carrinhoFunctions = carrinhoFunctions;
    document.getElementById('btn-tipo-entrega')?.addEventListener('click', () => carrinhoFunctions.setTipoPedido('ENTREGA'));
    document.getElementById('btn-tipo-retirada')?.addEventListener('click', () => carrinhoFunctions.setTipoPedido('RETIRADA'));
    atualizarCarrinhoUI(); 
}