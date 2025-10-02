import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-redefinir-senha');
    let hasRecoveryToken = false;

    // O Supabase adiciona o token de recuperação na URL como um hash
    if (window.location.hash.includes('access_token')) {
        hasRecoveryToken = true;
    }

    if (!hasRecoveryToken) {
        Swal.fire({
            icon: 'error',
            title: 'Link Inválido ou Expirado',
            text: 'Este link de redefinição de senha não é válido. Por favor, solicite um novo link na tela de login.',
            background: '#2c2854',
            color: '#ffffff',
            confirmButtonColor: '#ff6b35'
        }).then(() => {
            window.location.replace('login.html');
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword.length < 6) {
            Swal.fire({ icon: 'warning', title: 'Senha muito curta!', text: 'Sua senha precisa ter no mínimo 6 caracteres.', background: '#2c2854', color: '#ffffff' });
            return;
        }

        if (newPassword !== confirmPassword) {
            Swal.fire({ icon: 'error', title: 'Senhas não conferem!', text: 'Os campos de senha e confirmação devem ser iguais.', background: '#2c2854', color: '#ffffff' });
            return;
        }

        Swal.fire({ 
            title: 'Atualizando sua senha...', 
            allowOutsideClick: false, 
            background: '#2c2854', 
            color: '#ffffff', 
            didOpen: () => Swal.showLoading() 
        });

        // A mágica do Supabase: updateUser atualiza a senha do usuário logado (pelo token)
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            Swal.fire({ icon: 'error', title: 'Ops!', text: `Não foi possível atualizar sua senha: ${error.message}`, background: '#2c2854', color: '#ffffff' });
        } else {
            Swal.fire({
                icon: 'success',
                title: 'Senha redefinida com sucesso!',
                text: 'Você já pode usar sua nova senha para acessar o painel.',
                background: '#2c2854',
                color: '#ffffff',
                confirmButtonColor: '#ff6b35'
            }).then(() => {
                window.location.replace('login.html');
            });
        }
    });
});