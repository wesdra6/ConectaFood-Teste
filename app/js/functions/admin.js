import { supabase } from '../supabaseClient.js';
import { enviarParaAPI, fetchDeAPI, enviarArquivoParaAPI } from './api.js';
import { criaCardProduto } from './components.js';
import { API_ENDPOINTS, APP_CONFIG, ZIPLINE_CONFIG } from '../config.js';

let produtosLocais = [];
let produtosPorCategoria = {};
let todasAsCategorias = [];
let categoriaAtiva = 'todos';
let paginaAtual = 1;
const itensPorPagina = 8;
const desktopMediaQuery = window.matchMedia('(min-width: 768px)');
let uploadedImageUrls = [];
let modalProduto = null;
let modalFichaTecnica = null;
let todosOsInsumos = [];
let fichaTecnicaAtual = [];

async function exibirInfoUsuarioLogado() {
    const container = document.getElementById('info-usuario-logado');
    if (!container) return;
    let nomeUsuario = 'Visitante';
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('nome_completo').eq('id', user.id).single();
        if (profile && profile.nome_completo) {
            nomeUsuario = profile.nome_completo.split(' ')[0];
        } else if (user.email && !user.email.startsWith('demo-')) {
            nomeUsuario = user.email.split('@')[0];
        }
    }
    const atualizarHora = () => {
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
        const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        container.innerHTML = `<span>${dataFormatada} | ${horaFormatada}</span><span class="mx-2">●</span><span>Usuário: <strong class="text-principal">${nomeUsuario}</strong></span>`;
    };
    atualizarHora();
    setInterval(atualizarHora, 15000);
}

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
    const resultado = await Swal.fire({ title: `Deseja ${acao} a loja?`, text: novoStatus ? 'Sua loja ficará visível e poderá receber pedidos.' : 'Sua loja ficará indisponível para novos pedidos.', icon: 'warning', showCancelButton: true, confirmButtonText: `Sim, ${acao}!`, cancelButtonText: 'Cancelar', confirmButtonColor: corConfirmacao, background: '#2c2854', color: '#ffffff' });
    if (resultado.isConfirmed) {
        Swal.fire({ title: `${acao}NDO a loja...`, allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });
        try {
            await enviarParaAPI(API_ENDPOINTS.update_loja_status, { loja_aberta: novoStatus });
            renderizarToggleLoja(novoStatus);
            Swal.fire({ icon: 'success', title: 'Sucesso!', text: `Loja ${novoStatus ? 'aberta' : 'fechada'}.`, background: '#2c2854', color: '#ffffff' });
        } catch (error) {
            console.error("Erro ao alterar status da loja, tratado globalmente:", error);
            toggle.checked = !novoStatus;
        }
    } else {
        toggle.checked = !novoStatus;
    }
}

async function verificarStatusLoja() {
    try {
        const configs = await fetchDeAPI(API_ENDPOINTS.get_loja_config);
        if (configs && configs.length > 0) {
            renderizarToggleLoja(configs[0].loja_aberta);
        }
    } catch (error) {
        console.error("Erro ao verificar status da loja para o toggle:", error);
    }
}

function renderizarDashboardStats(stats) {
    const totalPedidosEl = document.getElementById('dashboard-total-pedidos');
    const faturamentoDiaEl = document.getElementById('dashboard-faturamento-dia');
    const ticketMedioEl = document.getElementById('dashboard-ticket-medio');
    if (totalPedidosEl) totalPedidosEl.textContent = stats.totalPedidos;
    if (faturamentoDiaEl) faturamentoDiaEl.textContent = `R$ ${stats.faturamento.toFixed(2).replace('.', ',')}`;
    if (ticketMedioEl) ticketMedioEl.textContent = `R$ ${stats.ticketMedio.toFixed(2).replace('.', ',')}`;
}

function renderMapaDeMesas(mesas, pedidos) {
    const container = document.getElementById('dashboard-mapa-mesas');
    if (!container) return;
    container.innerHTML = '';
    const mesasOcupadas = mesas.filter(m => m.status === 'OCUPADA').length;
    if (mesas.length === 0) {
        container.innerHTML = `<p class="col-span-full text-center text-texto-muted py-4">Nenhuma mesa cadastrada. <br> Vá em <a href="?view=configuracoes" class="text-principal font-semibold hover:underline">Configurações</a> para adicioná-las.</p>`;
        return;
    }
    if (mesasOcupadas === 0) {
         container.innerHTML = `<p class="col-span-full text-center text-texto-muted py-4">Tudo tranquilo por aqui, nenhuma mesa ocupada no momento. ✨</p>`;
    }
    mesas.sort((a, b) => a.numero_mesa - b.numero_mesa).forEach(mesa => {
        const isOcupada = mesa.status === 'OCUPADA';
        const pedidoDaMesa = isOcupada ? pedidos.find(p => p.id_mesa === mesa.id) : null;
        const corBorda = isOcupada ? 'border-red-500' : 'border-green-500';
        const corPonto = isOcupada ? 'bg-red-500' : 'bg-green-500';
        const textoTitle = isOcupada ? `OCUPADA\nCliente: ${pedidoDaMesa?.nome_cliente}\nTotal: R$ ${pedidoDaMesa?.total.toFixed(2)}` : 'LIVRE';
        const cardMesa = document.createElement('div');
        cardMesa.className = `mesa-card flex flex-col justify-between bg-fundo p-3 rounded-lg text-center cursor-pointer border-2 ${corBorda}`;
        cardMesa.title = textoTitle;
        cardMesa.innerHTML = `<div class="text-3xl md:text-4xl font-bold">${mesa.numero_mesa}</div><div class="flex justify-center items-center mt-2"><span class="w-4 h-4 rounded-full ${corPonto}"></span></div>`;
        cardMesa.onclick = () => window.location.href = '?view=caixa';
        container.appendChild(cardMesa);
    });
}

function renderFeedDePedidos(pedidos) {
    const container = document.getElementById('dashboard-feed-pedidos');
    if (!container) return;
    const pedidosExternos = pedidos.filter(p => p.origem === 'DELIVERY' || p.origem === 'WHATSAPP' || p.origem === 'BALCAO');
    container.innerHTML = '';
    if (pedidosExternos.length === 0) {
        container.innerHTML = '<p class="text-center text-texto-muted py-4">Aguardando novos pedidos de delivery ou balcão. Fique de olho! 👀</p>';
        return;
    }
    pedidosExternos.slice(0, 5).forEach(pedido => {
        const corOrigem = APP_CONFIG.origemCores[pedido.origem] || 'bg-gray-500';
        const hora = new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const itemHtml = document.createElement('a');
        itemHtml.href = `?view=pedidos`;
        itemHtml.className = 'block bg-fundo p-3 rounded-lg hover:bg-sidebar transition-colors';
        itemHtml.innerHTML = `<div class="flex justify-between items-start"><div><span class="px-2 py-1 text-xs font-bold rounded-full text-white ${corOrigem}">${pedido.origem}</span><p class="font-bold mt-1 truncate">${pedido.nome_cliente}</p></div><div class="text-right flex-shrink-0"><p class="font-bold text-principal text-lg">R$ ${pedido.total.toFixed(2)}</p><p class="text-sm text-texto-muted">${hora}</p></div></div>`;
        container.appendChild(itemHtml);
    });
}

function initDashboardSliders() {
    const swiperAtalhos = document.querySelector('.swiper-atalhos');
    if (swiperAtalhos && !swiperAtalhos.swiper) {
        new Swiper(swiperAtalhos, { slidesPerView: 'auto', spaceBetween: 16, freeMode: true });
    }
}

function verificarAcessoAtalhos() {
    const userRole = sessionStorage.getItem('userRole');
    const atalhoGerenciamento = document.getElementById('atalho-gerenciamento');
    if (atalhoGerenciamento) {
        if (userRole === 'funcionario') {
            console.log("VIGIA de Atalhos: Usuário é 'funcionario'. Escondendo atalho de gerenciamento.");
            atalhoGerenciamento.style.display = 'none';
        } else {
            console.log(`VIGIA de Atalhos: Role '${userRole}' detectada. Exibindo atalho.`);
            atalhoGerenciamento.style.display = 'block';
        }
    }
}

async function initDashboard() {
    try {
        exibirInfoUsuarioLogado();
        verificarAcessoAtalhos();
        const [statsData, mesas, pedidosAtivos] = await Promise.all([ fetchDeAPI(API_ENDPOINTS.get_dashboard_stats), fetchDeAPI(API_ENDPOINTS.get_all_tables), fetchDeAPI(API_ENDPOINTS.get_all_orders) ]);
        if (!Array.isArray(statsData)) { throw new Error("Dados de estatísticas inválidos."); }
        const faturamento = statsData.reduce((acc, p) => acc + Number(p.total || 0), 0);
        const totalPedidos = statsData.length;
        const ticketMedio = totalPedidos > 0 ? faturamento / totalPedidos : 0;
        renderizarDashboardStats({ totalPedidos, faturamento, ticketMedio });
        renderMapaDeMesas(mesas, pedidosAtivos);
        renderFeedDePedidos(pedidosAtivos);
        initDashboardSliders();
    } catch (error) {
        console.error("Erro ao montar o dashboard operacional:", error);
        const dashboardPage = document.getElementById('dashboard-page');
        if(dashboardPage) { dashboardPage.innerHTML = '<p class="text-red-400">Não foi possível carregar os dados do dashboard. Verifique o console.</p>'; }
    }
}

async function abrirModalFichaTecnica(produtoId) {
    const produto = produtosLocais.find(p => p.id === produtoId);
    if (!produto) {
        Swal.fire('Erro', 'Produto não encontrado.', 'error');
        return;
    }

    if (!modalFichaTecnica) {
        const modalEl = document.getElementById('modal-ficha-tecnica');
        if (modalEl) modalFichaTecnica = new bootstrap.Modal(modalEl);
    }
    
    document.getElementById('modal-ficha-tecnica-label').textContent = `Ficha Técnica de ${produto.nome}`;
    document.getElementById('ficha-produto-id').value = produtoId;
    document.getElementById('form-adicionar-insumo').reset();

    Swal.fire({ title: 'Carregando dados da ficha...', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });

    try {
        const urlFicha = `${API_ENDPOINTS.get_ficha_produto}?produto_id=${produtoId}`;

        const [insumos, ficha] = await Promise.all([
            fetchDeAPI(API_ENDPOINTS.get_all_insumos),
            fetchDeAPI(urlFicha)
        ]);
        
        todosOsInsumos = Array.isArray(insumos) ? insumos : [];
        fichaTecnicaAtual = Array.isArray(ficha) ? ficha : [];

        renderizarSelectInsumos();
        renderizarFichaTecnica();
        
        Swal.close();
        if (modalFichaTecnica) modalFichaTecnica.show();

    } catch (error) {
        Swal.fire('Ops!', `Não foi possível carregar os dados da ficha: ${error.message}`, 'error');
    }
}

function calcularPrecoSugerido() {
    const cmvTotalEl = document.getElementById('cmv-total');
    const markupEl = document.getElementById('markup-percentual');
    const markupValorEl = document.getElementById('markup-valor'); 
    const precoSugeridoEl = document.getElementById('preco-sugerido');

    if (!cmvTotalEl || !markupEl || !precoSugeridoEl || !markupValorEl) return;

    const cmvValor = parseFloat(cmvTotalEl.textContent.replace('R$', '').replace(',', '.').trim());
    const markupPercent = parseFloat(markupEl.value) || 0;

    markupValorEl.textContent = `${markupPercent}%`; 

    if (isNaN(cmvValor)) return;

    const precoSugerido = cmvValor * (1 + (markupPercent / 100));

    precoSugeridoEl.textContent = `R$ ${precoSugerido.toFixed(2)}`;
}


function renderizarSelectInsumos() {
    const select = document.getElementById('select-insumo');
    select.innerHTML = '<option value="" disabled selected>Selecione um insumo...</option>';
    todosOsInsumos.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(insumo => {
        const option = document.createElement('option');
        option.value = insumo.id;
        option.textContent = insumo.nome;
        select.appendChild(option);
    });
}

function renderizarFichaTecnica() {
    const container = document.getElementById('lista-insumos-ficha');
    const cmvTotalEl = document.getElementById('cmv-total');
    container.innerHTML = '';
    let cmvTotal = 0;

    if (fichaTecnicaAtual.length === 0) {
        container.innerHTML = '<p class="text-texto-muted text-center">Nenhum insumo adicionado.</p>';
        cmvTotalEl.textContent = 'R$ 0,00';
        calcularPrecoSugerido();
        return;
    }

    fichaTecnicaAtual.forEach(item => {
        const insumoBase = todosOsInsumos.find(i => i.id === item.insumo_id);
        if (!insumoBase) return;

        let custoItem = 0;
        const custoPorUnidadeCompra = insumoBase.preco_compra / insumoBase.qtd_embalagem;
        
        let quantidadeConvertida = item.quantidade_usada;
        if(insumoBase.unidade_compra.toLowerCase() === 'kg' && item.unidade_medida.toLowerCase() === 'g') {
            quantidadeConvertida = item.quantidade_usada / 1000;
        } else if(insumoBase.unidade_compra.toLowerCase() === 'l' && item.unidade_medida.toLowerCase() === 'ml') {
            quantidadeConvertida = item.quantidade_usada / 1000;
        }
        
        custoItem = quantidadeConvertida * custoPorUnidadeCompra;
        cmvTotal += custoItem;
        
        const itemHtml = `
            <div class="flex items-center justify-between bg-fundo p-2 rounded-md">
                <div class="flex-grow">
                    <p class="semi-bold">${item.nome_insumo}</p>
                    <p class="text-xs text-texto-muted">${item.quantidade_usada} ${item.unidade_medida}</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="font-semibold text-principal">R$ ${custoItem.toFixed(2)}</span>
                    <button onclick="adminFunctions.removerInsumoDaFicha(${item.id})" class="text-red-500 hover:text-red-400 p-1" title="Remover Insumo">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += itemHtml;
    });

    cmvTotalEl.textContent = `R$ ${cmvTotal.toFixed(2)}`;
    calcularPrecoSugerido();
}

async function handleAdicionarInsumo(event) {
    event.preventDefault();
    const payload = {
        produto_id: parseInt(document.getElementById('ficha-produto-id').value),
        insumo_id: parseInt(document.getElementById('select-insumo').value),
        quantidade_usada: parseFloat(document.getElementById('insumo-quantidade').value),
        unidade_medida: document.getElementById('insumo-unidade').value,
    };

    if (isNaN(payload.insumo_id) || isNaN(payload.quantidade_usada)) {
        Swal.fire('Dados incompletos', 'Selecione um insumo e informe a quantidade.', 'warning');
        return;
    }

    try {
        await enviarParaAPI(API_ENDPOINTS.add_insumo_ficha, payload);

        const urlFichaAtualizada = `${API_ENDPOINTS.get_ficha_produto}?produto_id=${payload.produto_id}`;
        const fichaAtualizada = await fetchDeAPI(urlFichaAtualizada);
        
        fichaTecnicaAtual = Array.isArray(fichaAtualizada) ? fichaAtualizada : [];
        renderizarFichaTecnica();
        event.target.reset();
        document.getElementById('select-insumo').focus();

    } catch (error) {
        // Silêncio aqui! O api.js já mostrou o erro.
        console.error("Erro ao adicionar insumo, tratado globalmente:", error);
    }
}

async function removerInsumoDaFicha(produtoInsumoId) {
    try {
        await enviarParaAPI(API_ENDPOINTS.remove_insumo_ficha, { id: produtoInsumoId });
        fichaTecnicaAtual = fichaTecnicaAtual.filter(item => item.id !== produtoInsumoId);
        renderizarFichaTecnica();
    } catch (error) {
        // Silêncio aqui! O api.js já mostrou o erro.
        console.error("Erro ao remover insumo, tratado globalmente:", error);
    }
}

async function chamarAgenteDeMarketing(tipo, contexto = {}) {
    const nomeProduto = contexto.nome || document.getElementById('produtoNome').value;
    const ingredientes = contexto.ingredientes || document.getElementById('produtoIngredientes').value;

    if ( (tipo === 'descricao' || tipo === 'post_social') && !nomeProduto) {
        Swal.fire({ icon: 'warning', title: 'Opa!', text: 'Digite ou selecione um produto antes de usar a IA.', background: '#2c2854', color: '#ffffff' });
        return;
    }
    
    let prompt;
    let tituloSwal;
    
    if (tipo === 'nome') {
        prompt = `Gere 3 opções de nomes criativos e comerciais para um produto que atualmente se chama "${nomeProduto || 'nosso novo lanche'}". Os nomes devem ser curtos, marcantes e despertar curiosidade. Formate a resposta apenas com os nomes, um por linha.`;
        tituloSwal = 'Sugerindo nomes... 🪄';
    } else if (tipo === 'descricao') {
        prompt = `Crie 3 variações de descrição de produto, vendedoras e irresistíveis, para o cardápio. Use técnicas de storytelling e copywriting. O produto é: "${nomeProduto}". Os ingredientes são: "${ingredientes || 'não informados'}". Cada descrição deve ter no máximo 250 caracteres e um estilo um pouco diferente. Separe cada descrição com '---'.`;
        tituloSwal = 'Criando descrições mágicas... 🪄';
    } else if (tipo === 'post_social') {
        prompt = `Crie uma legenda de post para rede social (Instagram/Facebook) para divulgar o produto "${nomeProduto}". Use um tom animado, emojis e um Call to Action claro para incentivar o pedido. Inclua hashtags relevantes.`;
        tituloSwal = 'Gerando post... 📣';
    } else {
        return;
    }

    Swal.fire({
        title: tituloSwal,
        text: 'Aguarde enquanto a criatividade flui...',
        allowOutsideClick: false,
        background: '#2c2854', color: '#ffffff',
        didOpen: () => { Swal.showLoading() }
    });

    try {
        const data = await enviarParaAPI(API_ENDPOINTS.call_ia_proxy, { pergunta: prompt });
        
        const textoGerado = data[0]?.output || data.resposta || "Não consegui gerar uma resposta criativa agora.";
        
        const sugestoes = textoGerado.split(/---|\n/).filter(s => s.trim() !== '');
        let htmlParaSwal = '<div class="space-y-4 text-left">';

        sugestoes.forEach((sugestao, index) => {
            const textoLimpo = sugestao.trim().replace(/\n/g, '<br>');
            htmlParaSwal += `
                <div class="bg-fundo p-3 rounded-lg flex justify-between items-start gap-3">
                    <p id="sugestao-ia-${index}" class="flex-grow text-texto-base">${textoLimpo}</p>
                    <button onclick="copiarSugestao('sugestao-ia-${index}', this)" class="bg-principal text-white font-bold py-1 px-3 rounded-md text-sm flex-shrink-0 hover:bg-orange-600">Copiar</button>
                </div>
            `;
        });
        htmlParaSwal += '</div>';
        
        window.copiarSugestao = (elementId, button) => {
            const textoParaCopiar = document.getElementById(elementId).innerText;
            navigator.clipboard.writeText(textoParaCopiar).then(() => {
                button.textContent = 'Copiado!';
                button.classList.add('bg-green-500');
                setTimeout(() => {
                    button.textContent = 'Copiar';
                    button.classList.remove('bg-green-500');
                }, 1500);
            });
        };

        Swal.fire({
            title: 'Aqui estão as sugestões!',
            html: htmlParaSwal,
            confirmButtonText: 'Fechar',
            background: '#2c2854', 
            color: '#ffffff',
            width: '600px'
        });

    } catch (error) {
        // Silêncio aqui! O api.js já mostrou o erro.
        console.error('Erro ao chamar Agente de Marketing, tratado globalmente:', error);
    }
}

async function fetchCategoriasParaAdmin() {
    try {
        todasAsCategorias = await fetchDeAPI(API_ENDPOINTS.get_all_categories);
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
    container.innerHTML = '<p class="text-texto-muted col-span-full text-center py-10 animate-pulse">Buscando delícias, serviços e calculando lucros...</p>';
    try {
        const produtosDoServidor = await fetchDeAPI(API_ENDPOINTS.get_all_products_with_cmv);
        
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
    } catch(e) { 
        console.error("Falha ao carregar produtos:", e); 
        container.innerHTML = `<p class="text-red-400 col-span-full text-center py-10">Ops, não conseguimos buscar os produtos.</p>`; 
    }
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
    
    const listaInicial = categoriaAtiva === 'todos'
        ? produtosLocais.filter(p => p.tipo_item === 'PRODUTO')
        : produtosPorCategoria[categoriaAtiva] || [];

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
        await enviarParaAPI(API_ENDPOINTS.toggle_product_status, payload);
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success',
            title: `Produto ${acaoPast} com sucesso!`, showConfirmButton: false, timer: 2000,
            background: '#38326b', color: '#ffffff'
        });
        
        produto.ativo = novoStatus;
        renderizarProdutosAdmin();

    } catch (error) {
        // Silêncio aqui! O api.js já mostrou o erro.
        console.error("Erro ao alternar status do produto, tratado globalmente:", error);
    }
}

function renderizarPreviews() { const previewsContainer = document.getElementById('previews-container'); previewsContainer.innerHTML = ''; uploadedImageUrls.forEach((url, index) => { const previewWrapper = document.createElement('div'); previewWrapper.className = 'relative w-24 h-24'; previewWrapper.innerHTML = `<img src="${url}" class="w-full h-full object-cover rounded-md"><button type="button" onclick="adminFunctions.removerImagem(${index})" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">×</button>`; previewsContainer.appendChild(previewWrapper); }); }
function removerImagem(index) { uploadedImageUrls.splice(index, 1); renderizarPreviews(); }

async function handleFileUpload(files) { 
    if (files.length === 0) return; 

    Swal.fire({
        title: 'Enviando imagens...',
        html: `
            <p class="mb-2">Carregando <b>${files.length}</b> arquivo(s). Aguarde! 🚀</p>
            <div class="w-full bg-fundo rounded-full h-2.5">
                <div class="bg-principal h-2.5 rounded-full animate-pulse" style="width: 100%"></div>
            </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        background: '#2c2854',
        color: '#ffffff'
    });

    const uploadPromises = Array.from(files).map(file => 
        { return enviarArquivoParaAPI(ZIPLINE_CONFIG.upload, file, 'produto').catch(err => ({ error: true, message: err.message, fileName: file.name })); }); 
    
    const resultados = await Promise.all(uploadPromises); 
    const sucessoUploads = resultados.filter(r => !r.error); 
    const erroUploads = resultados.filter(r => r.error); 

    if (sucessoUploads.length > 0) { 
        const newUrls = sucessoUploads.map(r => { 
            if (r && Array.isArray(r) && r.length > 0 && r[0]) { 
                return r[0].urlParaCopiarComId || r[0].imageUrlToCopy; 
            } 
            return null; 
        }).filter(Boolean); 
        uploadedImageUrls.push(...newUrls); 
        renderizarPreviews(); 
    } 

    if (erroUploads.length > 0) { 
        const errorMessages = erroUploads.map(e => `<li>${e.fileName}: ${e.message}</li>`).join(''); 
        Swal.fire({ 
            icon: 'error', 
            title: 'Ops! Alguns uploads falharam', 
            html: `<ul class="text-left">${errorMessages}</ul>`, 
            background: '#2c2854', 
            color: '#ffffff', 
        }); 
    } else { 
        Swal.close(); 
    } 
}

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
    Swal.fire({ title: `${acao} item...`, allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });
    const endpoint = id ? API_ENDPOINTS.update_product : API_ENDPOINTS.create_product;
    const payload = id ? { ...produtoData, id: parseInt(id) } : produtoData;
    
    try {
        const resultado = await enviarParaAPI(endpoint, payload);
        
        if (resultado && resultado.success === false) {
             Swal.close(); 
             return;
        }

        Swal.fire({ icon: 'success', title: `Item ${id ? 'atualizado' : 'criado'}!`, timer: 1500, showConfirmButton: false, background: '#2c2854', color: '#ffffff' });
        if (modalProduto) modalProduto.hide();
        fetchProdutosAdmin();
    } catch (error) {
        // Silêncio aqui! O api.js já mostrou o erro.
        console.error("Erro ao salvar produto, tratado globalmente:", error);
    }
}

let isInitialized = false;

function criarPostParaRedeSocial(produtoId) {
    const produto = produtosLocais.find(p => p.id === produtoId);
    if (!produto) {
        Swal.fire('Ops!', 'Produto não encontrado para criar o post.', 'error');
        return;
    }
    chamarAgenteDeMarketing('post_social', { 
        nome: produto.nome, 
        ingredientes: (produto.ingredientes || []).join(', ') 
    });
}

export function initAdminPage(params) {
    const { view } = params;
    const userRole = sessionStorage.getItem('userRole');

    if (!isInitialized) {
        const modalEl = document.getElementById('modal-produto');
        if (modalEl) modalProduto = new bootstrap.Modal(modalEl);
        
        desktopMediaQuery.addEventListener('change', renderizarProdutosAdmin);

        if (userRole !== 'visitante') {
            document.getElementById('form-produto').addEventListener('submit', handleFormSubmit);
            document.getElementById('form-adicionar-insumo').addEventListener('submit', handleAdicionarInsumo);
        }
        
        const markupInput = document.getElementById('markup-percentual');
        if (markupInput) {
            markupInput.addEventListener('input', calcularPrecoSugerido);
        }

        const btnCopiar = document.getElementById('btn-copiar-preco');
        if (btnCopiar) {
            btnCopiar.addEventListener('click', () => {
                const precoSugerido = document.getElementById('preco-sugerido').textContent.replace('R$', '').trim();
                navigator.clipboard.writeText(precoSugerido).then(() => {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'Preço copiado!',
                        showConfirmButton: false,
                        timer: 1500,
                        background: '#38326b',
                        color: '#ffffff'
                    });
                });
            });
        }

        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        if (userRole !== 'visitante') {
            if(uploadArea) uploadArea.addEventListener('click', () => fileInput.click());
            if(fileInput) fileInput.addEventListener('change', () => handleFileUpload(fileInput.files));
            if(uploadArea) {
              ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => { uploadArea.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false); });
              uploadArea.addEventListener('drop', (e) => { handleFileUpload(e.dataTransfer.files); });
            }
        } else {
            if(uploadArea) uploadArea.classList.add('opacity-50', 'cursor-not-allowed');
        }
        
        window.addEventListener('categoriasAtualizadas', () => {
            console.log("Admin ouviu: 'categoriasAtualizadas'. Recarregando o select.");
            fetchCategoriasParaAdmin();
        });

        document.getElementById('btn-ia-nome')?.addEventListener('click', () => chamarAgenteDeMarketing('nome'));
        document.getElementById('btn-ia-descricao')?.addEventListener('click', () => chamarAgenteDeMarketing('descricao'));
        
        fetchCategoriasParaAdmin();
        isInitialized = true;
    }

    if (view === 'dashboard') {
        verificarStatusLoja();
        initDashboard(); 
        const toggleLoja = document.getElementById('toggle-loja-aberta');
        if (toggleLoja) {
            if (userRole === 'visitante' || userRole === 'funcionario') {
                toggleLoja.disabled = true;
                toggleLoja.parentElement.classList.add('cursor-not-allowed', 'opacity-60');
                toggleLoja.parentElement.title = 'Ação bloqueada para seu nível de acesso';
            } else {
                toggleLoja.disabled = false;
                toggleLoja.parentElement.classList.remove('cursor-not-allowed', 'opacity-60');
                toggleLoja.parentElement.title = '';
                toggleLoja.removeEventListener('change', handleToggleLoja); 
                toggleLoja.addEventListener('change', handleToggleLoja);
            }
        }
    } else if (view === 'meus-produtos') {
        fetchProdutosAdmin();
    }
    
    window.adminFunctions = { 
        editarProduto, 
        removerImagem, 
        abrirModalParaCriar, 
        toggleProdutoStatus, 
        criarPostParaRedeSocial,
        abrirModalFichaTecnica,
        removerInsumoDaFicha
    };
}

//voltar