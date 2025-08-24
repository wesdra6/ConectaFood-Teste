// REESCREVA O ARQUIVO COMPLETO: app/js/precificacao.js

import { fetchDeAPI, enviarParaAPI } from './functions/api.js';
// ✅ CORREÇÃO AQUI: O caminho correto é './config.js'
import { API_ENDPOINTS } from './config.js';

let todosOsInsumos = [];
let formInsumo;

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
    const corpoTabela = document.getElementById('tabela-insumos-corpo');
    if (!corpoTabela) return;
    corpoTabela.innerHTML = '';
    if (todosOsInsumos.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="4" class="text-center p-8 text-texto-muted">Nenhum insumo cadastrado ainda.</td></tr>`;
        return;
    }
    const insumosOrdenados = [...todosOsInsumos].sort((a, b) => a.nome.localeCompare(b.nome));
    insumosOrdenados.forEach(insumo => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-sidebar/50';
        tr.innerHTML = `
            <td class="p-3"><p class="semi-bold">${insumo.nome}</p><p class="text-sm text-texto-muted sm:hidden">${insumo.qtd_embalagem} ${insumo.unidade_compra} por ${insumo.preco_compra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></td>
            <td class="p-3 hidden sm:table-cell">${insumo.qtd_embalagem} ${insumo.unidade_compra} por ${insumo.preco_compra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td class="p-3 text-right font-mono text-principal font-semibold">${formatarCusto(insumo.custo_unitario_minimo, insumo.unidade_compra)}</td>
            <td class="p-3 text-center"><div class="flex items-center justify-center gap-2"><button onclick="precificacaoFunctions.editarInsumo(${insumo.id})" class="text-blue-400 hover:text-blue-300 p-1" title="Editar"><i class="bi bi-pencil-fill"></i></button><button onclick="precificacaoFunctions.deletarInsumo(${insumo.id})" class="text-red-500 hover:text-red-400 p-1" title="Excluir"><i class="bi bi-trash-fill"></i></button></div></td>
        `;
        corpoTabela.appendChild(tr);
    });
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
        Swal.fire('Ops!', `Não foi possível salvar o insumo: ${error.message}`, 'error');
    }
}

window.precificacaoFunctions = {
    editarInsumo: (id) => {
        const insumo = todosOsInsumos.find(i => i.id === id);
        if (insumo) editarInsumoNoForm(insumo);
    },
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
                Swal.fire('Ops!', `Não foi possível apagar o insumo: ${error.message}`, 'error');
            }
        }
    }
};

async function fetchInsumos() {
    try {
        const resposta = await fetchDeAPI(API_ENDPOINTS.get_all_insumos);
        todosOsInsumos = Array.isArray(resposta) ? resposta : [];
        renderizarTabelaInsumos();
    } catch (error) {
        console.error("Erro ao buscar insumos:", error);
        document.getElementById('tabela-insumos-corpo').innerHTML = `<tr><td colspan="4" class="text-center p-8 text-red-400">Falha ao carregar os dados.</td></tr>`;
    }
}

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
    fetchInsumos();
}