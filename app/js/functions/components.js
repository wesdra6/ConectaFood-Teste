
export function criaCardProduto(produto, contexto = 'cliente', onClickAction = null) {
    const card = document.createElement('div');
    const imagem = (produto.imagens_urls && produto.imagens_urls.length > 0) 
        ? produto.imagens_urls[0] 
        : 'https://via.placeholder.com/400x300.png?text=Sem+Imagem';
    const isServico = produto.tipo_item !== 'PRODUTO';

    switch (contexto) {
        case 'cliente':
            card.className = 'bg-card rounded-xl overflow-hidden shadow-lg flex flex-col h-full group cursor-pointer';
            card.innerHTML = `
                <div class="h-48 overflow-hidden">
                    <img src="${imagem}" alt="${produto.nome}" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <h3 class="text-xl font-bold truncate">${produto.nome}</h3>
                    <p class="text-texto-muted text-sm mt-1 mb-4 h-10 line-clamp-2">${produto.descricao || 'Clique para ver mais detalhes.'}</p>
                    <div class="mt-auto">
                        <span class="text-3xl font-bold text-principal block mb-3">R$ ${Number(produto.preco).toFixed(2)}</span>
                        <button class="w-full bg-principal text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors text-lg btn-add-carrinho" aria-label="Adicionar ${produto.nome} ao carrinho">
                            ADICIONAR
                        </button>
                    </div>
                </div>`;
            
            card.addEventListener('click', () => {
                if (window.clientFunctions && typeof window.clientFunctions.abrirModalDetalhes === 'function') {
                    window.clientFunctions.abrirModalDetalhes(produto.id);
                }
            });
            const btnAdicionar = card.querySelector('.btn-add-carrinho');
            if (btnAdicionar) {
                btnAdicionar.addEventListener('click', (event) => {
                    event.stopPropagation();
                    if (window.clientFunctions && typeof window.clientFunctions.handleAdicionarAoCarrinho === 'function') {
                        window.clientFunctions.handleAdicionarAoCarrinho(produto.id);
                    }
                });
            }
            break;

        case 'admin-grid':
            card.className = `bg-card rounded-lg overflow-hidden shadow-lg hover:transform hover:-translate-y-1 transition-transform duration-300 flex flex-col h-full ${!produto.ativo ? 'opacity-50' : ''}`;
            const imagemHtmlAdmin = isServico 
                ? `<div class="w-full h-48 flex items-center justify-center bg-fundo"><i class="bi bi-gear-wide-connected text-6xl text-principal"></i></div>`
                : `<img src="${imagem}" alt="${produto.nome}" loading="lazy" class="w-full h-48 object-cover">`;
            card.innerHTML = `
                ${imagemHtmlAdmin}
                <div class="p-4 flex flex-col flex-grow">
                    <h3 class="text-xl font-bold">${produto.nome}</h3>
                    <p class="text-sm text-texto-muted mb-2">${produto.nome_categoria || 'Serviço'}</p>
                    <p class="text-texto-muted flex-grow mb-4">${produto.descricao || ''}</p>
                    <div class="flex justify-between items-center mt-auto">
                        <span class="text-2xl font-bold text-principal">R$ ${Number(produto.preco).toFixed(2)}</span>
                        <div class="flex items-center space-x-2">
                            <button class="btn-editar p-2 rounded-md hover:bg-sidebar transition-colors btn-demo-disable" aria-label="Editar ${produto.nome}"><i class="bi bi-gear-fill text-lg"></i></button>
                            ${!isServico ? `<button class="btn-status p-2 rounded-md hover:bg-sidebar transition-colors btn-demo-disable" aria-label="${produto.ativo ? 'Desativar' : 'Ativar'} ${produto.nome}">${produto.ativo ? '<i class="bi bi-eye-slash-fill text-lg text-red-500"></i>' : '<i class="bi bi-eye-fill text-lg text-green-400"></i>'}</button>` : ''}
                        </div>
                    </div>
                </div>`;
            card.querySelector('.btn-editar').addEventListener('click', () => window.adminFunctions.editarProduto(produto.id));
            if (!isServico) {
                card.querySelector('.btn-status').addEventListener('click', () => window.adminFunctions.toggleProdutoStatus(produto.id));
            }
            break;

        case 'admin-list':
            card.className = `bg-card p-3 rounded-lg flex items-center gap-4 ${!produto.ativo ? 'opacity-50' : ''}`;
            const imagemHtmlList = isServico
                ? `<div class="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-fundo rounded-lg"><i class="bi bi-gear-wide-connected text-4xl text-principal"></i></div>`
                : `<img src="${imagem}" alt="${produto.nome}" loading="lazy" class="w-20 h-20 object-cover rounded-lg flex-shrink-0">`;
            card.innerHTML = `
                ${imagemHtmlList}
                <div class="flex-grow min-w-0">
                    <h3 class="font-bold truncate">${produto.nome}</h3>
                    <span class="text-xl font-bold text-principal">R$ ${Number(produto.preco).toFixed(2)}</span>
                </div>
                <div class="flex flex-col items-center">
                    <button class="btn-editar p-2 rounded-md hover:bg-fundo transition-colors btn-demo-disable" aria-label="Editar ${produto.nome}"><i class="bi bi-gear-fill text-lg"></i></button>
                    ${!isServico ? `<button class="btn-status p-2 rounded-md hover:bg-fundo transition-colors btn-demo-disable" aria-label="${produto.ativo ? 'Desativar' : 'Ativar'} ${produto.nome}">${produto.ativo ? '<i class="bi bi-eye-slash-fill text-lg text-red-500"></i>' : '<i class="bi bi-eye-fill text-lg text-green-400"></i>'}</button>` : ''}
                </div>`;
            card.querySelector('.btn-editar').addEventListener('click', () => window.adminFunctions.editarProduto(produto.id));
            if (!isServico) {
                card.querySelector('.btn-status').addEventListener('click', () => window.adminFunctions.toggleProdutoStatus(produto.id));
            }
            break;
            
        case 'caixa':
            card.className = "bg-fundo p-2 rounded-lg flex items-center gap-4 cursor-pointer hover:bg-sidebar transition-colors mb-2";
            let imagemHtmlCaixa;
            if (produto.imagens_urls && produto.imagens_urls.length > 0) {
                imagemHtmlCaixa = `<img src="${imagem}" alt="${produto.nome}" loading="lazy" class="w-16 h-16 object-cover rounded-md flex-shrink-0">`;
            } else {
                let iconeServico = 'bi-box-seam';
                if (produto.nome.toLowerCase().includes('entrega')) {
                    iconeServico = 'bi-bicycle';
                } else if (produto.nome.toLowerCase().includes('couvert')) {
                    iconeServico = 'bi-music-note-beamed';
                }
                imagemHtmlCaixa = `<div class="w-16 h-16 flex items-center justify-center bg-card rounded-md flex-shrink-0"><i class="bi ${iconeServico} text-3xl text-principal"></i></div>`;
            }
            card.innerHTML = `
                ${imagemHtmlCaixa}
                <div class="flex-grow overflow-hidden">
                    <p class="font-bold truncate text-base">${produto.nome}</p>
                    <span class="text-principal font-semibold text-lg">R$ ${Number(produto.preco).toFixed(2)}</span>
                </div>
                <button aria-label="Adicionar ${produto.nome}" class="bg-principal text-white w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-2xl font-bold pointer-events-none">+</button>`;
            card.addEventListener('click', () => {
                if (typeof onClickAction === 'function') {
                    onClickAction(produto.id);
                } 
                else if (window.caixaFunctions && typeof window.caixaFunctions.adicionarItemNaComanda === 'function') {
                    window.caixaFunctions.adicionarItemNaComanda(produto.id);
                }
            });
            break;
            
        default:
            return null;
    }
    return card;
}

export function criaItemComanda(item, index, contexto = 'carrinho-cliente') {
    const itemContainer = document.createElement('div');
    const subtotal = item.preco * item.quantidade;
    const imagem = (item.imagens_urls && item.imagens_urls.length > 0) ? item.imagens_urls[0] : 'https://via.placeholder.com/150';
    switch (contexto) {
        case 'carrinho-cliente':
            itemContainer.className = 'flex items-center justify-between mb-4';
            itemContainer.innerHTML = `
                <div class="flex items-center flex-grow overflow-hidden">
                    <img src="${imagem}" class="w-16 h-16 rounded-md object-cover mr-4 flex-shrink-0" alt="${item.nome}">
                    <div class="flex-grow min-w-0">
                        <p class="font-semibold leading-tight truncate">${item.nome}</p>
                        <div class="flex items-center mt-1">
                            <button class="btn-diminuir px-2 rounded-md bg-borda text-lg font-bold" aria-label="Diminuir quantidade de ${item.nome}">-</button>
                            <span class="px-3 font-bold text-lg" aria-label="Quantidade: ${item.quantidade}">${item.quantidade}</span>
                            <button class="btn-aumentar px-2 rounded-md bg-borda text-lg font-bold" aria-label="Aumentar quantidade de ${item.nome}">+</button>
                        </div>
                    </div>
                </div>
                <div class="text-right flex flex-col items-end ml-4" style="min-width: 90px;">
                    <span class="font-bold text-principal">R$ ${subtotal.toFixed(2)}</span>
                    <button class="btn-remover text-texto-muted hover:text-red-500 mt-2" aria-label="Remover ${item.nome} do carrinho"><i class="bi bi-trash-fill text-lg"></i></button>
                </div>
            `;
            itemContainer.querySelector('.btn-diminuir').addEventListener('click', () => window.carrinhoFunctions.diminuir(index));
            itemContainer.querySelector('.btn-aumentar').addEventListener('click', () => window.carrinhoFunctions.aumentar(index));
            itemContainer.querySelector('.btn-remover').addEventListener('click', () => window.carrinhoFunctions.remover(index));
            break;
        default:
            return null;
    }
    return itemContainer;
}