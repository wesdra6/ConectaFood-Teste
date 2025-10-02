import { fetchDeAPI, enviarParaAPI } from './functions/api.js';
import { API_ENDPOINTS } from './config.js';

let todosOsInsumos = [];
let formInsumo;
let mostrarInativos = false;

function limparFormulario() {
    if (formInsumo) {
        formInsumo.reset();
        document.getElementById('insumo-id').value = '';
        document.getElementById('insumo-nome').focus();
        const formContainer = formInsumo.parentElement;
        if (formContainer) {
            const formLabel = formContainer.querySelector('h2');
            if (formLabel) formLabel.textContent = 'Adicionar / Editar Insumo';
        }
    }
}

function formatarCusto(valor, unidadeCompra) {
    const valorNum = parseFloat(valor);
    if (isNaN(valorNum)) return 'N/A';
    let unidadeMinima, custoFinal = valorNum;
    switch(unidadeCompra.toLowerCase()) {
        case 'kg': unidadeMinima = 'g'; custoFinal = valorNum / 1000; break;
        case 'l': unidadeMinima = 'ml'; custoFinal = valorNum / 1000; break;
        default: unidadeMinima = 'un.'; break;
    }
    return `${custoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4 })} / ${unidadeMinima}`;
}

function renderizarTabelaInsumos() {
    const container = document.getElementById('container-insumos-lista');
    if (!container) return;
    
    const insumosParaRenderizar = mostrarInativos ? todosOsInsumos : todosOsInsumos.filter(i => i.ativo);

    if (insumosParaRenderizar.length === 0) {
        container.innerHTML = `<p class="text-center p-8 text-texto-muted">Nenhum insumo encontrado.</p>`;
        return;
    }

    // Estrutura para Desktop
    let desktopHtml = `
        <div class="hidden md:block">
            <table class="w-full text-left">
                <thead>
                    <tr class="border-b border-borda">
                        <th class="p-3">Insumo</th>
                        <th class="p-3">Embalagem</th>
                        <th class="p-3 text-right">Custo Mín.</th>
                        <th class="p-3 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody>`;
    
    // Estrutura para Mobile
    let mobileHtml = `<div class="md:hidden space-y-4">`;

    const insumosOrdenados = [...insumosParaRenderizar].sort((a, b) => a.nome.localeCompare(b.nome));
    insumosOrdenados.forEach(insumo => {
        const iconeStatus = insumo.ativo 
            ? '<i class="bi bi-eye-slash-fill text-lg text-yellow-500"></i>' 
            : '<i class="bi bi-eye-fill text-lg text-green-400"></i>';
        const titleStatus = insumo.ativo ? 'Inativar' : 'Reativar';
        const opacityClass = !insumo.ativo ? 'opacity-50' : '';
        const embalagemStr = `${insumo.qtd_embalagem} ${insumo.unidade_compra} por ${insumo.preco_compra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;

        // Monta a linha da tabela para desktop
        desktopHtml += `
            <tr class="hover:bg-sidebar/50 ${opacityClass}">
                <td class="p-3 font-semibold">${insumo.nome}</td>
                <td class="p-3">${embalagemStr}</td>
                <td class="p-3 text-right font-mono text-principal font-semibold">${formatarCusto(insumo.custo_unitario_minimo, insumo.unidade_compra)}</td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="precificacaoFunctions.editarInsumo(${insumo.id})" class="text-blue-400 hover:text-blue-300 p-1" title="Editar"><i class="bi bi-pencil-fill"></i></button>
                        <button onclick="precificacaoFunctions.toggleStatusInsumo(${insumo.id})" class="p-1" title="${titleStatus}">${iconeStatus}</button>
                        <button onclick="precificacaoFunctions.deletarInsumo(${insumo.id})" class="text-red-500 hover:text-red-400 p-1" title="Excluir"><i class="bi bi-trash-fill"></i></button>
                    </div>
                </td>
            </tr>`;

        // Monta o card para mobile
        mobileHtml += `
            <div class="bg-fundo p-4 rounded-lg space-y-3 ${opacityClass}">
                <div class="flex justify-between items-start">
                    <h3 class="font-bold text-lg">${insumo.nome}</h3>
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="precificacaoFunctions.editarInsumo(${insumo.id})" class="text-blue-400 hover:text-blue-300 p-1" title="Editar"><i class="bi bi-pencil-fill"></i></button>
                        <button onclick="precificacaoFunctions.toggleStatusInsumo(${insumo.id})" class="p-1" title="${titleStatus}">${iconeStatus}</button>
                        <button onclick="precificacaoFunctions.deletarInsumo(${insumo.id})" class="text-red-500 hover:text-red-400 p-1" title="Excluir"><i class="bi bi-trash-fill"></i></button>
                    </div>
                </div>
                <div class="text-sm border-t border-borda/50 pt-3 space-y-2">
                    <p><span class="font-semibold text-texto-muted">Embalagem:</span> ${embalagemStr}</p>
                    <p><span class="font-semibold text-texto-muted">Custo Mínimo:</span> <span class="font-mono text-principal font-semibold">${formatarCusto(insumo.custo_unitario_minimo, insumo.unidade_compra)}</span></p>
                </div>
            </div>`;
    });

    desktopHtml += `</tbody></table></div>`;
    mobileHtml += `</div>`;
    container.innerHTML = desktopHtml + mobileHtml;
}

function editarInsumoNoForm(insumo) {
    const formContainer = formInsumo.parentElement;
    if (formContainer) {
        const formLabel = formContainer.querySelector('h2');
        if (formLabel) formLabel.textContent = 'Editar Insumo';
    }
    document.getElementById('insumo-id').value = insumo.id;
    document.getElementById('insumo-nome').value = insumo.nome;
    document.getElementById('insumo-unidade-compra').value = insumo.unidade_compra;
    document.getElementById('insumo-preco-compra').value = insumo.preco_compra;
    document.getElementById('insumo-qtd-embalagem').value = insumo.qtd_embalagem;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('insumo-id').value;
    const payload = {
        nome: document.getElementById('insumo-nome').value,
        unidade_compra: document.getElementById('insumo-unidade-compra').value,
        preco_compra: parseFloat(document.getElementById('insumo-preco-compra').value),
        qtd_embalagem: parseFloat(document.getElementById('insumo-qtd-embalagem').value)
    };
    if (!id) {
        payload.ativo = true;
    }
    const endpoint = id ? API_ENDPOINTS.update_insumo : API_ENDPOINTS.create_insumo;
    const acao = id ? 'Atualizando' : 'Criando';
    if (id) payload.id = parseInt(id);

    Swal.fire({ title: `${acao} insumo...`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
        await enviarParaAPI(endpoint, payload);
        Swal.fire('Sucesso!', `Insumo ${id ? 'atualizado' : 'criado'}!`, 'success');
        limparFormulario();
        await fetchInsumos();
    } catch (error) {
        // Silêncio aqui! O api.js já mostrou o erro.
        console.error("Erro ao salvar insumo, tratado globalmente:", error);
    }
}

async function toggleStatusInsumo(id) {
    const insumo = todosOsInsumos.find(i => i.id === id);
    if (!insumo) return;

    const payload = { id, ativo: !insumo.ativo };
    const acao = insumo.ativo ? 'Inativando' : 'Reativando';
    
    Swal.fire({ title: `${acao} insumo...`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
        await enviarParaAPI(API_ENDPOINTS.update_insumo, payload);
        Swal.fire('Sucesso!', `Insumo ${insumo.ativo ? 'inativado' : 'reativado'}!`, 'success');
        await fetchInsumos();
    } catch (error) {
        // Silêncio aqui! O api.js já mostrou o erro.
        console.error("Erro ao alterar status do insumo, tratado globalmente:", error);
    }
}

// ✅ ➕ ADICIONANDO A FUNÇÃO QUE FALTAVA AQUI
async function fetchInsumos() {
    try {
        const resposta = await fetchDeAPI(API_ENDPOINTS.get_all_insumos);
        todosOsInsumos = Array.isArray(resposta) ? resposta : [];
        renderizarTabelaInsumos();
    } catch (error) {
        console.error("Erro ao buscar insumos:", error);
        // Garante um feedback de erro visual caso a busca falhe
        const container = document.getElementById('container-insumos-lista');
        if(container) container.innerHTML = `<p class="text-center p-8 text-red-400">Falha ao carregar os dados dos insumos.</p>`;
    }
}

window.precificacaoFunctions = {
    editarInsumo: (id) => {
        const insumo = todosOsInsumos.find(i => i.id === id);
        if (insumo) editarInsumoNoForm(insumo);
    },
    toggleStatusInsumo,
    deletarInsumo: async (id) => {
        const insumo = todosOsInsumos.find(i => i.id === id);
        if (!insumo) return;
        const result = await Swal.fire({
            title: 'Tem certeza?',
            html: `Deseja apagar o insumo "<b>${insumo.nome}</b>"?`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
            confirmButtonText: 'Sim, pode apagar!', cancelButtonText: 'Cancelar'
        });
        if (result.isConfirmed) {
            Swal.fire({ title: 'Apagando...', didOpen: () => Swal.showLoading() });
            try {
                await enviarParaAPI(API_ENDPOINTS.delete_insumo, { id });
                Swal.fire('Apagado!', 'O insumo foi removido.', 'success');
                await fetchInsumos();
            } catch (error) {
                // Silêncio aqui! O api.js já mostrou o erro.
                console.error("Erro ao apagar insumo, tratado globalmente:", error);
            }
        }
    }
};

export function initPrecificacaoPage() {
    console.log("Maestro: Módulo de Precificação iniciado. 💰");
    formInsumo = document.getElementById('form-insumo');
    if (formInsumo) {
        formInsumo.addEventListener('submit', handleFormSubmit);
    }
    const btnLimpar = document.getElementById('btn-limpar-form');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparFormulario);
    }
    
    const toggleInativos = document.getElementById('toggle-ver-inativos');
    if(toggleInativos){
        toggleInativos.addEventListener('change', (e) => {
            mostrarInativos = e.target.checked;
            renderizarTabelaInsumos();
        });
    }

    fetchInsumos();
}