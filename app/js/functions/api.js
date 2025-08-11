
export async function fetchDeApi(url) {
    try {
        console.log(`Buscando dados de: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na rede: ${response.statusText} - ${errorText}`);
        }
        
        const responseText = await response.text();
        
        if (!responseText || responseText.trim() === '') {
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

export async function enviarParaApi(url, data) {
    try {
        console.log("Enviando dados JSON para API:", { url, data });
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            const responseData = JSON.parse(responseText);
            if (responseData.success === false) {
                 throw new Error(`Erro retornado pela API: ${responseData.message || 'Erro não especificado'}`);
            }
            return responseData;
        } catch (e) {
            console.warn(`Resposta da API não era JSON, mas a requisição foi bem-sucedida. Resposta: ${responseText}`);
            return { success: true, message: responseText };
        }
        
    } catch (error) {
        console.error("Falha ao ENVIAR JSON para a API:", error);
        throw error;
    }
}

export async function enviarArquivoParaApi(url, file) {
    const formData = new FormData();
    formData.append('file', file);
    try {
        console.log(`Enviando arquivo "${file.name}" para a API...`);
        const response = await fetch(url, {
            method: 'POST',
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