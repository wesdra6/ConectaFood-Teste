// REESCREVA O ARQUIVO COMPLETO: app/js/rentabilidade.js

import { fetchDeAPI } from './functions/api.js';
import { API_ENDPOINTS } from './config.js';

const formatarMoeda = (valor) => (valor != null ? Number(valor) : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function renderizarTabelaRentabilidade(produtos) {
    const containerMobile = document.getElementById('container-rentabilidade-mobile');
    const containerDesktop = document.getElementById('tabela-rentabilidade-desktop');
    const placeholder = document.getElementById('container-loading-placeholder');

    if (!containerMobile || !containerDesktop || !placeholder) return;

    // Esconde o placeholder de "carregando"
    placeholder.style.display = 'none';
    containerMobile.innerHTML = '';
    containerDesktop.innerHTML = '';

    if (!produtos || produtos.length === 0) {
        const msg = `<div class="text-center p-6 text-texto-muted">Nenhum dado de venda encontrado.</div>`;
        containerMobile.innerHTML = msg;
        containerDesktop.innerHTML = `<tr><td colspan="6" class="text-center p-10">${msg}</td></tr>`;
        return;
    }

    produtos.forEach(produto => {
        const lucroUnitario = produto.preco_venda - produto.cmv;
        const corLucro = lucroUnitario >= 0 ? 'text-green-400' : 'text-red-500';

        // Card para Mobile
        const cardMobileHtml = `
            <div class="bg-fundo p-4 rounded-lg space-y-3 mb-4">
                <div class="flex justify-between items-start">
                    <h3 class="font-bold text-lg">${produto.produto_nome}</h3>
                    <span class="text-xs bg-sidebar px-2 py-1 rounded-full">${produto.total_vendido} vendidos</span>
                </div>
                <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border-t border-borda/50 pt-3">
                    <div>
                        <p class="text-texto-muted">Preço Venda</p>
                        <p class="font-semibold">${formatarMoeda(produto.preco_venda)}</p>
                    </div>
                    <div>
                        <p class="text-texto-muted">CMV Unitário</p>
                        <p class="font-semibold">${formatarMoeda(produto.cmv)}</p>
                    </div>
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

        // Linha para Desktop
        const linhaDesktopHtml = `
            <tr class="hover:bg-sidebar/50 text-sm lg:text-base">
                <td class="p-3 font-semibold">${produto.produto_nome}</td>
                <td class="p-3 text-center">${produto.total_vendido}</td>
                <td class="p-3 text-right hidden lg:table-cell">${formatarMoeda(produto.preco_venda)}</td>
                <td class="p-3 text-right text-texto-muted hidden lg:table-cell">${formatarMoeda(produto.cmv)}</td>
                <td class="p-3 text-right">${formatarMoeda(produto.faturamento_bruto_total)}</td>
                <td class="p-3 text-right font-bold ${corLucro}">${formatarMoeda(produto.lucro_bruto_total)}</td>
            </tr>`;
        containerDesktop.innerHTML += linhaDesktopHtml;
    });
}

async function fetchDadosRentabilidade() {
    try {
        const dados = await fetchDeAPI(API_ENDPOINTS.get_rentabilidade_produtos);
        renderizarTabelaRentabilidade(dados);
    } catch (error) {
        console.error("Erro ao buscar dados de rentabilidade:", error);
        const placeholder = document.getElementById('container-loading-placeholder');
        if (placeholder) {
            placeholder.className = 'text-center p-10 text-red-400';
            placeholder.innerHTML = 'Falha ao carregar o relatório.';
        }
    }
}

export function initRentabilidadePage() {
    console.log("Maestro: Módulo de Rentabilidade iniciado. 👑");
    fetchDadosRentabilidade();
}