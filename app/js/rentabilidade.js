import { fetchDeAPI, buscarComPOST } from './functions/api.js';
import { API_ENDPOINTS } from './config.js';

// ➕ Novas variáveis de estado para a paginação
let produtosDeRentabilidade = []; // Guarda todos os produtos do período
let paginaAtualRentabilidade = 1;
const ITENS_POR_PAGINA = 10;

const formatarMoeda = (valor) => (valor != null ? Number(valor) : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function renderizarDRE(dados) {
    const container = document.getElementById('dre-container');
    if (!container || !dados) return;

    const { receita_bruta, cmv_total, custos_operacionais_total } = dados;
    const lucro_bruto = receita_bruta - cmv_total;
    const lucro_liquido = lucro_bruto - custos_operacionais_total;

    document.getElementById('dre-receita-bruta').textContent = formatarMoeda(receita_bruta);
    document.getElementById('dre-cmv').textContent = formatarMoeda(cmv_total);
    document.getElementById('dre-lucro-bruto').textContent = formatarMoeda(lucro_bruto);
    document.getElementById('dre-custos-operacionais').textContent = formatarMoeda(custos_operacionais_total);
    document.getElementById('dre-lucro-liquido').textContent = formatarMoeda(lucro_liquido);

    container.classList.remove('hidden');
}

function renderizarRankingProdutos(produtos) {
    const container = document.getElementById('ranking-produtos-container');
    const corpoTabela = document.getElementById('tabela-ranking-corpo');
    if (!container || !corpoTabela) return;

    container.classList.remove('hidden');
    corpoTabela.innerHTML = '';

    if (!produtos || produtos.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="4" class="text-center p-8 text-texto-muted">Nenhum produto vendido no período.</td></tr>`;
        return;
    }

    const produtosOrdenados = [...produtos].sort((a, b) => b.total_vendido - a.total_vendido);

    produtosOrdenados.forEach((produto, index) => {
        const medalhas = ['🥇', '🥈', '🥉'];
        const posicaoHtml = index < 3 
            ? `<span class="text-2xl">${medalhas[index]}</span>` 
            : `<span class="font-bold text-lg text-texto-muted">${index + 1}º</span>`;

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-sidebar/50';
        
        tr.innerHTML = `
            <td class="p-3 text-center">${posicaoHtml}</td>
            <td class="p-3 font-semibold">${produto.produto_nome}</td>
            <td class="p-3 text-center font-mono text-lg">${produto.total_vendido}</td>
            <td class="p-3 text-right font-bold text-principal">${formatarMoeda(produto.faturamento_bruto_total)}</td>
        `;
        corpoTabela.appendChild(tr);
    });
}

// ➕ NOVA FUNÇÃO PARA RENDERIZAR A PAGINAÇÃO
function renderizarPaginacaoRentabilidade() {
    const pagContainer = document.getElementById('paginacao-rentabilidade-container');
    if (!pagContainer) return;

    pagContainer.innerHTML = '';
    const totalPaginas = Math.ceil(produtosDeRentabilidade.length / ITENS_POR_PAGINA);

    if (totalPaginas <= 1) return;

    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.className = `px-4 py-2 rounded-md font-bold ${i === paginaAtualRentabilidade ? 'bg-principal text-white' : 'bg-card hover:bg-sidebar'}`;
        btn.innerText = i;
        btn.onclick = () => {
            paginaAtualRentabilidade = i;
            renderizarTabelaRentabilidade(); // Re-renderiza a tabela com a nova página
        };
        pagContainer.appendChild(btn);
    }
}


function renderizarTabelaRentabilidade() { // ➖ Removemos o parâmetro 'produtos'
    const containerAnalise = document.getElementById('analise-produtos-container');
    const containerMobile = document.getElementById('container-rentabilidade-mobile');
    const containerDesktop = document.getElementById('tabela-rentabilidade-desktop');

    if (!containerAnalise || !containerMobile || !containerDesktop) return;

    containerAnalise.classList.remove('hidden');
    containerMobile.innerHTML = '';
    containerDesktop.innerHTML = '';

    if (!produtosDeRentabilidade || produtosDeRentabilidade.length === 0) {
        const msg = `<div class="text-center p-6 text-texto-muted">Nenhum dado de venda de produtos encontrado no período.</div>`;
        containerMobile.innerHTML = msg;
        containerDesktop.innerHTML = `<tr><td colspan="4" class="text-center p-10">${msg}</td></tr>`;
        return;
    }

    // ➕ Lógica de paginação
    const inicio = (paginaAtualRentabilidade - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    const produtosPaginados = produtosDeRentabilidade.slice(inicio, fim);

    produtosPaginados.forEach(produto => {
        const corLucro = produto.lucro_bruto_total >= 0 ? 'text-green-400' : 'text-red-500';

        const cardMobileHtml = `
            <div class="bg-fundo p-4 rounded-lg space-y-3 mb-4">
                <div class="flex justify-between items-start">
                    <h3 class="font-bold text-lg">${produto.produto_nome}</h3>
                    <span class="text-xs bg-sidebar px-2 py-1 rounded-full">${produto.total_vendido} vendidos</span>
                </div>
                <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border-t border-borda/50 pt-3">
                    <div>
                        <p class="text-texto-muted">Faturamento</p>
                        <p class="font-semibold text-principal">${formatarMoeda(produto.faturamento_bruto_total)}</p>
                    </div>
                    <div>
                        <p class="text-texto-muted">Lucro Total</p>
                        <p class="font-bold ${corLucro}">${formatarMoeda(produto.lucro_bruto_total)}</p>
                    </div>
                </div>
            </div>`;
        containerMobile.innerHTML += cardMobileHtml;

        const linhaDesktopHtml = `
            <tr class="hover:bg-sidebar/50 text-sm lg:text-base">
                <td class="p-3 font-semibold">${produto.produto_nome}</td>
                <td class="p-3 text-center">${produto.total_vendido}</td>
                <td class="p-3 text-right">${formatarMoeda(produto.faturamento_bruto_total)}</td>
                <td class="p-3 text-right font-bold ${corLucro}">${formatarMoeda(produto.lucro_bruto_total)}</td>
            </tr>`;
        containerDesktop.innerHTML += linhaDesktopHtml;
    });

    // ➕ Chamamos a renderização da paginação
    renderizarPaginacaoRentabilidade();
}

async function gerarRelatorio() {
    const dataInicio = document.getElementById('rentabilidade-data-inicio').value;
    const dataFim = document.getElementById('rentabilidade-data-fim').value;
    const placeholder = document.getElementById('rentabilidade-placeholder');

    if (!dataInicio || !dataFim) {
        Swal.fire('Datas faltando!', 'Por favor, selecione as datas de início e fim.', 'warning');
        return;
    }

    // ➕ Resetamos a página atual a cada nova busca
    paginaAtualRentabilidade = 1;

    placeholder.textContent = 'Gerando relatório, isso pode levar um momento...';
    placeholder.classList.add('animate-pulse');
    document.getElementById('dre-container').classList.add('hidden');
    document.getElementById('ranking-produtos-container').classList.add('hidden');
    document.getElementById('analise-produtos-container').classList.add('hidden');

    try {
        const payload = { data_inicio: dataInicio, data_fim: dataFim };
        
        const [dadosDRE, dadosProdutosERanking] = await Promise.all([
            buscarComPOST(API_ENDPOINTS.get_dre_report, payload),
            buscarComPOST(API_ENDPOINTS.get_rentabilidade_produtos, payload),
        ]);

        placeholder.style.display = 'none';

        if (dadosDRE && dadosDRE.length > 0) {
            renderizarDRE(dadosDRE[0]);
        }
        
        const produtosParaRanking = dadosProdutosERanking.filter(p => p.produto_id !== 99999);

        // ➕ Armazenamos os dados completos na nossa variável de estado
        produtosDeRentabilidade = dadosProdutosERanking;

        renderizarRankingProdutos(produtosParaRanking);
        renderizarTabelaRentabilidade(); // ➖ Não precisa mais passar o parâmetro

    } catch (error) {
        console.error("Erro ao gerar relatório de rentabilidade:", error);
        placeholder.textContent = 'Falha ao carregar o relatório.';
        placeholder.classList.remove('animate-pulse');
    }
}

export function initRentabilidadePage() {
    console.log("Maestro: Módulo de Rentabilidade (v3 - Final Boss) iniciado. 👑");
    document.getElementById('btn-gerar-relatorio').addEventListener('click', gerarRelatorio);
}