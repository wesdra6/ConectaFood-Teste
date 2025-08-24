// A chave agora será lida da configuração global que o env.js cria.
// Isso prepara o terreno para o deploy em produção.
const API_KEY = window.ENVIRONMENT_CONFIG?.API_KEY;
/**
 * Busca dados de um endpoint da API (GET).
 * @param {string} url - O endpoint completo.
 * @returns {Promise<any>} - A resposta em JSON ou texto.
 */
export async function fetchDeAPI(url) {
    try {
        console.log(`Buscando dados de: ${url}`);
        const response = await fetch(url, {
            headers: {
                'X-N8N-API-KEY': API_KEY 
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            // Para erros de autorização, a mensagem vem no texto
            if (response.status === 403) {
                 throw new Error("Authorization data is wrong!");
            }
            throw new Error(`Erro na rede: ${response.statusText} - ${errorText}`);
        }
        
        const responseText = await response.text();
        
        if (responseText.trim() === '') {
            console.warn("Resposta da API estava vazia, retornando [].");
            return [];
        }

        try {
            return JSON.parse(responseText);
        } catch (e) {
            console.warn("Resposta da API não era um JSON válido, retornando como texto:", responseText);
            return responseText;
        }

    } catch (error) {
        console.error("Falha ao BUSCAR da API:", error);
        throw error;
    }
}

/**
 * Envia dados via POST para a API e espera um array como resposta.
 * @param {string} url - O endpoint da API.
 * @param {object} data - O payload a ser enviado no corpo da requisição.
 * @returns {Promise<Array>} - A lista de resultados.
 */
export async function buscarComPOST(url, data) {
    try {
        console.log("Buscando dados via POST:", { url, data });
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': API_KEY
            },
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

/**
 * Envia dados JSON para a API (POST).
 * @param {string} url - O endpoint da API.
 * @param {object} data - O payload a ser enviado.
 * @returns {Promise<any>}
 */
export async function enviarParaAPI(url, data) {
    try {
        console.log("Enviando dados JSON para API:", { url, data });
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': API_KEY // ✅ CORREÇÃO
            },
            body: JSON.stringify(data)
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
            console.warn(`Resposta da API não era JSON, mas a requisição foi bem-sucedida. Resposta: ${responseText}`);
            return { success: true, message: responseText };
        }
        
    } catch (error) {
        console.error("Falha ao ENVIAR JSON para a API:", error);
        throw error;
    }
}

/**
 * Envia um arquivo para a API (upload).
 * @param {string} url - O endpoint de upload.
 * @param {File} file - O arquivo a ser enviado.
 * @returns {Promise<any>}
 */
export async function enviarArquivoParaAPI(url, file) {
    const formData = new FormData();
    formData.append('file', file);
    try {
        console.log(`Enviando arquivo "${file.name}" para API...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': API_KEY
            },
            body: formData,
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(`Erro na rede ao enviar arquivo: ${response.statusText} - ${responseData.message || ''}`);
        }

        if (responseData.success === false) {
            throw new Error(`Erro retornado pela API no upload: ${responseData.message || 'Erro não especificado'}`);
        }
        
        console.log("Arquivo enviado com sucesso, dados recebidos:", responseData);
        return responseData;

    } catch (error) {
        console.error(`Falha ao ENVIAR ARQUIVO "${file.name}" para a API:`, error);
        throw error;
    }
}