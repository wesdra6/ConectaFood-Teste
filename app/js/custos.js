import { fetchDeAPI, enviarParaAPI } from './functions/api.js';
import { API_ENDPOINTS } from './config.js';

let custosDoPeriodo = [];

const formatarMoeda = (valor) => (valor != null ? Number(valor) : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatarMesAno = (dataString) => {
    if (!dataString) return '-';
    const data = new Date(dataString + 'T03:00:00Z');
    const mes = (data.getUTCMonth() + 1).toString().padStart(2, '0');
    const ano = data.getUTCFullYear();
    return `${mes}/${ano}`;
};
const formatarDataCompleta = (dataString) => {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

function renderizarTabelaCustos() {
    const corpoTabela = document.getElementById('tabela-custos-corpo');
    const placeholder = document.getElementById('custos-placeholder');
    const totalMesEl = document.getElementById('custos-total-mes');
    
    if (!corpoTabela || !placeholder || !totalMesEl) return;

    placeholder.style.display = 'none';
    corpoTabela.innerHTML = '';
    
    if (custosDoPeriodo.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-texto-muted">Nenhum custo encontrado para este mês.</td></tr>`;
        totalMesEl.textContent = formatarMoeda(0);
        return;
    }

    let totalMes = 0;
    custosDoPeriodo.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    custosDoPeriodo.forEach(custo => {
        totalMes += parseFloat(custo.valor);
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-sidebar/50';
        tr.innerHTML = `
            <td class="p-3 font-semibold">${custo.descricao}</td>
            <td class="p-3 text-right font-mono">${formatarMoeda(custo.valor)}</td>
            <td class="p-3 text-center">${formatarMesAno(custo.data_competencia)}</td>
            <td class="p-3 text-center text-texto-muted">${formatarDataCompleta(custo.created_at)}</td>
            <td class="p-3 text-center">
                <button onclick="custosFunctions.deletarCusto(${custo.id}, '${custo.descricao}')" class="text-red-500 hover:text-red-400 p-1" title="Excluir Lançamento">
                    <i class="bi bi-trash-fill"></i>
                </button>
            </td>
        `;
        corpoTabela.appendChild(tr);
    });

    totalMesEl.textContent = formatarMoeda(totalMes);
}

async function fetchCustosPorPeriodo() {
    const filtroEl = document.getElementById('filtro-mes-custos');
    if (!filtroEl.value) return; 
    
    const [ano, mes] = filtroEl.value.split('-');
    
    const inicio = `${ano}-${mes}-01`;
    const ultimoDia = new Date(ano, parseInt(mes, 10), 0).getDate();
    const fim = `${ano}-${mes}-${ultimoDia}`;
    
    const placeholder = document.getElementById('custos-placeholder');
    placeholder.style.display = 'block';
    placeholder.textContent = 'Buscando custos...';

    try {
        const resposta = await fetchDeAPI(`${API_ENDPOINTS.get_operational_costs}?inicio=${inicio}&fim=${fim}`);
        custosDoPeriodo = Array.isArray(resposta) ? resposta : [];
        renderizarTabelaCustos();
    } catch (error) {
        console.error("Erro ao buscar custos:", error);
        if(placeholder) placeholder.innerHTML = `<p class="text-red-400">Falha ao carregar os dados.</p>`;
    }
}

async function handleNovoCusto(event) {
    event.preventDefault();
    const form = event.target;
    const dataCompetencia = document.getElementById('custo-data').value;
    const payload = {
        descricao: document.getElementById('custo-descricao').value,
        valor: parseFloat(document.getElementById('custo-valor').value),
        data_competencia: dataCompetencia
    };

    Swal.fire({ title: 'Lançando custo...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
        await enviarParaAPI(API_ENDPOINTS.create_operational_cost, payload);
        Swal.fire('Sucesso!', 'Custo lançado!', 'success');
        form.reset();
        await fetchCustosPorPeriodo();
    } catch (error) {
        console.error("Erro tratado globalmente em api.js:", error);
    }
}

async function deletarCusto(id, descricao) {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        html: `Deseja realmente apagar o custo "<b>${descricao}</b>"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sim, pode apagar!',
        cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
        Swal.fire({ title: 'Apagando...', didOpen: () => Swal.showLoading() });
        try {
            await enviarParaAPI(API_ENDPOINTS.delete_operational_cost, { id });
            Swal.fire('Apagado!', 'O lançamento foi removido.', 'success');
            await fetchCustosPorPeriodo();
        } catch (error) {
            console.error("Erro tratado globalmente em api.js:", error);
        }
    }
}

window.custosFunctions = {
    deletarCusto
};

export function initCustosPage() {
    console.log("Maestro: Módulo de Custos Operacionais iniciado. 🧾");
    
    const filtroMes = document.getElementById('filtro-mes-custos');
    if (filtroMes) {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
        filtroMes.value = `${ano}-${mes}`;
        filtroMes.addEventListener('change', fetchCustosPorPeriodo);
    }
    
    document.getElementById('form-novo-custo')?.addEventListener('submit', handleNovoCusto);
    fetchCustosPorPeriodo();
}