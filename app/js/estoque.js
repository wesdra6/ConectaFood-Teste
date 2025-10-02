import { fetchDeAPI, enviarParaAPI } from './functions/api.js';
import { API_ENDPOINTS } from './config.js';

let todosOsInsumos = [];

function renderizarTabelaEstoque() {
    const container = document.getElementById('container-estoque-lista');
    const placeholder = document.getElementById('estoque-placeholder');
    if (!container || !placeholder) return;

    placeholder.style.display = 'none';
    
    // Filtra para mostrar apenas insumos ativos na tela de estoque
    const insumosAtivos = todosOsInsumos.filter(i => i.ativo);

    if (insumosAtivos.length === 0) {
        container.innerHTML = `<p class="text-center p-8 text-texto-muted">Nenhum insumo ativo cadastrado.</p>`;
        return;
    }

    let desktopHtml = `
        <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr class="border-b-2 border-borda">
                        <th class="p-3">Insumo</th>
                        <th class="p-3 text-center">Estoque Atual</th>
                        <th class="p-3">Unidade de Compra</th>
                        <th class="p-3 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody>`;
    
    let mobileHtml = `<div class="md:hidden space-y-4">`;

    const insumosOrdenados = [...insumosAtivos].sort((a, b) => a.nome.localeCompare(b.nome));
    insumosOrdenados.forEach(insumo => {
        const estoqueAtual = parseFloat(insumo.quantidade_estoque || 0);
        const corEstoque = estoqueAtual > 0 ? 'text-green-400' : 'text-red-500';
        
        // Monta a linha da tabela para desktop
        desktopHtml += `
            <tr class="hover:bg-sidebar/50">
                <td class="p-3 font-semibold">${insumo.nome}</td>
                <td class="p-3 text-center font-bold text-lg ${corEstoque}">${estoqueAtual.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}</td>
                <td class="p-3">${insumo.unidade_compra}</td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="estoqueFunctions.abrirModal('modal-entrada-estoque', ${insumo.id})" class="bg-green-600 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-green-700" title="Dar Entrada">+</button>
                        <button onclick="estoqueFunctions.abrirModal('modal-saida-estoque', ${insumo.id})" class="bg-red-600 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-red-700" title="Dar Saída Manual">-</button>
                        <button onclick="estoqueFunctions.abrirModalHistorico(${insumo.id})" class="bg-blue-600 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-blue-700" title="Ver Histórico"><i class="bi bi-clock-history"></i></button>
                    </div>
                </td>
            </tr>`;
            
        // Monta o card para mobile
        mobileHtml += `
            <div class="bg-fundo p-4 rounded-lg space-y-3">
                <div class="flex justify-between items-start">
                    <h3 class="font-bold text-lg">${insumo.nome}</h3>
                    <div class="flex items-center justify-center gap-2">
                         <button onclick="estoqueFunctions.abrirModal('modal-entrada-estoque', ${insumo.id})" class="bg-green-600 text-white font-bold h-8 w-8 rounded-md text-lg hover:bg-green-700" title="Dar Entrada">+</button>
                         <button onclick="estoqueFunctions.abrirModal('modal-saida-estoque', ${insumo.id})" class="bg-red-600 text-white font-bold h-8 w-8 rounded-md text-lg hover:bg-red-700" title="Dar Saída Manual">-</button>
                         <button onclick="estoqueFunctions.abrirModalHistorico(${insumo.id})" class="bg-blue-600 text-white font-bold h-8 w-8 rounded-md text-lg hover:bg-blue-700" title="Ver Histórico"><i class="bi bi-clock-history"></i></button>
                    </div>
                </div>
                <div class="text-sm border-t border-borda/50 pt-3 flex justify-between items-center">
                    <p><span class="font-semibold text-texto-muted">Unidade:</span> ${insumo.unidade_compra}</p>
                    <p><span class="font-semibold text-texto-muted">Em Estoque:</span> <span class="font-bold text-xl ${corEstoque}">${estoqueAtual.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}</span></p>
                </div>
            </div>`;
    });

    desktopHtml += `</tbody></table></div>`;
    mobileHtml += `</div>`;
    container.innerHTML = desktopHtml + mobileHtml;
}

async function fetchInsumos() {
    try {
        const resposta = await fetchDeAPI(API_ENDPOINTS.get_all_insumos);
        todosOsInsumos = Array.isArray(resposta) ? resposta : [];
        renderizarTabelaEstoque();
    } catch (error) {
        console.error("Erro ao buscar insumos para o estoque:", error);
        document.getElementById('tabela-estoque-corpo').innerHTML = `<tr><td colspan="4" class="text-center p-8 text-red-400">Falha ao carregar os dados.</td></tr>`;
    }
}

async function handleEntradaEstoque(event) {
    event.preventDefault();
    const payload = {
        insumo_id: parseInt(document.getElementById('entrada-insumo-id').value),
        quantidade: parseFloat(document.getElementById('entrada-quantidade').value),
        observacao: document.getElementById('entrada-observacao').value
    };

    Swal.fire({ title: 'Registrando entrada...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
        await enviarParaAPI(API_ENDPOINTS.add_stock_entry, payload);
        Swal.fire('Sucesso!', 'Entrada de estoque registrada!', 'success');
        fecharModal('modal-entrada-estoque');
        fetchInsumos();
    } catch (error) {
        console.error("Erro tratado globalmente em api.js:", error);
    }
}

async function handleSaidaEstoque(event) {
    event.preventDefault();
    const payload = {
        insumo_id: parseInt(document.getElementById('saida-insumo-id').value),
        quantidade: parseFloat(document.getElementById('saida-quantidade').value),
        observacao: document.getElementById('saida-observacao').value
    };

    Swal.fire({ title: 'Registrando saída...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
        await enviarParaAPI(API_ENDPOINTS.add_stock_exit, payload);
        Swal.fire('Sucesso!', 'Saída de estoque registrada!', 'success');
        fecharModal('modal-saida-estoque');
        fetchInsumos();
    } catch (error) {
        console.error("Erro tratado globalmente em api.js:", error);
    }
}

function abrirModal(modalId, insumoId) {
    const insumo = todosOsInsumos.find(i => i.id === insumoId);
    if (!insumo) return;

    const modal = document.getElementById(modalId);
    if (modal) {
        if (modalId === 'modal-entrada-estoque') {
            document.getElementById('entrada-insumo-id').value = insumo.id;
            document.getElementById('entrada-insumo-nome').textContent = insumo.nome;
            document.querySelector('label[for="entrada-quantidade"]').innerHTML = `Quantidade a Adicionar <span class="text-xs font-normal text-principal">(${insumo.unidade_compra})</span>`;
            document.getElementById('form-entrada-estoque').reset();
        } else if (modalId === 'modal-saida-estoque') {
            document.getElementById('saida-insumo-id').value = insumo.id;
            document.getElementById('saida-insumo-nome').textContent = insumo.nome;
            document.querySelector('label[for="saida-quantidade"]').innerHTML = `Quantidade a Remover <span class="text-xs font-normal text-principal">(${insumo.unidade_compra})</span>`;
            document.getElementById('form-saida-estoque').reset();
        } else if (modalId === 'modal-historico-estoque') {
            document.getElementById('historico-insumo-nome').textContent = insumo.nome;
        }
        modal.classList.remove('hidden');
    }
}

async function abrirModalHistorico(insumoId) {
    const insumo = todosOsInsumos.find(i => i.id === insumoId);
    if (!insumo) return;

    abrirModal('modal-historico-estoque', insumoId);
    const container = document.getElementById('historico-tabela-container');
    container.innerHTML = `<p class="text-center animate-pulse p-4">Buscando histórico...</p>`;
    
    try {
        // ✅ CORREÇÃO AQUI: Usando o endpoint correto do config.js
        const movs = await fetchDeAPI(`${API_ENDPOINTS.get_stock_history}?insumo_id=${insumoId}`); 
        
        if (!Array.isArray(movs) || movs.length === 0) {
            container.innerHTML = `<p class="text-center text-texto-muted p-4">Nenhuma movimentação registrada para este item.</p>`;
            return;
        }

        let tabelaHtml = `
            <table class="w-full text-sm text-left">
                <thead class="sticky top-0 bg-sidebar">
                    <tr class="border-b border-borda">
                        <th class="p-2">Data</th>
                        <th class="p-2">Tipo</th>
                        <th class="p-2 text-right">Quantidade</th>
                        <th class="p-2">Observação</th>
                        <th class="p-2 text-center">Ação</th>
                    </tr>
                </thead>
                <tbody>`;
        
        movs.forEach(mov => {
            const tipoClasse = {
                'ENTRADA': 'text-green-400',
                'SAIDA_MANUAL': 'text-yellow-500',
                'VENDA': 'text-red-500',
                'ESTORNO': 'text-blue-400'
            }[mov.tipo_movimentacao] || '';
            
            const quantidadeFormatada = parseFloat(mov.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 3 });

            tabelaHtml += `
                <tr class="border-b border-borda/50">
                    <td class="p-2 whitespace-nowrap">${new Date(mov.created_at).toLocaleString('pt-BR')}</td>
                    <td class="p-2 font-semibold ${tipoClasse}">${mov.tipo_movimentacao}</td>
                    <td class="p-2 text-right font-mono">${quantidadeFormatada}</td>
                    <td class="p-2">${mov.observacao || '-'}</td>
                    <td class="p-2 text-center">
                        ${mov.tipo_movimentacao !== 'ESTORNO' ? 
                          `<button onclick="estoqueFunctions.estornar(${mov.id}, '${insumo.nome}')" class="text-blue-400 hover:text-blue-300" title="Estornar esta movimentação"><i class="bi bi-arrow-counterclockwise"></i></button>` 
                          : ''
                        }
                    </td>
                </tr>`;
        });
        tabelaHtml += '</tbody></table>';
        container.innerHTML = tabelaHtml;
    } catch(e) {
        container.innerHTML = `<p class="text-red-500 text-center p-4">Não foi possível carregar o histórico.</p>`
    }
}

async function estornar(movimentacaoId, insumoNome) {
     const result = await Swal.fire({
        title: 'Estornar Movimentação?',
        html: `Tem certeza que deseja reverter esta operação para o insumo <b>${insumoNome}</b>? <br><br>Esta ação irá corrigir o estoque, mas não pode ser desfeita.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sim, estornar!',
        cancelButtonText: 'Cancelar'
    });

    if(result.isConfirmed) {
        Swal.fire({ title: 'Processando Estorno...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            await enviarParaAPI(API_ENDPOINTS.reverse_stock_movement, { movimentacao_id: movimentacaoId });
            Swal.fire('Sucesso!', 'A movimentação foi estornada e o estoque corrigido.', 'success');
            fecharModal('modal-historico-estoque');
            await fetchInsumos(); // ✅ Garante que a tabela principal atualize
        } catch(error) {
            console.error("Erro tratado globalmente em api.js:", error);
        }
    }
}

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

window.estoqueFunctions = {
    abrirModal,
    fecharModal,
    abrirModalHistorico,
    estornar
};

export function initEstoquePage() {
    console.log("Maestro: Módulo de Estoque iniciado. 📦");
    document.getElementById('form-entrada-estoque')?.addEventListener('submit', handleEntradaEstoque);
    document.getElementById('form-saida-estoque')?.addEventListener('submit', handleSaidaEstoque);
    fetchInsumos();
}