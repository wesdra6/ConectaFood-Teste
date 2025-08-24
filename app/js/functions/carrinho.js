
let carrinho = JSON.parse(localStorage.getItem('carrinhoLegalConnect')) || [];

function salvarCarrinho() {
    localStorage.setItem('carrinhoLegalConnect', JSON.stringify(carrinho));
}

// Função central que atualiza toda a interface do carrinho
function atualizarCarrinhoUI() {
    const containerItens = document.getElementById('carrinho-itens');
    const totalEl = document.getElementById('carrinho-total');
    const contadorEl = document.getElementById('contador-carrinho');
    const btnFinalizar = document.getElementById('btn-finalizar-pedido'); 
    
    if(!containerItens || !totalEl || !contadorEl || !btnFinalizar) return;

    containerItens.innerHTML = '';
    
    let totalFinal = 0;
    let totalItensVisiveis = 0;

    const produtosNoCarrinho = carrinho.filter(item => item.id !== 99999);
    const taxaNoCarrinho = carrinho.find(item => item.id === 99999);

    produtosNoCarrinho.forEach((item, index) => {
        const subtotalItem = item.preco * item.quantidade;
        totalFinal += subtotalItem;
        totalItensVisiveis += item.quantidade;
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

    if (carrinho.length === 0 || produtosNoCarrinho.length === 0) {
        containerItens.innerHTML = `
            <div class="text-center py-10 text-texto-muted">
                <i class="bi bi-cart-x text-5xl"></i>
                <p class="mt-2 font-semibold">Seu carrinho está vazio.</p>
                <p class="text-sm">Adicione delícias do nosso cardápio!</p>
            </div>`;
    } else if (taxaNoCarrinho) {
        totalFinal += taxaNoCarrinho.preco;
        containerItens.innerHTML += `
            <div class="border-t border-borda/50 pt-3 mt-4 text-sm">
                <div class="flex justify-between text-texto-muted">
                    <span>Subtotal</span>
                    <span>R$ ${(totalFinal - taxaNoCarrinho.preco).toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-texto-muted">
                    <span>Taxa de Entrega</span>
                    <span>R$ ${taxaNoCarrinho.preco.toFixed(2)}</span>
                </div>
            </div>
        `;
    }

    totalEl.textContent = `R$ ${totalFinal.toFixed(2)}`;
    contadorEl.textContent = totalItensVisiveis;
    contadorEl.style.display = totalItensVisiveis > 0 ? 'flex' : 'none';

    if (produtosNoCarrinho.length > 0) {
        btnFinalizar.disabled = false;
        btnFinalizar.classList.remove('bg-sidebar', 'cursor-not-allowed');
        btnFinalizar.classList.add('bg-principal', 'hover:bg-orange-600');
        btnFinalizar.setAttribute('data-bs-toggle', 'modal');
    } else {
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
        salvarCarrinho(); // ✅ Salva a foto
        atualizarCarrinhoUI();
    },

    aumentar: (index) => {
        const produto = carrinho.filter(item => item.id !== 99999)[index];
        if (produto) {
            produto.quantidade++;
            salvarCarrinho(); // ✅ Salva a foto
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
            salvarCarrinho(); // ✅ Salva a foto
            atualizarCarrinhoUI();
        }
    },

    remover: (index) => {
        const produtosNoCarrinho = carrinho.filter(item => item.id !== 99999);
        const produtoParaRemover = produtosNoCarrinho[index];
        if (produtoParaRemover) {
            carrinho = carrinho.filter(item => item.id !== produtoParaRemover.id);
            salvarCarrinho(); // ✅ Salva a foto
            atualizarCarrinhoUI();
        }
    },

    limpar: () => {
        carrinho = [];
        salvarCarrinho(); // ✅ Salva a foto (vazia)
        atualizarCarrinhoUI();
    },

    getItens: () => carrinho,
    
    getTotal: () => carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0),

    setTaxaEntrega: (valor) => {
        const valorTaxa = Number(valor) || 0;
        const indexTaxa = carrinho.findIndex(item => item.id === 99999);

        if (valorTaxa > 0) {
            const itemTaxa = {
                id: 99999, nome: 'Taxa de Entrega', preco: valorTaxa,
                quantidade: 1, tipo_item: 'TAXA'
            };
            if (indexTaxa > -1) {
                carrinho[indexTaxa] = itemTaxa;
            } else {
                carrinho.push(itemTaxa);
            }
        } else if (indexTaxa > -1) {
            carrinho.splice(indexTaxa, 1);
        }
        salvarCarrinho(); // ✅ Salva a foto
        atualizarCarrinhoUI();
    },
    
    getItensParaPedido: () => {
        return carrinho.map(item => ({ 
            produto_id: item.id, 
            quantidade: item.quantidade, 
            preco_unitario: item.preco 
        }));
    }
};

export function initCarrinho() {
    window.carrinhoFunctions = carrinhoFunctions;
    // Quando a página carrega, a UI é atualizada com os dados que já foram carregados do localStorage.
    atualizarCarrinhoUI(); 
}