// REESCREVA O ARQUIVO COMPLETO: js/garcons-admin.js

import { fetchDeN8N, enviarParaN8N } from './functions/api.js';

let todosOsGarcons = [];
let todasAsMesas = [];
let resumoAtribuicoes = []; 
let garcomSelecionadoParaAtribuicao = null;

async function carregarConfiguracoesLoja() {
    try {
        const configs = await fetchDeN8N(window.N8N_CONFIG.get_loja_config);
        if (configs && configs.length > 0) {
            const { nome_loja, logo_vitrine_url } = configs[0];
            const logoContainer = document.getElementById('logo-container');
            document.title = `Painel de Garçons - ${nome_loja || 'Meu Negócio'}`;

            if (logoContainer) {
                if (logo_vitrine_url) {
                    logoContainer.innerHTML = `<img src="${logo_vitrine_url}" alt="${nome_loja}" class="max-h-16 w-auto">`;
                } else if (nome_loja) {
                    logoContainer.innerHTML = `<span class="text-2xl font-bold text-principal">${nome_loja}</span>`;
                }
            }
        }
    } catch (error) {
        console.error("Erro ao carregar as configurações da loja:", error);
    }
}

async function fetchDadosIniciais() {
    try {
        const [garcons, mesas, resumo] = await Promise.all([
            fetchDeN8N(window.N8N_CONFIG.get_all_garcons),
            fetchDeN8N(window.N8N_CONFIG.get_all_tables),
            fetchDeN8N(window.N8N_CONFIG.get_garcons_resumo) 
        ]);
        todosOsGarcons = Array.isArray(garcons) ? garcons : [];
        todasAsMesas = Array.isArray(mesas) ? mesas : [];
        resumoAtribuicoes = Array.isArray(resumo) ? resumo : [];

        renderGarcons(todosOsGarcons);
        renderResumoAtribuicoes(resumoAtribuicoes); 
        renderMesasParaAtribuicao(null);
    } catch (error) {
        console.error("Erro ao buscar dados iniciais:", error);
        Swal.fire('Ops!', 'Não foi possível carregar os dados do painel.', 'error');
    }
}

function renderGarcons(garcons) {
    const listaContainer = document.getElementById('lista-garcons');
    const selectContainer = document.getElementById('select-garcom-atribuicao');
    if (!listaContainer || !selectContainer) return;

    listaContainer.innerHTML = '';
    while (selectContainer.options.length > 1) { selectContainer.remove(1); }

    if (garcons.length === 0) {
        listaContainer.innerHTML = '<p class="text-texto-muted">Nenhum garçom cadastrado.</p>';
        return;
    }

    garcons.forEach(garcom => {
        const garcomEl = document.createElement('div');
        garcomEl.className = 'flex items-center justify-between bg-fundo p-3 rounded-lg';
        garcomEl.innerHTML = `
            <span class="font-bold">${garcom.nome}</span>
            <div class="flex items-center gap-2">
                <button onclick="garconsAdminFunctions.handleEditarGarcom('${garcom.id}')" class="text-blue-400 hover:text-blue-300 p-1"><i class="bi bi-pencil-fill"></i></button>
                <button onclick="garconsAdminFunctions.handleDeletarGarcom('${garcom.id}')" class="text-red-500 hover:text-red-400 p-1"><i class="bi bi-trash-fill"></i></button>
            </div>
        `;
        listaContainer.appendChild(garcomEl);

        const optionEl = document.createElement('option');
        optionEl.value = garcom.id;
        optionEl.textContent = garcom.nome;
        selectContainer.appendChild(optionEl);
    });
}

function renderResumoAtribuicoes(resumo) {
    const container = document.getElementById('resumo-atribuicoes-container');
    if (!container) return;
    container.innerHTML = '';

    if (resumo.length === 0) {
        container.innerHTML = '<p class="text-texto-muted">Nenhum garçom cadastrado para exibir o resumo.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'w-full text-left min-w-[600px] p-4'; 
    table.innerHTML = `
        <thead>
            <tr class="border-b border-borda">
                <th class="p-3 text-principal">Garçom</th>
                <th class="p-3 text-principal">Mesas Atribuídas</th>
                <th class="p-3 text-center text-principal">PIN</th>
            </tr>
        </thead>
    `;
    const tbody = document.createElement('tbody');
    resumo.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-sidebar/50';
        
        const nomeGarcomHtml = item.mesas_atribuidas 
            ? `<button onclick="garconsAdminFunctions.handleLiberarMesasDoGarcom('${item.id}', '${item.nome}')" 
                       class="font-semibold text-left text-texto-base hover:text-red-400 transition-colors" 
                       title="Clique para liberar todas as mesas de ${item.nome}">
                   ${item.nome} <i class="bi bi-unlock-fill text-xs text-texto-muted"></i>
               </button>`
            : `<span class="font-semibold text-texto-base">${item.nome}</span>`;

        tr.innerHTML = `
            <td class="p-3">${nomeGarcomHtml}</td>
            <td class="p-3 text-texto-muted">${item.mesas_atribuidas || 'Nenhuma'}</td>
            <td class="p-3 text-center font-mono text-principal">${item.pin}</td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
}


function renderMesasParaAtribuicao(garcomId) {
    const container = document.getElementById('lista-mesas-atribuicao');
    const btnSalvar = document.getElementById('btn-salvar-atribuicoes');
    if (!container || !btnSalvar) return;

    garcomSelecionadoParaAtribuicao = garcomId;
    container.innerHTML = '';
    btnSalvar.disabled = !garcomId;

    if (!garcomId) {
        container.innerHTML = '<p class="col-span-full text-center text-texto-muted">Selecione um garçom para ver as mesas.</p>';
        return;
    }
    
    todasAsMesas.sort((a,b) => a.numero_mesa - b.numero_mesa).forEach(mesa => {
        const isChecked = mesa.garcom_id === garcomId;
        const isOwnedByOther = mesa.garcom_id && mesa.garcom_id !== garcomId;
        const garcomAtual = isOwnedByOther ? todosOsGarcons.find(g => g.id === mesa.garcom_id) : null;

        const mesaEl = document.createElement('div');
        mesaEl.className = `p-2 rounded-lg text-center border-2 transition-colors duration-200 ${isChecked ? 'border-green-500 bg-green-500/20' : 'border-borda'} ${isOwnedByOther ? 'opacity-50 cursor-not-allowed bg-fundo' : 'cursor-pointer'}`;
        
        mesaEl.innerHTML = `
            <label class="flex flex-col items-center justify-between h-full ${isOwnedByOther ? '' : 'cursor-pointer'}">
                <div class="flex-grow flex flex-col justify-center">
                    <span class="font-bold text-lg">Mesa ${mesa.numero_mesa}</span>
                    ${isOwnedByOther ? `<span class="block text-xs text-texto-muted truncate" title="${garcomAtual?.nome}">${garcomAtual?.nome.split(' ')[0]}</span>` : '<div class="h-4"></div>'}
                </div>
                <input type="checkbox" value="${mesa.id}" class="mesa-checkbox mt-1 accent-principal" ${isChecked ? 'checked' : ''} ${isOwnedByOther ? 'disabled' : ''}>
            </label>
        `;
        
        if (!isOwnedByOther) {
            mesaEl.addEventListener('click', (e) => {
                const checkbox = mesaEl.querySelector('input');
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                }
                mesaEl.classList.toggle('border-green-500', checkbox.checked);
                mesaEl.classList.toggle('bg-green-500/20', checkbox.checked);
                mesaEl.classList.toggle('border-borda', !checkbox.checked);
            });
        }
        container.appendChild(mesaEl);
    });
}

async function handleSalvarGarcom(event) {
    event.preventDefault();
    const id = document.getElementById('garcom-id').value;
    const nome = document.getElementById('garcom-nome').value.trim();
    const pin = document.getElementById('garcom-pin').value.trim();

    if (!nome || !pin) { Swal.fire('Campos vazios', 'Nome e PIN são obrigatórios.', 'warning'); return; }
    if (pin.length !== 4 || !/^\d+$/.test(pin)) { Swal.fire('PIN Inválido', 'O PIN deve ter exatamente 4 dígitos numéricos.', 'warning'); return; }

    const endpoint = id ? window.N8N_CONFIG.update_garcom : window.N8N_CONFIG.create_garcom;
    const payload = { nome, pin };
    // ➕ AJUSTE CIRÚRGICO 👇: Garantir que o ID seja enviado como número no update.
    if (id) payload.id = parseInt(id);
    
    Swal.fire({ title: 'Salvando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        await enviarParaN8N(endpoint, payload);
        Swal.fire('Sucesso!', `Garçom ${id ? 'atualizado' : 'cadastrado'}!`, 'success');
        limparFormulario();
        fetchDadosIniciais();
    } catch (error) {
        Swal.fire('Ops!', `Não foi possível salvar o garçom: ${error.message}`, 'error');
    }
}

function handleEditarGarcom(id) {
    // ➕ AJUSTE CIRÚRGICO 👇: O ID vem como string do HTML, convertemos para número.
    const idNumerico = parseInt(id);
    const garcom = todosOsGarcons.find(g => g.id === idNumerico);
    if (garcom) {
        document.getElementById('garcom-id').value = garcom.id;
        document.getElementById('garcom-nome').value = garcom.nome;
        // ➕ AJUSTE CIRÚRGICO 👇: O campo PIN não estava sendo preenchido. Corrigido!
        document.getElementById('garcom-pin').value = garcom.pin;
        document.getElementById('form-garcom').scrollIntoView({ behavior: 'smooth' });
    }
}

async function handleDeletarGarcom(id) {
    // ➕ AJUSTE CIRÚRGICO 👇: O ID vem como string do HTML, convertemos para número.
    const idNumerico = parseInt(id);
    const garcom = todosOsGarcons.find(g => g.id === idNumerico);
    if (!garcom) return;

    const result = await Swal.fire({
        title: 'Tem certeza?',
        html: `Deseja apagar "<b>${garcom.nome}</b>"? As mesas atribuídas a ele ficarão livres.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sim, pode apagar!',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        Swal.fire({ title: 'Apagando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            await enviarParaN8N(window.N8N_CONFIG.delete_garcom, { id: idNumerico });
            Swal.fire('Apagado!', 'O garçom foi removido.', 'success');
            fetchDadosIniciais();
        } catch (error) {
            Swal.fire('Ops!', `Não foi possível apagar o garçom: ${error.message}`, 'error');
        }
    }
}

async function handleSalvarAtribuicoes() {
    if (!garcomSelecionadoParaAtribuicao) {
        Swal.fire('Opa!', 'Selecione um garçom primeiro.', 'warning');
        return;
    }

    const checkboxes = document.querySelectorAll('.mesa-checkbox:checked');
    const mesas_ids = Array.from(checkboxes).map(cb => cb.value);

    let endpoint;
    let payload = { garcom_id: garcomSelecionadoParaAtribuicao };
    let confirmacao = { isConfirmed: true };

    if (mesas_ids.length > 0) {
        endpoint = window.N8N_CONFIG.update_table_assignments;
        payload.mesas_ids = mesas_ids;
    } else {
        endpoint = window.N8N_CONFIG.clear_table_assignments;
        confirmacao = await Swal.fire({
            title: 'Liberar todas as mesas?',
            text: `Confirma que deseja remover todas as mesas deste garçom?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, liberar!',
            cancelButtonText: 'Cancelar'
        });
    }

    if (confirmacao.isConfirmed) {
        Swal.fire({ title: 'Salvando atribuições...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        try {
            await enviarParaN8N(endpoint, payload);
            Swal.fire('Sucesso!', 'As atribuições foram atualizadas!', 'success');
            await fetchDadosIniciais();
            document.getElementById('select-garcom-atribuicao').value = '';
            renderMesasParaAtribuicao(null);
        } catch (error) {
            Swal.fire('Ops!', `Não foi possível salvar as atribuições: ${error.message}`, 'error');
        }
    } else if (confirmacao.dismiss === Swal.DismissReason.cancel) {
        renderMesasParaAtribuicao(garcomSelecionadoParaAtribuicao);
    }
}

async function handleLiberarMesasDoGarcom(garcomId, garcomNome) {
    const confirmacao = await Swal.fire({
        title: `Liberar mesas de ${garcomNome}?`,
        text: "Todas as mesas atualmente atribuídas a este garçom ficarão livres.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, liberar!',
        cancelButtonText: 'Cancelar'
    });

    if (confirmacao.isConfirmed) {
        Swal.fire({ title: 'Liberando mesas...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            await enviarParaN8N(window.N8N_CONFIG.clear_table_assignments, { garcom_id: garcomId });
            Swal.fire('Sucesso!', `As mesas de ${garcomNome} foram liberadas.`, 'success');
            await fetchDadosIniciais();
            document.getElementById('select-garcom-atribuicao').value = '';
            renderMesasParaAtribuicao(null);
        } catch (error) {
            Swal.fire('Ops!', `Não foi possível liberar as mesas: ${error.message}`, 'error');
        }
    }
}

function limparFormulario() {
    document.getElementById('form-garcom').reset();
    document.getElementById('garcom-id').value = '';
}

function initGarconsAdminPage() {
    console.log("Maestro: Torre de Controle dos Garçons iniciada! 🚀");

    carregarConfiguracoesLoja();
    fetchDadosIniciais();

    document.getElementById('form-garcom').addEventListener('submit', handleSalvarGarcom);
    document.getElementById('btn-limpar-garcom-form').addEventListener('click', limparFormulario);
    document.getElementById('select-garcom-atribuicao').addEventListener('change', (e) => renderMesasParaAtribuicao(e.target.value));
    document.getElementById('btn-salvar-atribuicoes').addEventListener('click', handleSalvarAtribuicoes);
    
    window.garconsAdminFunctions = {
        handleEditarGarcom,
        handleDeletarGarcom,
        handleLiberarMesasDoGarcom 
    };
}

document.addEventListener('DOMContentLoaded', initGarconsAdminPage);