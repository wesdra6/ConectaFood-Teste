import { enviarParaAPI, fetchDeAPI, enviarArquivoParaAPI } from './api.js';
import { API_ENDPOINTS, ZIPLINE_CONFIG } from '../config.js';

let logoUrlAtual = '';
let logoVitrineUrlAtual = '';
let mesasExistentes = [];
let categoriasExistentes = [];
let iconeCategoriaUrlAtual = '';
let bannersExistentes = [];
let bannerImagemUrlAtual = '';

// ✅ FLAG DE CONTROLE DE INICIALIZAÇÃO
let isConfigInitialized = false;

function preencherFormulario(config) {
    if (!config) return;
    document.getElementById('config-nome-loja').value = config.nome_loja || '';
    document.getElementById('config-cnpj-cpf').value = config.cnpj_cpf || '';
    document.getElementById('config-endereco').value = config.endereco || '';
    document.getElementById('config-telefone').value = config.telefone || '';
    document.getElementById('config-msg-rodape').value = config.mensagem_rodape || '';
    document.getElementById('config-taxa-entrega').value = config.taxa_entrega_fixa || '';
    document.getElementById('config-custo-entrega').value = config.custo_entrega_freela || '';
    document.getElementById('pedido_minimo_delivery').value = config.pedido_minimo_delivery || 0.00;
    
    document.getElementById('habilitar_retirada').checked = config.habilitar_retirada === true;

    logoUrlAtual = config.logo_url || '';
    document.getElementById('logo-preview').src = logoUrlAtual || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiMzODMyNmIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNlcmlmIiBmb250LXNpemU9IjIwIiBmaWxsPSIjYTNhMGMyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5Mb2dvPC90ZXh0Pjwvc3ZnPg==';
    logoVitrineUrlAtual = config.logo_vitrine_url || '';
    document.getElementById('logo-vitrine-preview').src = logoVitrineUrlAtual || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiMzODMyNmIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNlcmlmIiBmb250LXNpemU9IjIwIiBmaWxsPSIjYTNhMGMyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5Mb2dvPC90ZXh0Pjwvc3ZnPg==';
}

async function fetchConfiguracoes() {
    try {
        const configs = await fetchDeAPI(API_ENDPOINTS.get_loja_config);
        if (configs && configs.length > 0) { preencherFormulario(configs[0]); }
    } catch (error) { console.error("Erro ao buscar configurações da loja:", error); Swal.fire('Ops!', 'Não foi possível carregar as configurações.', 'error'); }
}

async function handleLogoNotaFiscalUpload(file) {
    if (!file) return;
    const logoAntigaUrl = logoUrlAtual;
    Swal.fire({ title: 'Enviando logo de impressão...', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });
    try {
        const resultado = await enviarArquivoParaAPI(ZIPLINE_CONFIG.upload, file, 'logo_nota');
        const novaUrl = resultado[0]?.urlParaCopiarComId || resultado[0]?.imageUrlToCopy;
        if (novaUrl) {
            logoUrlAtual = novaUrl;
            document.getElementById('logo-preview').src = logoUrlAtual;
            await enviarParaAPI(API_ENDPOINTS.update_loja_config, { id: 1, logo_url: novaUrl });
            Swal.fire({ icon: 'success', title: 'Sucesso!', text: 'Logo de impressão atualizada e salva!', background: '#2c2854', color: '#ffffff' });
            
            if (logoAntigaUrl) {
                const match = logoAntigaUrl.match(/ziplineFileId=(\w+)/);
                if (match && match[1]) {
                    console.log(`Limpando logo de impressão antiga: ${match[1]}`);
                    enviarParaAPI(API_ENDPOINTS.delete_banner_on_clear, { fileIdentifier: match[1] })
                        .catch(err => console.error("Falha ao deletar logo antiga:", err));
                }
            }
        } else { throw new Error('URL da imagem não recebida do servidor.'); }
    } catch (error) {
        console.error("Erro no upload da logo da nota, tratado globalmente:", error);
    }
}

async function handleLogoVitrineUpload(file) {
    if (!file) return;
    const logoAntigaUrl = logoVitrineUrlAtual;
    Swal.fire({ title: 'Enviando nova logo...', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });
    try {
        const resultado = await enviarArquivoParaAPI(ZIPLINE_CONFIG.upload, file, 'logo_vitrine');
        const novaUrl = resultado[0]?.urlParaCopiarComId || resultado[0]?.imageUrlToCopy;
        if (novaUrl) {
            logoVitrineUrlAtual = novaUrl;
            document.getElementById('logo-vitrine-preview').src = logoVitrineUrlAtual;
            await enviarParaAPI(API_ENDPOINTS.update_loja_config, { id: 1, logo_vitrine_url: novaUrl });
            
            const nomeLoja = document.getElementById('config-nome-loja').value;
            const logoDesktopContainer = document.getElementById('logo-header-desktop');
            const logoMobileContainer = document.getElementById('logo-header-mobile');
            if(logoDesktopContainer) logoDesktopContainer.innerHTML = `<img src="${novaUrl}" alt="${nomeLoja}" class="max-h-20 w-auto">`;
            if(logoMobileContainer) logoMobileContainer.innerHTML = `<img src="${novaUrl}" alt="${nomeLoja}" class="max-h-20 w-auto">`;

            Swal.fire({ icon: 'success', title: 'Sucesso!', text: 'Logo do painel e vitrine atualizada e salva!', background: '#2c2854', color: '#ffffff' });

            if (logoAntigaUrl) {
                const match = logoAntigaUrl.match(/ziplineFileId=(\w+)/);
                if (match && match[1]) {
                    console.log(`Limpando logo de vitrine antiga: ${match[1]}`);
                    enviarParaAPI(API_ENDPOINTS.delete_banner_on_clear, { fileIdentifier: match[1] })
                        .catch(err => console.error("Falha ao deletar logo antiga:", err));
                }
            }
        } else { throw new Error('URL da imagem não recebida do servidor.'); }
    } catch (error) {
        console.error("Erro no upload da logo, tratado globalmente:", error);
    }
}

async function salvarConfiguracoes(event) {
    event.preventDefault();
    const nomeLoja = document.getElementById('config-nome-loja').value;
    const configData = { 
        id: 1, 
        nome_loja: nomeLoja, 
        cnpj_cpf: document.getElementById('config-cnpj-cpf').value, 
        endereco: document.getElementById('config-endereco').value, 
        telefone: document.getElementById('config-telefone').value, 
        mensagem_rodape: document.getElementById('config-msg-rodape').value,
        taxa_entrega_fixa: parseFloat(document.getElementById('config-taxa-entrega').value) || 0,
        custo_entrega_freela: parseFloat(document.getElementById('config-custo-entrega').value) || 0,
        pedido_minimo_delivery: parseFloat(document.getElementById('pedido_minimo_delivery').value) || 0,
        habilitar_retirada: document.getElementById('habilitar_retirada').checked,
        logo_url: logoUrlAtual,
        logo_vitrine_url: logoVitrineUrlAtual
    };
    Swal.fire({ title: 'Salvando informações...', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });
    try {
        await enviarParaAPI(API_ENDPOINTS.update_loja_config, configData);
        Swal.fire('Sucesso!', 'Configurações da loja salvas!', 'success');
    } catch (error) {
        console.error("Erro ao salvar configurações, tratado globalmente:", error);
    }
}

function renderMesas() {
    const container = document.getElementById('lista-mesas-existentes');
    if (!container) return;
    container.innerHTML = '';
    if (mesasExistentes.length === 0) {
        container.innerHTML = '<p class="text-texto-muted">Nenhuma mesa cadastrada ainda.</p>';
        return;
    }
    const mesasOrdenadas = [...mesasExistentes].sort((a, b) => a.numero_mesa - b.numero_mesa);
    mesasOrdenadas.forEach(mesa => {
        container.innerHTML += `<div class="flex items-center justify-between bg-fundo p-3 rounded-lg"><div><span class="font-bold text-principal">Mesa ${mesa.numero_mesa}</span></div><button onclick="configFunctions.handleDeletarMesa(${mesa.id})" class="text-red-500 hover:text-red-400 p-1 rounded-full"><i class="bi bi-trash-fill text-lg"></i></button></div>`;
    });
}

async function fetchMesas() {
    try {
        mesasExistentes = await fetchDeAPI(API_ENDPOINTS.get_all_tables) || [];
        renderMesas();
    } catch (error) {
        console.error("Erro ao buscar mesas:", error);
        document.getElementById('lista-mesas-existentes').innerHTML = '<p class="text-red-400">Erro ao carregar mesas.</p>';
    }
}

async function handleCriarMesa(event) {
    event.preventDefault();
    const numeroInput = document.getElementById('mesa-numero');
    const numero = numeroInput.value;
    if (!numero) { Swal.fire('Ops!', 'O número da mesa é obrigatório.', 'warning'); return; }
    Swal.fire({ title: 'Criando mesa...', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });
    try {
        await enviarParaAPI(API_ENDPOINTS.create_table, { numero_mesa: parseInt(numero) });
        Swal.fire('Sucesso!', 'Mesa criada!', 'success');
        numeroInput.value = '';
        fetchMesas(); 
    } catch (error) {
        console.error("Erro ao criar mesa, tratado globalmente:", error);
    }
}

async function handleDeletarMesa(id) {
    const mesa = mesasExistentes.find(m => m.id === id);
    if (!mesa) return;
    const result = await Swal.fire({
        title: 'Tem certeza?', text: `Deseja realmente apagar a Mesa ${mesa.numero_mesa}?`, icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sim, pode apagar!', cancelButtonText: 'Cancelar',
        background: '#2c2854', color: '#ffffff'
    });
    if (result.isConfirmed) {
        Swal.fire({ title: 'Apagando...', didOpen: () => Swal.showLoading() });
        try {
            await enviarParaAPI(API_ENDPOINTS.delete_table, { id: id });
            Swal.fire('Apagada!', 'A mesa foi removida.', 'success');
            fetchMesas();
        } catch (error) { 
            console.error("Erro ao apagar mesa, tratado globalmente:", error);
        }
    }
}

function limparFormularioCategoria() {
    document.getElementById('form-nova-categoria').reset();
    document.getElementById('categoria-id').value = '';
    iconeCategoriaUrlAtual = '';
    document.getElementById('categoria-icone-preview').src = '';
    document.getElementById('categoria-icone-preview').classList.add('hidden');
    document.getElementById('categoria-icone-placeholder').classList.remove('hidden');
}

async function fetchCategorias() {
    try {
        categoriasExistentes = await fetchDeAPI(API_ENDPOINTS.get_all_categories) || [];
        renderCategorias();
    } catch (error) {
        console.error("Erro ao buscar categorias:", error);
        document.getElementById('lista-categorias-existentes').innerHTML = '<p class="text-red-400">Erro ao carregar categorias.</p>';
    }
}

function renderCategorias() {
    const container = document.getElementById('lista-categorias-existentes');
    if (!container) return;
    container.innerHTML = '';
    if (categoriasExistentes.length === 0) {
        container.innerHTML = '<p class="text-texto-muted">Nenhuma categoria cadastrada.</p>';
        return;
    }
    const categoriasOrdenadas = [...categoriasExistentes].sort((a, b) => a.ordem_exibicao - b.ordem_exibicao);
    categoriasOrdenadas.forEach(cat => {
        const iconeHtml = cat.url_icone ? `<img src="${cat.url_icone}" class="w-8 h-8 object-contain rounded-md">` : `<div class="w-8 h-8 rounded" style="background-color: ${cat.cor_fundo || '#38326b'}"></div>`;
        container.innerHTML += `
            <div class="flex items-center justify-between bg-fundo p-3 rounded-lg" data-id="${cat.id}">
                <div class="flex items-center gap-3 flex-grow min-w-0">
                    <i class="bi bi-grip-vertical cursor-grab text-texto-muted flex-shrink-0"></i>
                    ${iconeHtml}
                    <span class="font-bold truncate">${cat.nome}</span>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <button onclick="configFunctions.handleEditarCategoria(${cat.id})" class="text-blue-400 hover:text-blue-300 p-1"><i class="bi bi-pencil-fill"></i></button>
                    <button onclick="configFunctions.handleDeletarCategoria(${cat.id})" class="text-red-500 hover:text-red-400 p-1"><i class="bi bi-trash-fill"></i></button>
                </div>
            </div>`;
    });

    new Sortable(container, {
        animation: 150, handle: '.cursor-grab',
        onEnd: function () {
            Swal.fire({
                toast: true, position: 'top-end', icon: 'info',
                title: 'Salvando nova ordem...', showConfirmButton: false, timer: 1500,
                background: '#38326b', color: '#ffffff'
            });
            const itens = container.querySelectorAll('.flex[data-id]');
            const novaOrdemIds = Array.from(itens).map(item => item.dataset.id);
            enviarParaAPI(API_ENDPOINTS.reorder_categories, { ordem: novaOrdemIds })
                .then(() => window.dispatchEvent(new CustomEvent('categoriasAtualizadas')))
                .catch(err => {
                    console.error("Erro ao salvar a nova ordem:", err);
                    Swal.fire('Ops!', 'Não foi possível salvar a nova ordem.', 'error');
                });
        }
    });
}

async function handleIconeCategoriaUpload(file) {
    if (!file) return;
    Swal.fire({ title: 'Enviando ícone...', didOpen: () => Swal.showLoading() });
    try {
        const resultado = await enviarArquivoParaAPI(ZIPLINE_CONFIG.upload, file, 'icone_categoria');
        const novaUrl = resultado[0]?.urlParaCopiarComId || resultado[0]?.imageUrlToCopy;
        if (novaUrl) {
            iconeCategoriaUrlAtual = novaUrl;
            document.getElementById('categoria-icone-preview').src = novaUrl;
            document.getElementById('categoria-icone-preview').classList.remove('hidden');
            document.getElementById('categoria-icone-placeholder').classList.add('hidden');
            Swal.close();
        } else { throw new Error('URL do ícone não foi recebida.'); }
    } catch (error) {
        console.error("Erro ao enviar ícone, tratado globalmente:", error);
    }
}

async function handleSalvarCategoria(event) {
    event.preventDefault();
    const id = document.getElementById('categoria-id').value;
    const payload = {
        nome: document.getElementById('categoria-nome').value,
        cor_fundo: document.getElementById('categoria-cor').value,
        url_icone: iconeCategoriaUrlAtual
    };
    if (id) payload.id = parseInt(id);
    const endpoint = id ? API_ENDPOINTS.update_category : API_ENDPOINTS.create_category;
    Swal.fire({ title: 'Salvando categoria...', didOpen: () => Swal.showLoading() });
    try {
        await enviarParaAPI(endpoint, payload);
        Swal.fire('Sucesso!', `Categoria ${id ? 'atualizada' : 'criada'}!`, 'success');
        limparFormularioCategoria();
        fetchCategorias();
        window.dispatchEvent(new CustomEvent('categoriasAtualizadas'));
    } catch (error) {
        console.error("Erro ao salvar categoria, tratado globalmente:", error);
    }
}

function handleEditarCategoria(id) {
    const categoria = categoriasExistentes.find(c => c.id === id);
    if (!categoria) return;
    limparFormularioCategoria();
    document.getElementById('categoria-id').value = categoria.id;
    document.getElementById('categoria-nome').value = categoria.nome;
    document.getElementById('categoria-cor').value = categoria.cor_fundo || '#38326b';
    iconeCategoriaUrlAtual = categoria.url_icone || '';
    if (categoria.url_icone) {
        document.getElementById('categoria-icone-preview').src = categoria.url_icone;
        document.getElementById('categoria-icone-preview').classList.remove('hidden');
        document.getElementById('categoria-icone-placeholder').classList.add('hidden');
    }
    document.getElementById('gerenciamento-categorias').scrollIntoView({ behavior: 'smooth' });
}

async function handleDeletarCategoria(id) {
    const categoria = categoriasExistentes.find(c => c.id === id);
    if (!categoria) return;
    const result = await Swal.fire({
        title: 'Certeza Absoluta?', html: `Deseja apagar a categoria "<b>${categoria.nome}</b>"?`, icon: 'warning',
        showCancelButton: true, confirmButtonText: 'Sim, pode apagar!',
    });
    if (result.isConfirmed) {
        Swal.fire({ title: 'Apagando...', didOpen: () => Swal.showLoading() });
        try {
            await enviarParaAPI(API_ENDPOINTS.delete_category, { id: id });
            Swal.fire('Apagada!', 'A categoria foi removida.', 'success');
            fetchCategorias();
            window.dispatchEvent(new CustomEvent('categoriasAtualizadas'));
        } catch (error) {
            console.error("Erro ao apagar categoria, tratado globalmente:", error);
        }
    }
}

async function fetchBanners() {
    try {
        bannersExistentes = await fetchDeAPI(API_ENDPOINTS.get_all_banners) || [];
        renderBanners();
    } catch (error) {
        console.error("Erro ao buscar banners:", error);
        document.getElementById('lista-banners-existentes').innerHTML = '<p class="text-red-400">Erro ao carregar banners.</p>';
    }
}

function renderBanners() {
    const container = document.getElementById('lista-banners-existentes');
    if (!container) return;
    container.innerHTML = '';
    const bannersValidos = bannersExistentes.filter(banner => banner && banner.id && banner.url_imagem);
    if (bannersValidos.length === 0) {
        container.innerHTML = '<p class="text-texto-muted text-center p-4">Nenhum banner cadastrado.</p>';
        return;
    }
    const bannersOrdenados = [...bannersValidos].sort((a, b) => a.ordem_exibicao - b.ordem_exibicao);
    let bannersHtml = bannersOrdenados.map(banner => {
        const statusClass = banner.ativo ? 'bg-green-500' : 'bg-red-500';
        return `
            <div class="flex items-center justify-between bg-fundo p-3 rounded-lg" data-id="${banner.id}">
                <div class="flex items-center gap-3">
                    <i class="bi bi-grip-vertical cursor-grab text-texto-muted"></i>
                    <img src="${banner.url_imagem}" class="w-24 h-12 object-cover rounded-md">
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="configFunctions.handleToggleBannerStatus(${banner.id}, ${banner.ativo})" class="p-1">
                        <span class="w-4 h-4 rounded-full inline-block ${statusClass}"></span>
                    </button>
                    <button onclick="configFunctions.handleEditarBanner(${banner.id})" class="text-blue-400 hover:text-blue-300 p-1">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button onclick="configFunctions.handleDeletarBanner(${banner.id})" class="text-red-500 hover:text-red-400 p-1">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                </div>
            </div>`;
    }).join('');
    container.innerHTML = bannersHtml;
    
    new Sortable(container, {
        animation: 150, handle: '.cursor-grab',
        onEnd: function () {
            Swal.fire({
                toast: true, position: 'top-end', icon: 'info',
                title: 'Salvando nova ordem dos banners...', showConfirmButton: false, timer: 1500,
                background: '#38326b', color: '#ffffff'
            });

            const itens = container.querySelectorAll('.flex[data-id]');
            const novaOrdemIds = Array.from(itens).map(item => item.dataset.id);
            enviarParaAPI(API_ENDPOINTS.reorder_banners, { ordem: novaOrdemIds })
                .catch(err => Swal.fire('Ops!', 'Não foi possível salvar a ordem dos banners.', 'error'));
        }
    });
}

async function handleBannerImagemUpload(file) {
    if (!file) return;
    Swal.fire({ title: 'Enviando imagem do banner...', didOpen: () => Swal.showLoading() });
    
    const bannerUploadArea = document.getElementById('banner-imagem-upload-area');
    const bannerFileInput = document.getElementById('banner-imagem-file-input');

    try {
        const resultado = await enviarArquivoParaAPI(ZIPLINE_CONFIG.upload, file, 'banner');
        const novaUrl = resultado[0]?.urlParaCopiarComId || resultado[0]?.imageUrlToCopy;
        if (novaUrl) {
            bannerImagemUrlAtual = novaUrl;
            const bannerPreview = document.getElementById('banner-imagem-preview');
            const bannerPlaceholder = document.getElementById('banner-imagem-placeholder');
            
            bannerPreview.src = novaUrl;
            bannerPreview.classList.remove('hidden');
            bannerPlaceholder.classList.add('hidden');
            
            bannerFileInput.disabled = true;
            bannerUploadArea.style.cursor = 'not-allowed';
            bannerUploadArea.classList.add('opacity-50', 'cursor-not-allowed');

            Swal.close();
        } else { 
            throw new Error('URL da imagem não recebida.'); 
        }
    } catch (error) { 
        console.error("Erro ao enviar imagem do banner, tratado globalmente:", error);
    }
}

async function handleSalvarBanner(event) {
    event.preventDefault();
    const id = document.getElementById('banner-id').value;
    
    if (!bannerImagemUrlAtual) { 
        Swal.fire('Ops!', 'Você precisa buscar uma imagem para o banner antes de salvar.', 'warning'); 
        return; 
    }

    const payload = { 
        url_imagem: bannerImagemUrlAtual, 
        link_ancora: null
    };
    
    const isUpdating = !!id;
    if (isUpdating) {
        payload.id = parseInt(id);
    }
    const endpoint = isUpdating ? API_ENDPOINTS.update_banner : API_ENDPOINTS.create_banner;
    const acao = isUpdating ? 'Atualizando' : 'Criando';

    Swal.fire({ title: `${acao} banner...`, didOpen: () => Swal.showLoading() });

    try {
        await enviarParaAPI(endpoint, payload);
        Swal.fire('Sucesso!', `Banner ${isUpdating ? 'atualizado' : 'criado'}!`, 'success');
        
        resetarVisualFormularioBanner(); 
        fetchBanners();
    } catch (error) { 
        console.error("Erro ao salvar banner, tratado globalmente:", error);
    }
}

function handleEditarBanner(id) {
    const banner = bannersExistentes.find(b => b.id === id);
    if (!banner) return;
    
    resetarVisualFormularioBanner();
    
    document.getElementById('banner-id').value = banner.id;
    bannerImagemUrlAtual = banner.url_imagem;
    
    if (banner.url_imagem) {
        const bannerPreview = document.getElementById('banner-imagem-preview');
        const bannerPlaceholder = document.getElementById('banner-imagem-placeholder');
        const bannerFileInput = document.getElementById('banner-imagem-file-input');
        const bannerUploadArea = document.getElementById('banner-imagem-upload-area');
        
        bannerPreview.src = banner.url_imagem;
        bannerPreview.classList.remove('hidden');
        bannerPlaceholder.classList.add('hidden');
        
        bannerFileInput.disabled = true;
        bannerUploadArea.style.cursor = 'not-allowed';
        bannerUploadArea.classList.add('opacity-50', 'cursor-not-allowed');
    }
    
    document.getElementById('gerenciamento-banners').scrollIntoView({ behavior: 'smooth' });
}

async function handleDeletarBanner(id) {
    const bannerParaDeletar = bannersExistentes.find(b => b.id === id);
    if (!bannerParaDeletar) {
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Banner não encontrado.', background: '#2c2854', color: '#ffffff' });
        return;
    }

    const confirmacao = await Swal.fire({
        title: 'Tem certeza?',
        text: "A imagem e o banner serão apagados permanentemente!",
        icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6', confirmButtonText: 'Sim, pode apagar!',
        cancelButtonText: 'Cancelar', background: '#2c2854', color: '#ffffff'
    });

    if (confirmacao.isConfirmed) {
        Swal.fire({ title: 'Apagando...', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });

        try {
            const payload = { id };
            if (bannerParaDeletar.url_imagem) {
                const match = bannerParaDeletar.url_imagem.match(/ziplineFileId=(\w+)/);
                if (match) {
                    payload.fileIdentifier = match[1];
                }
            }
            
            await enviarParaAPI(API_ENDPOINTS.delete_banner, payload);

            Swal.fire({ icon: 'success', title: 'Apagado!', text: 'O banner foi removido com sucesso.', background: '#2c2854', color: '#ffffff' });
            
            await fetchBanners();

        } catch (error) {
            console.error("Erro ao deletar banner, tratado globalmente:", error);
            fetchBanners();
        }
    }
}

async function handleToggleBannerStatus(id, statusAtual) {
    try {
        await enviarParaAPI(API_ENDPOINTS.toggle_banner_status, { id: id, status: !statusAtual });
        fetchBanners();
    } catch (error) {
        console.error("Erro ao alternar status do banner, tratado globalmente:", error);
    }
}

function resetarVisualFormularioBanner() {
    document.getElementById('form-novo-banner').reset();
    document.getElementById('banner-id').value = '';
    bannerImagemUrlAtual = '';
    
    const bannerUploadArea = document.getElementById('banner-imagem-upload-area');
    const bannerFileInput = document.getElementById('banner-imagem-file-input');
    const bannerPreview = document.getElementById('banner-imagem-preview');
    const bannerPlaceholder = document.getElementById('banner-imagem-placeholder');

    bannerPreview.src = '';
    bannerPreview.classList.add('hidden');
    bannerPlaceholder.classList.remove('hidden');
    
    bannerFileInput.disabled = false;
    bannerUploadArea.style.cursor = 'pointer';
    bannerUploadArea.classList.remove('opacity-50', 'cursor-not-allowed');
}

async function limparFormularioBanner() {
    const bannerIdSendoEditado = document.getElementById('banner-id').value;

    if (!bannerIdSendoEditado && bannerImagemUrlAtual) {
        try {
            const match = bannerImagemUrlAtual.match(/ziplineFileId=(\w+)/);
            if (match && match[1]) {
                const fileIdentifier = match[1];
                console.log(`Faxina iniciada! Apagando imagem órfã: ${fileIdentifier}`);
                await enviarParaAPI(API_ENDPOINTS.delete_banner_on_clear, { fileIdentifier });
            }
        } catch (e) {
            console.error("Erro ao tentar limpar imagem do banner:", e);
        }
    }
    resetarVisualFormularioBanner();
}

export function initConfiguracoesPage() {
    // A flag garante que os listeners sejam adicionados apenas uma vez.
    if (!isConfigInitialized) {
        console.log("Maestro de Configs: Anexando listeners pela primeira e única vez. 🚀");
        
        document.getElementById('form-configuracoes')?.addEventListener('submit', salvarConfiguracoes);
        document.getElementById('form-nova-mesa')?.addEventListener('submit', handleCriarMesa);
        document.getElementById('form-nova-categoria')?.addEventListener('submit', handleSalvarCategoria);
        document.getElementById('btn-limpar-form-categoria')?.addEventListener('click', limparFormularioCategoria);
        document.getElementById('form-novo-banner')?.addEventListener('submit', handleSalvarBanner);
        document.getElementById('btn-limpar-form-banner')?.addEventListener('click', limparFormularioBanner);

        document.getElementById('logo-upload-area')?.addEventListener('click', () => document.getElementById('logo-file-input').click());
        document.getElementById('logo-file-input')?.addEventListener('change', (e) => { if (e.target.files.length > 0) handleLogoNotaFiscalUpload(e.target.files[0]); });

        document.getElementById('logo-vitrine-upload-area')?.addEventListener('click', () => document.getElementById('logo-vitrine-file-input').click());
        document.getElementById('logo-vitrine-file-input')?.addEventListener('change', (e) => { if (e.target.files.length > 0) handleLogoVitrineUpload(e.target.files[0]); });

        document.getElementById('categoria-icone-upload-area')?.addEventListener('click', () => document.getElementById('categoria-icone-file-input').click());
        document.getElementById('categoria-icone-file-input')?.addEventListener('change', (e) => { if (e.target.files.length > 0) handleIconeCategoriaUpload(e.target.files[0]); });

        document.getElementById('banner-imagem-upload-area')?.addEventListener('click', () => document.getElementById('banner-imagem-file-input').click());
        document.getElementById('banner-imagem-file-input')?.addEventListener('change', (e) => { if (e.target.files.length > 0) handleBannerImagemUpload(e.target.files[0]); });

        window.configFunctions = { 
            handleDeletarMesa,
            handleDeletarCategoria,
            handleEditarCategoria,
            handleEditarBanner,
            handleDeletarBanner,
            handleToggleBannerStatus
        };

        isConfigInitialized = true;
    }
    
    // Estas funções rodam toda vez que a página é carregada para buscar dados frescos.
    fetchConfiguracoes();
    fetchMesas();
    fetchCategorias();
    fetchBanners();
}