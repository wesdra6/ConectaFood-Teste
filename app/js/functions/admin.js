
import { enviarParaN8N, fetchDeN8N, enviarArquivoParaN8N } from './api.js';
import { criaCardProduto } from './components.js';

let produtosLocais = [];
let produtosPorCategoria = {};
let todasAsCategorias = [];
let categoriaAtiva = 'todos';
let paginaAtual = 1;
const itensPorPagina = 8;
const desktopMediaQuery = window.matchMedia('(min-width: 768px)');
let uploadedImageUrls = [];
let modalProduto = null;

function renderizarToggleLoja(status) {
    const toggle = document.getElementById('toggle-loja-aberta');
    const textoStatus = document.getElementById('status-loja-texto');
    if (!toggle || !textoStatus) return;

    toggle.checked = status;
    if (status) {
        textoStatus.textContent = 'ABERTA';
        textoStatus.className = 'mr-3 text-sm font-bold w-20 text-center text-green-400 animate-pulse';
    } else {
        textoStatus.textContent = 'FECHADA';
        textoStatus.className = 'mr-3 text-sm font-bold w-20 text-center text-red-500';
    }
}

async function handleToggleLoja() {
    const toggle = document.getElementById('toggle-loja-aberta');
    const novoStatus = toggle.checked;
    const acao = novoStatus ? 'ABRIR' : 'FECHAR';
    const corConfirmacao = novoStatus ? '#28a745' : '#d33';

    const resultado = await Swal.fire({
        title: `Deseja ${acao} a loja?`,
        text: novoStatus ? 'Sua loja ficará visível e poderá receber pedidos.' : 'Sua loja ficará indisponível para novos pedidos.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: `Sim, ${acao}!`,
        cancelButtonText: 'Cancelar',
        confirmButtonColor: corConfirmacao,
        background: '#2c2854',
        color: '#ffffff'
    });

    if (resultado.isConfirmed) {
        Swal.fire({ title: `${acao}NDO a loja...`, allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });
        try {
            await enviarParaN8N(window.N8N_CONFIG.update_loja_status, { loja_aberta: novoStatus });
            renderizarToggleLoja(novoStatus);
            Swal.fire({ icon: 'success', title: 'Sucesso!', text: `Loja ${novoStatus ? 'aberta' : 'fechada'}.`, background: '#2c2854', color: '#ffffff' });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Ops!', text: 'Não foi possível alterar o status da loja.', background: '#2c2854', color: '#ffffff' });
            toggle.checked = !novoStatus;
        }
    } else {
        toggle.checked = !novoStatus;
    }
}

async function verificarStatusLoja() {
    try {
        const configs = await fetchDeN8N(window.N8N_CONFIG.get_loja_config);
        if (configs && configs.length > 0) {
            renderizarToggleLoja(configs[0].loja_aberta);
        }
    } catch (error) {
        console.error("Erro ao verificar status da loja para o toggle:", error);
    }
}

function renderizarDashboard(stats) {
    const totalPedidosEl = document.getElementById('dashboard-total-pedidos');
    const faturamentoDiaEl = document.getElementById('dashboard-faturamento-dia');
    const ticketMedioEl = document.getElementById('dashboard-ticket-medio');
    const containerTopProdutos = document.getElementById('dashboard-produtos-top');
    if (totalPedidosEl) totalPedidosEl.textContent = stats.totalPedidos;
    if (faturamentoDiaEl) faturamentoDiaEl.textContent = `R$ ${stats.faturamento.toFixed(2)}`;
    if (ticketMedioEl) ticketMedioEl.textContent = `R$ ${stats.ticketMedio.toFixed(2)}`;
    if (containerTopProdutos) {
        containerTopProdutos.innerHTML = '';
        if (stats.topProdutos && stats.topProdutos.length > 0) {
            stats.topProdutos.forEach((produto, index) => {
                containerTopProdutos.innerHTML += `<div class="flex items-center justify-between text-texto-muted"><span class="font-semibold">${index + 1}. ${produto.nome}</span><span class="font-bold text-principal">${produto.quantidade} vendidos</span></div>`;
            });
        } else {
            containerTopProdutos.innerHTML = '<p class="text-texto-muted">Ainda não há vendas de produtos hoje para gerar um ranking.</p>';
        }
    }
}

async function initDashboard() {
    try {
        const pedidosDeHoje = await fetchDeN8N(window.N8N_CONFIG.get_dashboard_stats);
        if (!Array.isArray(pedidosDeHoje)) { throw new Error("Dados do dashboard não são um array."); }
        
        const faturamento = pedidosDeHoje.reduce((acc, p) => acc + Number(p.total || 0), 0);
        const totalPedidos = pedidosDeHoje.length;
        const ticketMedio = totalPedidos > 0 ? faturamento / totalPedidos : 0;
        const contagemProdutos = {};
        pedidosDeHoje.forEach(pedido => {
            if (pedido.itens_pedido && Array.isArray(pedido.itens_pedido)) {
                pedido.itens_pedido.forEach(item => {
                    if (item && item.item && item.tipo_item === 'PRODUTO') { 
                        contagemProdutos[item.item] = (contagemProdutos[item.item] || 0) + (item.quantidade || 0); 
                    } 
                });
            }
        });
        const topProdutos = Object.entries(contagemProdutos).map(([nome, quantidade]) => ({ nome, quantidade })).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);
        renderizarDashboard({ totalPedidos, faturamento, ticketMedio, topProdutos });
    } catch (error) {
        console.error("Erro ao montar o dashboard:", error);
        const dashboardPage = document.getElementById('dashboard-page');
        if(dashboardPage) { dashboardPage.innerHTML = '<p class="text-red-400">Não foi possível carregar os dados do dashboard. Verifique o console.</p>'; }
    }
}

async function fetchCategoriasParaAdmin() {
    try {
        todasAsCategorias = await fetchDeN8N(window.N8N_CONFIG.get_all_categories);
        renderizarSelectCategorias();
    } catch (e) { console.error("Falha ao carregar categorias para o formulário de produto.", e); }
}

function renderizarSelectCategorias() {
    const select = document.getElementById('produtoCategoria');
    if (!select) return;
    const valorSelecionado = select.value;
    while (select.options.length > 1) { select.remove(1); }
    todasAsCategorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.nome;
        select.appendChild(option);
    });
    select.value = valorSelecionado;
}

async function fetchProdutosAdmin() {
    const container = document.getElementById('lista-produtos-admin');
    if (!container) return;
    container.innerHTML = '<p class="text-texto-muted col-span-full text-center py-10 animate-pulse">Buscando delícias e serviços...</p>';
    try {
        const produtosDoServidor = await fetchDeN8N(window.N8N_CONFIG.get_all_products_with_type);
        if (produtosDoServidor && produtosDoServidor.length > 0) {
            produtosLocais = produtosDoServidor.filter(p => p.id !== 99999);
            produtosPorCategoria = produtosLocais.reduce((acc, item) => {
                let cat = (item.tipo_item !== 'PRODUTO') ? 'Taxas e Serviços' : item.nome_categoria || 'Produtos Sem Categoria';
                if (!acc[cat]) { acc[cat] = []; } 
                acc[cat].push(item); 
                return acc;
            }, {});
            renderizarAbasCategoriasAdmin();
            renderizarProdutosAdmin();
        } else {
            container.innerHTML = `<p class="text-texto-muted col-span-full text-center py-10">Nenhum produto ou serviço encontrado.</p>`;
        }
    } catch(e) { console.error("Falha ao carregar produtos:", e); container.innerHTML = `<p class="text-red-400 col-span-full text-center py-10">Ops, não conseguimos buscar os produtos.</p>`; }
}

function renderizarAbasCategoriasAdmin() {
    const containerAbas = document.getElementById('abas-categorias-admin');
    if (!containerAbas) return;
    const categoriasProdutos = Object.keys(produtosPorCategoria).filter(cat => cat !== 'Taxas e Serviços').sort();
    const todasAsAbas = ['todos', ...categoriasProdutos];
    if (produtosPorCategoria['Taxas e Serviços']) {
        todasAsAbas.push('Taxas e Serviços');
    }
    let abasHtml = '';
    todasAsAbas.forEach(categoria => {
        const nomeAba = categoria === 'todos' ? 'Todos' : categoria;
        abasHtml += `<button class="tab-btn" data-categoria="${categoria}">${nomeAba}</button>`;
    });
    containerAbas.innerHTML = abasHtml;

    containerAbas.innerHTML += `
        <div class="flex items-center ml-auto pl-4">
            <label for="ver-inativos-toggle" class="flex items-center cursor-pointer">
                <span class="mr-3 text-sm font-medium text-texto-muted">Mostrar Inativos</span>
                <input type="checkbox" id="ver-inativos-toggle" class="hidden peer">
                <div class="relative w-11 h-6 bg-borda rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-principal"></div>
            </label>
        </div>
    `;
    
    const abaAtivaEl = containerAbas.querySelector(`[data-categoria="${categoriaAtiva}"]`) || containerAbas.querySelector('[data-categoria="todos"]');
    if (abaAtivaEl) abaAtivaEl.classList.add('active');
    
    containerAbas.querySelectorAll('.tab-btn').forEach(aba => {
        aba.addEventListener('click', () => { 
            containerAbas.querySelector('.active')?.classList.remove('active'); 
            aba.classList.add('active'); 
            categoriaAtiva = aba.getAttribute('data-categoria'); 
            paginaAtual = 1; 
            renderizarProdutosAdmin(); 
        });
    });

    document.getElementById('ver-inativos-toggle').addEventListener('change', renderizarProdutosAdmin);
}

function renderizarProdutosAdmin() {
    const container = document.getElementById('lista-produtos-admin');
    const verInativosToggle = document.getElementById('ver-inativos-toggle');

    if (!container || !verInativosToggle) {
        return;
    }
    
    const verInativos = verInativosToggle.checked;
    
    const listaInicial = categoriaAtiva === 'todos' ? produtosLocais : produtosPorCategoria[categoriaAtiva] || [];
    const listaParaRenderizar = verInativos ? listaInicial : listaInicial.filter(item => item.ativo);

    container.innerHTML = '';
    
    const itensPorPaginaAtual = desktopMediaQuery.matches ? itensPorPagina : listaParaRenderizar.length;
    const inicio = (paginaAtual - 1) * itensPorPaginaAtual;
    const fim = inicio + itensPorPaginaAtual;
    const produtosPaginados = listaParaRenderizar.slice(inicio, fim);

    if (produtosPaginados.length === 0) {
        const mensagem = verInativos ? "Nenhum item encontrado." : "Nenhum item ativo nesta categoria. Tente marcar 'Mostrar inativos'.";
        container.innerHTML = `<p class="text-texto-muted text-center w-full col-span-full py-10">${mensagem}</p>`;
        renderizarPaginacaoAdmin(0);
        return;
    }

    const fragment = document.createDocumentFragment();

    if (desktopMediaQuery.matches) {
        container.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start';
        produtosPaginados.forEach(item => {
            const card = criaCardProduto(item, 'admin-grid');
            if (card) fragment.appendChild(card);
        });
    } else {
        container.className = 'space-y-4';
        produtosPaginados.forEach(item => {
            const card = criaCardProduto(item, 'admin-list');
            if (card) fragment.appendChild(card);
        });
    }

    container.appendChild(fragment);
    renderizarPaginacaoAdmin(listaParaRenderizar.length);
}

function renderizarPaginacaoAdmin(totalItens) {
    const containerPaginacao = document.getElementById('paginacao-container-admin');
    if (!containerPaginacao || !desktopMediaQuery.matches) {
        if(containerPaginacao) containerPaginacao.innerHTML = '';
        return;
    }
    const totalPaginas = Math.ceil(totalItens / itensPorPagina);
    if (totalPaginas <= 1) { containerPaginacao.innerHTML = ''; return; }
    let paginacaoHtml = '';
    for (let i = 1; i <= totalPaginas; i++) { 
        const activeClass = i === paginaAtual ? 'bg-principal text-white' : 'bg-card hover:bg-sidebar'; 
        paginacaoHtml += `<button class="px-4 py-2 rounded-md font-bold ${activeClass} transition-colors" data-pagina="${i}">${i}</button>`;
    }
    containerPaginacao.innerHTML = paginacaoHtml;
    containerPaginacao.querySelectorAll('button').forEach(button => { 
        button.addEventListener('click', () => { 
            paginaAtual = Number(button.getAttribute('data-pagina')); 
            renderizarProdutosAdmin(); 
        }); 
    });
}

function preencherFormularioEdicao(id) {
    const item = produtosLocais.find(p => p.id === id);
    if (!item) return;
    document.getElementById('form-produto').reset();
    document.getElementById('produtoId').value = item.id;
    document.getElementById('produtoNome').value = item.nome;
    document.getElementById('produtoPreco').value = item.preco;
    document.getElementById('produtoDescricao').value = item.descricao || '';
    document.getElementById('produtoIngredientes').value = (item.ingredientes || []).join(', ');
    uploadedImageUrls = item.imagens_urls || [];
    renderizarPreviews();
    const isServico = item.tipo_item !== 'PRODUTO';
    document.getElementById('modal-produto-label').textContent = isServico ? 'Editar Serviço' : 'Editar Produto';
    const containerCategoria = document.getElementById('container-produto-categoria');
    const containerDescricao = document.getElementById('container-produto-descricao');
    const containerImagens = document.getElementById('container-produto-imagens');
    const containerIngredientes = document.getElementById('container-produto-ingredientes');
    const selectCategoria = document.getElementById('produtoCategoria');
    if (isServico) {
        containerCategoria.classList.add('hidden');
        containerDescricao.classList.add('hidden');
        containerImagens.classList.add('hidden');
        containerIngredientes.classList.add('hidden');
        selectCategoria.required = false;
    } else {
        containerCategoria.classList.remove('hidden');
        containerDescricao.classList.remove('hidden');
        containerImagens.classList.remove('hidden');
        containerIngredientes.classList.remove('hidden');
        selectCategoria.required = true;
        selectCategoria.value = item.categoria_id;
    }
}

function abrirModalParaCriar() {
    document.getElementById('form-produto').reset();
    document.getElementById('produtoId').value = '';
    uploadedImageUrls = [];
    renderizarPreviews();
    document.getElementById('modal-produto-label').textContent = 'Inserir Novo Produto';
    document.getElementById('container-produto-categoria').classList.remove('hidden');
    document.getElementById('container-produto-descricao').classList.remove('hidden');
    document.getElementById('container-produto-imagens').classList.remove('hidden');
    document.getElementById('container-produto-ingredientes').classList.remove('hidden');
    const selectCategoria = document.getElementById('produtoCategoria');
    selectCategoria.required = true;
    selectCategoria.value = '';
    if(modalProduto) modalProduto.show();
}

function editarProduto(id) {
    preencherFormularioEdicao(id);
    if(modalProduto) modalProduto.show();
}

async function toggleProdutoStatus(id) {
    const produto = produtosLocais.find(p => p.id === id);
    if (!produto) return;
    
    const novoStatus = !produto.ativo;
    const payload = { id: id, novo_status: novoStatus };
    const acaoPast = novoStatus ? 'ativado' : 'desativado';

    try {
        await enviarParaN8N(window.N8N_CONFIG.toggle_product_status, payload);
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success',
            title: `Produto ${acaoPast} com sucesso!`, showConfirmButton: false, timer: 2000,
            background: '#38326b', color: '#ffffff'
        });
        
        produto.ativo = novoStatus;
        renderizarProdutosAdmin();

    } catch (error) {
        const acao = novoStatus ? 'Ativar' : 'Desativar';
        Swal.fire({
            icon: 'error', title: 'Ops!',
            text: `Não foi possível ${acao.toLowerCase()} o produto.`,
            background: '#2c2854', color: '#ffffff'
        });
    }
}

function renderizarPreviews() { const previewsContainer = document.getElementById('previews-container'); previewsContainer.innerHTML = ''; uploadedImageUrls.forEach((url, index) => { const previewWrapper = document.createElement('div'); previewWrapper.className = 'relative w-24 h-24'; previewWrapper.innerHTML = `<img src="${url}" class="w-full h-full object-cover rounded-md"><button type="button" onclick="adminFunctions.removerImagem(${index})" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">×</button>`; previewsContainer.appendChild(previewWrapper); }); }
function removerImagem(index) { uploadedImageUrls.splice(index, 1); renderizarPreviews(); }
async function handleFileUpload(files) { if (files.length === 0) return; Swal.fire({ title: 'Enviando imagens...', html: `Carregando <b>${files.length}</b> arquivo(s). Aguarde! 🚀`, allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => { Swal.showLoading(); } }); const uploadPromises = Array.from(files).map(file => { return enviarArquivoParaN8N(window.ZIPLINE_CONFIG.upload, file, 'produtos').catch(err => ({ error: true, message: err.message, fileName: file.name })); }); const resultados = await Promise.all(uploadPromises); const sucessoUploads = resultados.filter(r => !r.error); const erroUploads = resultados.filter(r => r.error); if (sucessoUploads.length > 0) { const newUrls = sucessoUploads.map(r => { if (r && Array.isArray(r) && r.length > 0 && r[0]) { return r[0].urlParaCopiarComId || r[0].imageUrlToCopy; } return null; }).filter(Boolean); uploadedImageUrls.push(...newUrls); renderizarPreviews(); } if (erroUploads.length > 0) { const errorMessages = erroUploads.map(e => `<li>${e.fileName}: ${e.message}</li>`).join(''); Swal.fire({ icon: 'error', title: 'Ops! Alguns uploads falharam', html: `<ul class="text-left">${errorMessages}</ul>`, background: '#2c2854', color: '#ffffff', }); } else { Swal.close(); } }
async function handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('produtoId').value;
    const produtoData = { 
        nome: document.getElementById('produtoNome').value, 
        categoria_id: parseInt(document.getElementById('produtoCategoria').value) || null,
        preco: parseFloat(document.getElementById('produtoPreco').value), 
        descricao: document.getElementById('produtoDescricao').value, 
        imagens_urls: uploadedImageUrls, 
        ingredientes: document.getElementById('produtoIngredientes').value.split(',').map(item => item.trim()).filter(Boolean) 
    };
    const acao = id ? 'Atualizando' : 'Criando';
    Swal.fire({ title: `${acao} item...`, allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => { Swal.showLoading() } });
    const endpoint = id ? window.N8N_CONFIG.update_product : window.N8N_CONFIG.create_product;
    const payload = id ? { ...produtoData, id: parseInt(id) } : produtoData;
    try {
        await enviarParaN8N(endpoint, payload);
        Swal.fire({ icon: 'success', title: `Item ${id ? 'atualizado' : 'criado'}!`, timer: 1500, showConfirmButton: false, background: '#2c2854', color: '#ffffff' });
        if (modalProduto) modalProduto.hide();
        fetchProdutosAdmin();
    } catch (error) { Swal.fire({ icon: 'error', title: 'Ops! Algo deu errado.', text: `Não foi possível salvar: ${error.message}`, background: '#2c2854', color: '#ffffff' }); }
}

let isInitialized = false;

export function initAdminPage(params) {
    const { view } = params;

    if (!isInitialized) {
        const modalEl = document.getElementById('modal-produto');
        if (modalEl) modalProduto = new bootstrap.Modal(modalEl);
        
        desktopMediaQuery.addEventListener('change', renderizarProdutosAdmin);

        document.getElementById('form-produto').addEventListener('submit', handleFormSubmit);
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        if(uploadArea) uploadArea.addEventListener('click', () => fileInput.click());
        if(fileInput) fileInput.addEventListener('change', () => handleFileUpload(fileInput.files));
        if(uploadArea) {
          ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => { uploadArea.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false); });
          uploadArea.addEventListener('drop', (e) => { handleFileUpload(e.dataTransfer.files); });
        }
        
        const toggleLoja = document.getElementById('toggle-loja-aberta');
        if (toggleLoja) {
            toggleLoja.addEventListener('change', handleToggleLoja);
        }

        window.addEventListener('categoriasAtualizadas', () => {
            console.log("Admin ouviu: 'categoriasAtualizadas'. Recarregando o select.");
            fetchCategoriasParaAdmin();
        });
        
        fetchCategoriasParaAdmin();
        isInitialized = true;
    }

    if (view === 'dashboard') {
        verificarStatusLoja();
        initDashboard();
    } else if (view === 'meus-produtos') {
        fetchProdutosAdmin();
    }
    
    window.adminFunctions = { editarProduto, removerImagem, abrirModalParaCriar, toggleProdutoStatus };
}