
export async function fetchDeN8N(url) {
    try {
        console.log(`Buscando dados de: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na rede: ${response.statusText} - ${errorText}`);
        }
        
        const responseText = await response.text();
        if (responseText.trim() === '') {
            console.warn("Resposta do fetchDeN8N estava vazia, retornando [].");
            return []; // Retorna um array vazio, que é um JSON válido e seguro.
        }

        try {
            return JSON.parse(responseText);
        } catch (e) {
            console.warn("Resposta do fetchDeN8N não era um JSON válido, retornando como texto:", responseText);
            return responseText;
        }

    } catch (error) {
        console.error("Falha ao BUSCAR do N8N:", error);
        throw error;
    }
}

export async function enviarParaN8N(url, data) {
    try {
        console.log("Enviando dados JSON para N8N:", { url, data });
        
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
                 throw new Error(`Erro retornado pelo N8N: ${responseData.message || 'Erro não especificado'}`);
            }
            return responseData;
        } catch (e) {
            console.warn(`Resposta do N8N não era JSON, mas a requisição foi bem-sucedida. Resposta: ${responseText}`);
            return { success: true, message: responseText };
        }
        
    } catch (error) {
        console.error("Falha ao ENVIAR JSON para o N8N:", error);
        throw error;
    }
}

export async function enviarArquivoParaN8N(url, file) {
    const formData = new FormData();
    formData.append('file', file);
    try {
        console.log(`Enviando arquivo "${file.name}" para N8N...`);
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(`Erro na rede ao enviar arquivo: ${response.statusText} - ${responseData.message || ''}`);
        }

        if (responseData.success === false) {
            throw new Error(`Erro retornado pelo N8N no upload: ${responseData.message || 'Erro não especificado'}`);
        }
        
        console.log("Arquivo enviado com sucesso, dados recebidos:", responseData);
        return responseData;

    } catch (error) {
        console.error(`Falha ao ENVIAR ARQUIVO "${file.name}" para o N8N:`, error);
        throw error;
    }
}