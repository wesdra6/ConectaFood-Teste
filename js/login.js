// REESCREVA O ARQUIVO COMPLETO: js/login.js

import { supabase } from './supabaseClient.js';
import { fetchDeN8N, enviarParaN8N } from './functions/api.js';

// Função para perguntar sobre o status da loja e agir
async function verificarEAbirLoja() {
    try {
        const configs = await fetchDeN8N(window.N8N_CONFIG.get_loja_config);
        const lojaEstaAberta = configs[0]?.loja_aberta || false;

        // Se a loja já estiver aberta, não faz nada.
        if (lojaEstaAberta) {
            return; // Encerra a função silenciosamente
        }

        // Se estiver fechada, pergunta se quer abrir.
        const resultado = await Swal.fire({
            title: 'Sua loja está fechada!',
            text: 'Deseja abrir a loja para receber pedidos agora?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim, abrir a loja!',
            cancelButtonText: 'Não, manter fechada',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#d33',
            background: '#2c2854',
            color: '#ffffff'
        });

        if (resultado.isConfirmed) {
            Swal.fire({ title: 'Abrindo a loja...', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });
            // Adicionamos um novo endpoint para isso!
            await enviarParaN8N(window.N8N_CONFIG.update_loja_status, { loja_aberta: true });
            Swal.close();
        }
    } catch (error) {
        console.error("Erro ao tentar abrir a loja:", error);
        Swal.fire({ icon: 'error', title: 'Ops!', text: 'Não foi possível comunicar o status da loja.', background: '#2c2854', color: '#ffffff' });
    }
}

// Lógica de Login (o que já existia + a chamada da nova função)
document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            Swal.fire({ title: 'Entrando...', text: 'Validando suas credenciais...', allowOutsideClick: false, background: '#2c2854', color: '#ffffff', didOpen: () => Swal.showLoading() });

            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;

                // 🚀 CHAMADA MÁGICA ANTES DE IR PRO PAINEL!
                await verificarEAbirLoja();
                
                window.location.replace('index.html');
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Ops!', text: 'Email ou senha incorretos. Tente novamente.', background: '#2c2854', color: '#ffffff' });
            }
        });
    }

    // Carrega a logo na tela de login
    (async () => {
        try {
            const configs = await fetchDeN8N(window.N8N_CONFIG.get_loja_config);
            if (configs && configs.length > 0) {
                const { logo_vitrine_url, nome_loja } = configs[0];
                const logoContainer = document.getElementById('logo-container');
                if (logoContainer) {
                    logoContainer.innerHTML = logo_vitrine_url 
                        ? `<img src="${logo_vitrine_url}" alt="Logo ${nome_loja}" class="max-w-xs w-full h-auto mx-auto">` 
                        : `<span class="text-4xl font-bold text-principal text-center block">${nome_loja || 'LegalConnect'}</span>`;
                }
            }
        } catch (error) {
            console.error("Não foi possível carregar a logo na tela de login.", error);
        }
    })();
});