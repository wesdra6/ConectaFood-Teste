import { fetchDeAPI, enviarParaAPI } from './functions/api.js';
import { API_ENDPOINTS } from './config.js';

let todosOsGarcons = [];
let todasAsMesas = [];
let resumoAtribuicoes = [];
// ➕ NOVA VARIÁVEL GLOBAL
let todosOsFuncionarios = [];
let garcomSelecionadoParaAtribuicao = null;

const formatarData = (dataString) => {
    if (!dataString) return '<span class="text-texto-muted">Nunca</span>';
    return new Date(dataString).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

// ✅ FUNÇÃO ATUALIZADA PARA ADICIONAR O ONCLICK
function renderFuncionarios(funcionarios) {
    const container = document.getElementById('container-lista-funcionarios');
    if (!container) return;

    container.innerHTML = '';

    if (!Array.isArray(funcionarios) || funcionarios.length === 0) {
        container.innerHTML = `<p class="text-center p-8 text-texto-muted">Nenhum funcionário com acesso ao painel cadastrado.</p>`;
        return;
    }

    let desktopHtml = `<div class="hidden md:block overflow-x-auto"><table class="w-full text-left min-w-[700px]"><thead><tr class="border-b border-borda"><th class="p-3">Nome</th><th class="p-3">E-mail</th><th class="p-3 text-center">Cargo</th><th class="p-3 text-center">Último Login</th><th class="p-3 text-center">Ações</th></tr></thead><tbody>`;
    let mobileHtml = `<div class="md:hidden space-y-4">`;

    funcionarios.forEach(func => {
        const corRole = func.role === 'admin' ? 'text-principal font-bold' : 'text-texto-base';
        // ➕ BOTÃO AGORA CHAMA A FUNÇÃO DE DELETAR
        const deleteButtonHtml = `<button onclick="garconsAdminFunctions.handleDeletarFuncionario('${func.id}', '${func.nome_completo}')" class="text-red-500 hover:text-red-400 p-1" title="Excluir Funcionário"><i class="bi bi-trash-fill"></i></button>`;
        const deleteButtonMobileHtml = `<button onclick="garconsAdminFunctions.handleDeletarFuncionario('${func.id}', '${func.nome_completo}')" class="text-red-500 hover:text-red-400 p-1" title="Excluir Funcionário"><i class="bi bi-trash-fill text-xl"></i></button>`;

        desktopHtml += `<tr class="hover:bg-sidebar/50"><td class="p-3 font-semibold">${func.nome_completo || 'Não informado'}</td><td class="p-3">${func.email || 'Não informado'}</td><td class="p-3 text-center capitalize ${corRole}">${func.role}</td><td class="p-3 text-center">${formatarData(func.ultimo_login_em)}</td><td class="p-3 text-center">${deleteButtonHtml}</td></tr>`;
        mobileHtml += `<div class="bg-fundo p-4 rounded-lg space-y-3"><div class="flex justify-between items-start"><div><h3 class="font-bold text-lg">${func.nome_completo || 'Não informado'}</h3><p class="text-sm text-texto-muted">${func.email || 'Não informado'}</p></div>${deleteButtonMobileHtml}</div><div class="text-sm border-t border-borda/50 pt-3 flex justify-between items-center"><p><span class="font-semibold text-texto-muted">Cargo:</span> <span class="capitalize ${corRole}">${func.role}</span></p><p><span class="font-semibold text-texto-muted">Último Login:</span> ${formatarData(func.ultimo_login_em)}</p></div></div>`;
    });

    desktopHtml += `</tbody></table></div>`;
    mobileHtml += `</div>`;
    container.innerHTML = desktopHtml + mobileHtml;
}

// ➕ NOVA FUNÇÃO PARA DELETAR FUNCIONÁRIO
// ➕ NOVA FUNÇÃO PARA DELETAR FUNCIONÁRIO
async function handleDeletarFuncionario(id, nome) {
    const funcionario = todosOsFuncionarios.find(f => f.id === id);
    if (!funcionario) return;

    if (funcionario.role === 'admin') {
        Swal.fire({ icon: 'error', title: 'Ação Bloqueada', text: 'Não é possível excluir um usuário administrador por aqui.', background: '#2c2854', color: '#ffffff' });
        return;
    }

    const { isConfirmed } = await Swal.fire({
        title: 'Tem certeza?',
        html: `Deseja realmente remover o acesso de "<b>${nome}</b>"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sim, pode remover!',
        cancelButtonText: 'Cancelar',
        background: '#2c2854',
        color: '#ffffff'
    });

    if (isConfirmed) {
        Swal.fire({ title: 'Removendo acesso...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#2c2854', color: '#ffffff' });
        try {
            const resultado = await enviarParaAPI(API_ENDPOINTS.admin_delete_user, { id });
            // A verificação de sucesso agora é mais robusta
            if (resultado && (resultado.success || resultado[0]?.success)) {
                Swal.fire('Removido!', 'O acesso do funcionário foi removido.', 'success');
                await fetchDadosIniciais(); // Recarrega a lista
            } else {
                 // Deixa o api.js lidar com o erro
                 throw new Error(resultado.message || "Erro desconhecido do servidor.");
            }
        } catch (error) {
            // Silêncio aqui! O api.js já mostrou o erro.
            console.error("Erro ao remover acesso, tratado globalmente:", error);
        }
    }
}

function renderResumoAtribuicoes(resumo) {
    const container = document.getElementById('resumo-atribuicoes-container');
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(resumo) || resumo.length === 0) {
        container.innerHTML = '<p class="text-texto-muted">Nenhum garçom cadastrado para exibir o resumo.</p>';
        return;
    }

    let desktopHtml = `<div class="hidden md:block overflow-x-auto"><table class="w-full text-left min-w-[600px]"><thead><tr class="border-b border-borda"><th class="p-3 text-principal">Garçom</th><th class="p-3 text-principal">Mesas Atribuídas</th><th class="p-3 text-center text-principal">PIN</th></tr></thead><tbody>`;
    let mobileHtml = `<div class="md:hidden space-y-4">`;

    resumo.forEach(item => {
        const nomeGarcomHtml = item.mesas_atribuidas ? `<button onclick="garconsAdminFunctions.handleLiberarMesasDoGarcom('${item.id}', '${item.nome}')" class="font-semibold text-left text-texto-base hover:text-red-400 transition-colors" title="Clique para liberar todas as mesas de ${item.nome}">${item.nome} <i class="bi bi-unlock-fill text-xs text-texto-muted"></i></button>` : `<span class="font-semibold text-texto-base">${item.nome}</span>`;
        desktopHtml += `<tr class="hover:bg-sidebar/50"><td class="p-3">${nomeGarcomHtml}</td><td class="p-3 text-texto-muted">${item.mesas_atribuidas || 'Nenhuma'}</td><td class="p-3 text-center font-mono text-principal">${item.pin}</td></tr>`;
        mobileHtml += `<div class="bg-fundo p-4 rounded-lg"><div class="flex justify-between items-center mb-2">${nomeGarcomHtml}<p class="text-lg"><span class="font-semibold text-texto-muted">PIN:</span> <span class="font-mono text-principal">${item.pin}</span></p></div><div class="border-t border-borda/50 pt-2"><p><span class="font-semibold text-texto-muted">Mesas:</span> ${item.mesas_atribuidas || 'Nenhuma'}</p></div></div>`;
    });

    desktopHtml += `</tbody></table></div>`;
    mobileHtml += `</div>`;
    container.innerHTML = desktopHtml + mobileHtml;
}

function setupNovoUsuarioModal() {
    const modal = document.getElementById('modal-novo-usuario');
    const btnAbrir = document.getElementById('btn-abrir-modal-novo-usuario');
    const btnFechar = document.getElementById('btn-fechar-modal-novo-usuario');
    const form = document.getElementById('form-novo-usuario');

    if (!modal || !btnAbrir || !btnFechar || !form) return;

    btnAbrir.addEventListener('click', () => modal.classList.remove('hidden'));
    btnFechar.addEventListener('click', () => modal.classList.add('hidden'));
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            nome: document.getElementById('usuario-nome').value,
            email: document.getElementById('usuario-email').value,
            whatsapp: document.getElementById('usuario-whatsapp').value.replace(/\D/g, ''),
            senha: document.getElementById('usuario-senha').value
        };

        if (payload.senha.length < 6) {
            Swal.fire('Senha Fraca!', 'A senha precisa ter no mínimo 6 caracteres.', 'warning');
            return;
        }

        Swal.fire({
            title: 'Criando novo acesso...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        try {
            const resultado = await enviarParaAPI(API_ENDPOINTS.admin_create_user, payload);
            
            if (resultado.success) {
                Swal.fire('Sucesso!', 'Novo funcionário cadastrado.', 'success');
                modal.classList.add('hidden');
                form.reset();
                fetchDadosIniciais(); // Recarrega tudo
            } else {
                throw new Error(resultado.message || "Erro desconhecido retornado pelo servidor.");
            }
        } catch (error) {
            // Silêncio aqui! O api.js já mostrou o erro.
            console.error("Erro ao criar usuário, tratado globalmente:", error);
        }
    });
}

async function fetchDadosIniciais() {
    try {
        const [garcons, mesas, resumo] = await Promise.all([
            fetchDeAPI(API_ENDPOINTS.get_all_garcons),
            fetchDeAPI(API_ENDPOINTS.get_all_tables),
            fetchDeAPI(API_ENDPOINTS.get_garcons_resumo) 
        ]);
        todosOsGarcons = Array.isArray(garcons) ? garcons : [];
        todasAsMesas = Array.isArray(mesas) ? mesas : [];
        resumoAtribuicoes = Array.isArray(resumo) ? resumo : [];

        renderGarcons(todosOsGarcons);
        renderResumoAtribuicoes(resumoAtribuicoes); 
        renderMesasParaAtribuicao(null);
    } catch (error) {
        console.error("Erro ao buscar dados iniciais (Garçons/Mesas):", error);
        Swal.fire('Ops!', 'Não foi possível carregar os dados de Garçons e Mesas.', 'error');
    }

    try {
        const funcionarios = await fetchDeAPI(API_ENDPOINTS.admin_list_profiles);
        todosOsFuncionarios = Array.isArray(funcionarios) ? funcionarios : [];
        renderFuncionarios(todosOsFuncionarios);
    } catch (error) {
        console.error("Erro ao buscar dados de funcionários:", error);
        document.getElementById('container-lista-funcionarios').innerHTML = '<p class="text-center p-8 text-red-400">Falha ao carregar funcionários.</p>';
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
        const isChecked = mesa.garcom_id == garcomId;
        const isOwnedByOther = mesa.garcom_id && mesa.garcom_id != garcomId;
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

    const endpoint = id ? API_ENDPOINTS.update_garcom : API_ENDPOINTS.create_garcom;
    const payload = { nome, pin };
    if (id) payload.id = parseInt(id);
    
    Swal.fire({ title: 'Salvando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        await enviarParaAPI(endpoint, payload);
        Swal.fire('Sucesso!', `Garçom ${id ? 'atualizado' : 'cadastrado'}!`, 'success');
        limparFormulario();
        fetchDadosIniciais();
    } catch (error) {
        // Silêncio aqui! O api.js já mostrou o erro.
        console.error("Erro ao salvar garçom, tratado globalmente:", error);
    }
}

function handleEditarGarcom(id) {
    const idNumerico = parseInt(id);
    const garcom = todosOsGarcons.find(g => g.id === idNumerico);
    if (garcom) {
        document.getElementById('garcom-id').value = garcom.id;
        document.getElementById('garcom-nome').value = garcom.nome;
        document.getElementById('garcom-pin').value = garcom.pin;
        document.getElementById('form-garcom').scrollIntoView({ behavior: 'smooth' });
    }
}

async function handleDeletarGarcom(id) {
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
            await enviarParaAPI(API_ENDPOINTS.delete_garcom, { id: idNumerico });
            Swal.fire('Apagado!', 'O garçom foi removido.', 'success');
            fetchDadosIniciais();
        } catch (error) {
            // Silêncio aqui! O api.js já mostrou o erro.
            console.error("Erro ao apagar garçom, tratado globalmente:", error);
        }
    }
}

async function handleSalvarAtribuicoes() {
    if (!garcomSelecionadoParaAtribuicao) {
        Swal.fire('Opa!', 'Selecione um garçom primeiro.', 'warning');
        return;
    }

    const checkboxes = document.querySelectorAll('.mesa-checkbox:checked');
    const mesas_ids = Array.from(checkboxes).map(cb => parseInt(cb.value));

    const payload = { garcom_id: parseInt(garcomSelecionadoParaAtribuicao), mesas_ids };
    
    Swal.fire({ title: 'Salvando atribuições...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    try {
        await enviarParaAPI(API_ENDPOINTS.update_table_assignments, payload);
        Swal.fire('Sucesso!', 'As atribuições foram atualizadas!', 'success');
        await fetchDadosIniciais();
        document.getElementById('select-garcom-atribuicao').value = '';
        renderMesasParaAtribuicao(null);
    } catch (error) {
        // Silêncio aqui! O api.js já mostrou o erro.
        console.error("Erro ao salvar atribuições, tratado globalmente:", error);
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
            await enviarParaAPI(API_ENDPOINTS.clear_table_assignments, { garcom_id: garcomId });
            Swal.fire('Sucesso!', `As mesas de ${garcomNome} foram liberadas.`, 'success');
            await fetchDadosIniciais();
            document.getElementById('select-garcom-atribuicao').value = '';
            renderMesasParaAtribuicao(null);
        } catch (error) {
            // Silêncio aqui! O api.js já mostrou o erro.
            console.error("Erro ao liberar mesas, tratado globalmente:", error);
        }
    }
}

function limparFormulario() {
    document.getElementById('form-garcom').reset();
    document.getElementById('garcom-id').value = '';
}

export function initGarconsAdminPage() {
    console.log("Maestro: Torre de Controle dos Garçons iniciada! 🚀");
    fetchDadosIniciais();
    
    setupNovoUsuarioModal();

    document.getElementById('form-garcom').addEventListener('submit', handleSalvarGarcom);
    document.getElementById('btn-limpar-garcom-form').addEventListener('click', limparFormulario);
    document.getElementById('select-garcom-atribuicao').addEventListener('change', (e) => renderMesasParaAtribuicao(e.target.value));
    document.getElementById('btn-salvar-atribuicoes').addEventListener('click', handleSalvarAtribuicoes);
    
    // ✅ FUNÇÕES EXPOSTAS GLOBALMENTE
    window.garconsAdminFunctions = {
        handleEditarGarcom,
        handleDeletarGarcom,
        handleLiberarMesasDoGarcom,
        handleDeletarFuncionario
    };
}