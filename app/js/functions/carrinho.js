// REESCREVA O ARQUIVO COMPLETO: js/functions/carrinho.js

let carrinho = [];

// Função central que atualiza toda a interface do carrinho
function atualizarCarrinhoUI() {
    const containerItens = document.getElementById('carrinho-itens');
    const totalEl = document.getElementById('carrinho-total');
    const contadorEl = document.getElementById('contador-carrinho');
    const btnFinalizar = document.getElementById('btn-finalizar-pedido'); 
    
    // Se algum elemento da UI não for encontrado, a gente para pra não quebrar.
    if(!containerItens || !totalEl || !contadorEl || !btnFinalizar) return;

    containerItens.innerHTML = '';
    
    // A lógica de total agora é uma simples soma de todos os itens no carrinho
    let totalFinal = 0;
    let totalItensVisiveis = 0; // Conta apenas os produtos, não a taxa

    // Separa produtos de taxas para renderização e lógica
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
        // Se a taxa existe, a gente soma ela ao total final e exibe os detalhes
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

    // Habilita ou desabilita o botão de finalizar
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

// Objeto global com as funções que manipulam o carrinho
const carrinhoFunctions = {
    adicionar: (produto) => {
        const itemExistente = carrinho.find(item => item.id === produto.id);
        if (itemExistente) {
            itemExistente.quantidade++;
        } else {
            carrinho.push({ ...produto, quantidade: 1 });
        }
        atualizarCarrinhoUI();
    },

    aumentar: (index) => {
        // Aumenta a quantidade do item na posição 'index'
        if (carrinho[index]) {
            carrinho[index].quantidade++;
            atualizarCarrinhoUI();
        }
    },

    diminuir: (index) => {
        if (carrinho[index]) {
            carrinho[index].quantidade--;
            // Se a quantidade zerar, remove o item do carrinho
            if (carrinho[index].quantidade <= 0) {
                carrinho.splice(index, 1);
            }
            atualizarCarrinhoUI();
        }
    },

    remover: (index) => {
        if (carrinho[index]) {
            carrinho.splice(index, 1);
            atualizarCarrinhoUI();
        }
    },

    limpar: () => {
        carrinho = [];
        atualizarCarrinhoUI();
    },

    getItens: () => carrinho,
    
    // 👇 getTotal agora é uma simples soma de todos os itens no array. Sem segredos.
    getTotal: () => carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0),

    // 👇 A MÁGICA ACONTECE AQUI: setTaxaEntrega agora ADICIONA ou ATUALIZA o item da taxa
    setTaxaEntrega: (valor) => {
        const valorTaxa = Number(valor) || 0;
        const indexTaxa = carrinho.findIndex(item => item.id === 99999);

        if (valorTaxa > 0) {
            const itemTaxa = {
                id: 99999,
                nome: 'Taxa de Entrega',
                preco: valorTaxa,
                quantidade: 1,
                tipo_item: 'TAXA' // Identificador claro
            };
            if (indexTaxa > -1) {
                carrinho[indexTaxa] = itemTaxa; // Atualiza se já existir
            } else {
                carrinho.push(itemTaxa); // Adiciona se não existir
            }
        } else if (indexTaxa > -1) {
            carrinho.splice(indexTaxa, 1); // Remove se a taxa for zero ou inválida
        }
        atualizarCarrinhoUI();
    },
    
    // 👇 getItensParaPedido agora simplesmente retorna o carrinho inteiro.
    // O N8N vai receber a taxa como um item, que é o que queremos!
    getItensParaPedido: () => {
        return carrinho.map(item => ({ 
            produto_id: item.id, 
            quantidade: item.quantidade, 
            preco_unitario: item.preco 
        }));
    }
};

// Função de inicialização do módulo do carrinho
export function initCarrinho() {
    window.carrinhoFunctions = carrinhoFunctions;
    atualizarCarrinhoUI(); // Garante que a UI esteja correta ao carregar a página
}