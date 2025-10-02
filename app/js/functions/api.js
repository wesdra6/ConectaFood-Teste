import { supabase } from '../supabaseClient.js';

const API_KEY = window.ENVIRONMENT_CONFIG?.API_KEY;

// ✅ FUNÇÃO ATUALIZADA PARA LIDAR COM TODOS OS ERROS
function handleApiError(error) {
    const userRole = sessionStorage.getItem('userRole');

    // Tenta extrair a mensagem específica do N8N da resposta do erro
    let apiMessage = '';
    try {
        const errorBodyString = error.message.substring(error.message.indexOf('{'));
        const errorBody = JSON.parse(errorBodyString);
        apiMessage = errorBody.message;
    } catch (e) {
        apiMessage = error.message;
    }

    // Se for um visitante tentando uma ação proibida, mostramos o Swal de marketing
    if (error.message.includes('403') && userRole === 'visitante') {
        Swal.fire({
            iconHtml: '🔐',
            title: 'Ação Bloqueada para Visitantes!',
            html: `
                <p class="text-texto-muted text-center mb-4">
                    Gostou do que viu? 😍<br>
                    Esta é uma demonstração. Para desbloquear esta e todas as outras funcionalidades, assine um de nossos planos!
                </p>
                <a href="https://wa.me/5562992758134?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20os%20planos." target="_blank" class="inline-block bg-green-500 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-green-600 transition-colors">
                    <i class="bi bi-whatsapp"></i> Fale Conosco e Assine!
                </a>
            `,
            background: '#2c2854',
            color: '#ffffff',
            confirmButtonText: 'Fechar',
            confirmButtonColor: '#ff6b35',
            customClass: { icon: 'border-0' }
        });
        return; 
    }
    
    // Para todos os outros erros, mostramos um Swal de erro padrão e estiloso
    Swal.fire({ 
        icon: 'error', 
        title: 'Ops! Algo deu errado.', 
        text: `Não foi possível completar a ação. Detalhe: ${apiMessage}`, 
        background: '#2c2854', 
        color: '#ffffff' 
    });
}

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': API_KEY
    };

    if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    return headers;
}

export async function fetchDeAPI(url) {
    try {
        console.log(`Buscando dados de: ${url}`);
        const headers = await getAuthHeaders();
        delete headers['Content-Type']; 

        const response = await fetch(url, { headers });

        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 403) {
                 throw new Error("Acesso Negado: Você não tem permissão para ver isso.");
            }
            throw new Error(`Erro na rede: ${response.statusText} - ${errorText}`);
        }
        
        const responseText = await response.text();
        
        if (responseText.trim() === '') {
            return [];
        }

        try {
            return JSON.parse(responseText);
        } catch (e) {
            return responseText;
        }

    } catch (error) {
        console.error("Falha ao BUSCAR da API:", error);
        throw error;
    }
}

export async function buscarComPOST(url, data) {
    try {
        console.log("Buscando dados via POST:", { url, data });
        const headers = await getAuthHeaders();
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na rede: ${response.statusText} - ${errorText}`);
        }
        
        const responseText = await response.text();
        
        if (responseText.trim() === '') {
            return [];
        }
        
        return JSON.parse(responseText);

    } catch (error) {
        console.error("Falha ao BUSCAR COM POST da API:", error);
        throw error;
    }
}

export async function enviarParaAPI(url, data) {
    try {
        const headers = await getAuthHeaders();
        const userRole = sessionStorage.getItem('userRole');
        const payload = {
            ...data,
            _userContext: { role: userRole || 'anonimo' }
        };
        
        console.log("Enviando dados JSON para API com contexto:", { url, payload });
        
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();

        if (!response.ok) {
            throw new Error(`Erro na rede: ${response.status} ${response.statusText} - Resposta: ${responseText}`);
        }

        if (!responseText) {
            return { success: true, message: "Operação concluída com sucesso (sem retorno)." };
        }

        try {
            return JSON.parse(responseText);
        } catch (e) {
            return { success: true, message: responseText };
        }
        
    } catch (error) {
        console.error("Falha ao ENVIAR JSON para a API:", error);
        handleApiError(error);
        throw error;
    }
}

export async function enviarArquivoParaAPI(url, file) {
    const formData = new FormData();
    formData.append('file', file);
    try {
        console.log(`Enviando arquivo "${file.name}" para API...`);
        const { data: { session } } = await supabase.auth.getSession();
        
        const headers = { 'X-N8N-API-KEY': API_KEY };
        if (session) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: formData,
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(`Erro na rede ao enviar arquivo: ${response.statusText} - ${responseData.message || ''}`);
        }

        if (responseData.success === false) {
            throw new Error(`Erro retornado pela API no upload: ${responseData.message || 'Erro não especificado'}`);
        }
        
        return responseData;

    } catch (error) {
        console.error(`Falha ao ENVIAR ARQUIVO "${file.name}" para a API:`, error);
        handleApiError(error);
        throw error;
    }
}