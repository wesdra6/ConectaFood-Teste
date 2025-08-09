 **Bíblia Sagrada do Projeto!** 📜✨

### **Arquivo Atualizado - Final: `README.md` (v2.7 - A Edição Fiscal)**

# 🍔 Sistema de Delivery Full-Stack v2.7

Olá, dev do presente e do futuro! Bem-vindo ao QG do Sistema de Delivery, agora em sua versão **2.7 - A Edição Fiscal**.
Este não é apenas um sistema; é um ecossistema vivo, forjado no fogo dos bugs, polido com refatorações e abençoado por São Deploy 😇.

**LEIA ISTO ANTES DE ESCREVER UMA ÚNICA LINHA DE CÓDIGO. Não é uma sugestão, é a primeira regra do clube.**


## 🛠️ Tech Stack & Ferramentas

Esta é a caixa de ferramentas usada para construir e manter o sistema.

*   **Linguagens Base:**
    *   `HTML5` (Semântico)
    *   `CSS3`
    *   `JavaScript (ES6+)` (Vanilla JS, sem frameworks de UI)

*   **Estilização & UI:**
    *   **Tailwind CSS:** Framework utility-first para estilização rápida e responsiva.
    *   **Bootstrap 5:** Utilizado principalmente para componentes complexos como Modais e Offcanvas.
    *   **Bootstrap Icons:** Biblioteca de ícones principal do projeto.

*   **Backend & Banco de Dados:**
    *   **N8N:** Plataforma de automação que atua como nosso backend *low-code*.
    *   **Supabase:** Backend-as-a-Service sobre **PostgreSQL**.

*   **APIs Externas Integradas:**
    *   **PlugNotas:** Para emissão de documentos fiscais (NFC-e).

*   **Bibliotecas JavaScript (via CDN):**
    *   **SweetAlert2:** Para alertas e pop-ups interativos.
    *   **Swiper.js:** Para carrosséis responsivos.
    *   **SortableJS:** Para funcionalidades de arrastar e soltar.
    *   **Chart.js:** Para os gráficos no painel financeiro.

*   **Padrão de Cores (Paleta Principal):**
    *   `fundo`: `#1a163a`
    *   `sidebar`: `#2c2854`
    *   `card`: `#38326b`
    *   `principal`: `#ff6b35`
    *   `texto-base`: `#ffffff`
    *   `texto-muted`: `#a3a0c2`
    *   `borda`: `#4a4480`

---

## 🗺️ Arquitetura Geral: Como a Casa Funciona

A estrutura do projeto é modular e desacoplada. Entendê-la é crucial:

1.  **A Fachada (Páginas Públicas):** `cliente.html`, `acompanhar.html`, `garcom-login.html`, etc. São páginas independentes, cada uma com seu script de inicialização orquestrado pelo `main.js`.
2.  **A Torre de Controle (Painel Admin):** O `index.html` é nossa **SPA (Single Page Application)**. O `main.js` atua como um roteador, carregando dinamicamente os módulos.
3.  **A Cozinha Inteligente (Backend):** Nossa lógica de negócio reside em workflows do **N8N**. O `js/config.js` é o mapa de todos os endpoints.
4.  **A Despensa (Banco de Dados):** Usamos **Supabase** (PostgreSQL). **REGRA:** Consultas complexas **DEVEM** ser feitas através de `VIEWS` no Supabase para manter o backend limpo e performático.

---

## 🚨 REGRAS DE OURO E ZONAS DE ALTO RISCO (LEITURA OBRIGATÓRIA) 🚨

### **1. A Arquitetura das Taxas: O "Produto Invisível"**

Todas as taxas (entrega, serviço) são tratadas como produtos na tabela `produtos` com um `tipo_item` diferente para garantir consistência em cálculos e relatórios.

**🛑 REGRA DE OURO DAS TAXAS 🛑**

> O preço da Taxa de Entrega principal (ID 99999) é controlado **exclusivamente** pela `loja_config`. As demais taxas têm seu preço na tabela `produtos`.

### **2. O Ciclo de Notificação: A Fofoca com Crachá**

Este é o sistema nervoso do painel, permitindo atualizações em tempo real com som.

1.  **O Gatilho:** Um módulo seta uma flag no `localStorage`:
    *   `localStorage.setItem('novoPedidoAdmin', 'external');` -> Para ações que precisam de **alerta sonoro e visual** (pedidos de clientes).
    *   `localStorage.setItem('novoPedidoAdmin', 'internal');` -> Para ações que precisam apenas **atualizar a tela silenciosamente** (pedidos de balcão, mesa).
2.  **O Vigia (`main.js`):** Um `setInterval` verifica o `localStorage`, remove a flag e dispara um evento global `novoPedidoRecebido`.
3.  **O Ouvinte (`pedidos.js`):** Escuta o evento e chama `buscarPedidosAtivos()` para recarregar a lista.

### **3. Gerenciamento de Pedidos: A Cirurgia Atômica**

O modal "Gerenciar Pedido" opera com ações instantâneas. Cada adição ou remoção de item é uma chamada de API única para o N8N (`pedido/adicionar-item`, `pedido/remover-item`), que recalcula o total no backend.

**🛑 REGRA DE OURO DA ATUALIZAÇÃO DE PEDIDOS 🛑**

> **NUNCA REIMPLEMENTE UM FLUXO DE "SALVAR TUDO DE UMA VEZ".** A fonte da verdade sobre o `total` do pedido é sempre o **backend**.

---

## 📠 Integração Fiscal (NFC-e) com PlugNotas - O Guia de Sobrevivência

A integração com a API da PlugNotas é um processo assíncrono e multi-etapas. Entender este fluxo é vital.

### **Visão Geral do Fluxo**

1.  **Configuração (Uma vez):** A empresa e o webhook de retorno são cadastrados na PlugNotas.
2.  **Emissão:** O sistema envia os dados do pedido. A API responde com "em processamento".
3.  **Retorno (Webhook):** A PlugNotas, após autorização da SEFAZ, chama nosso webhook de retorno com o status final.
4.  **Download:** O sistema busca os documentos (PDF/XML) de forma autenticada.

### **Workflows N8N Essenciais**

1.  **`fiscal/emitir-nfce` (O Emissor):**
    *   **Gatilho:** `POST` do nosso frontend (`hub-integracao.js`).
    *   **Ação:** Monta o JSON e envia para a API da PlugNotas.
    *   **Se Sucesso ("em processamento"):** Atualiza o pedido no Supabase para `status_fiscal = 'Processando'` e salva o `id_nota_fiscal` retornado.
    *   **Se Falha:** Atualiza para `status_fiscal = 'Erro'` e salva a mensagem.

2.  **`fiscal/retorno-status` (O Receptor):**
    *   **Gatilho:** `POST` vindo da PlugNotas.
    *   **Ação:** Usa o `id` da nota recebido no `body` para encontrar o pedido no Supabase.
    *   **Atualiza o Pedido:** Muda `status_fiscal` para "Emitida" ou "Erro" e salva as URLs do `pdf_url` e `xml_url`.

3.  **`fiscal/download` (O "Proxy" de Download):**
    *   **Gatilho:** `POST` do nosso frontend com a URL do documento.
    *   **Ação:** Faz uma requisição `GET` para a URL recebida, **adicionando o header de autenticação `x-api-key`**.
    *   **Resposta:** Devolve o arquivo binário bruto (`File`) para o frontend.

### **Configuração Inicial (Passo a Passo)**

Para que a integração funcione, os seguintes passos devem ser executados uma única vez no ambiente Sandbox:

1.  **Cadastrar a Empresa:**
    *   **Endpoint:** `POST https://api.sandbox.plugnotas.com.br/empresa`
    *   **Ação:** Enviar um JSON completo com os dados da empresa (CNPJ, endereço, certificado, etc.). Isso registra o emitente na plataforma.
2.  **Cadastrar o Webhook de Retorno:**
    *   **Endpoint:** `POST https://api.sandbox.plugnotas.com.br/empresa/{cnpj}/webhook`
    *   **Ação:** Enviar um JSON com a URL do nosso workflow "Receptor" (`.../fiscal/retorno-status`). Isso diz à PlugNotas para onde enviar as atualizações.

### **Estrutura do Banco (Tabela `pedidos`)**

As seguintes colunas foram adicionadas para suportar o fluxo fiscal:

*   `status_fiscal` (text, default: 'Pendente'): Armazena o status da nota (Pendente, Processando, Emitida, Erro).
*   `id_nota_fiscal` (text): Armazena o ID único da nota retornado pela PlugNotas na emissão. É a chave de ligação.
*   `protocolo_fiscal` (text): Armazena o protocolo do lote de envio.
*   `erro_fiscal` (text): Armazena mensagens de erro da API.
*   `pdf_url` (text): URL para download do PDF da nota.
*   `xml_url` (text): URL para download do XML da nota.

**🛑 REGRA DE OURO FISCAL 🛑**

> **NUNCA ABRA AS URLs DE PDF/XML DIRETAMENTE NO NAVEGADOR.** Elas são protegidas e exigem autenticação. O download deve **SEMPRE** passar pelo workflow `fiscal/download` no N8N, que atua como um proxy para adicionar o header `x-api-key` na requisição.

---

## 💡 Dicas para Futuras Alterações (Checklist Pré-Voo)

-   **Nova Feature?** Pense primeiro: "Como isso se encaixa na arquitetura de 'Tudo é um Produto' e nas Regras de Ouro?"
-   **Novo `addEventListener`?** Garanta que ele seja ligado *depois* que o elemento existir no DOM.
-   **Nova consulta de dados?** Crie ou modifique uma `VIEW` no Supabase.

---

### **5. Execuções Zumbis no N8N: O Limbo do Timeout**

Workflows no N8N podem ficar presos no estado "Running" indefinidamente se um de seus nós (especialmente `Supabase` ou `HTTP Request`) não receber uma resposta.

*   **Causa Comum:** Reiniciar o servidor do banco de dados (Supabase) enquanto o N8N está tentando fazer uma consulta. O N8N fica "esperando" por uma resposta que nunca chegará.
*   **Impacto:** Consome recursos do servidor N8N e polui a lista de execuções.

**🛑 GUIA DE SOBREVIVÊNCIA DE ZUMBIS (SOLUÇÃO DEFINITIVA) 🛑**
> Para evitar que os workflows fiquem presos indefinidamente, podemos configurar um timeout global para cada um deles.
>
> 1.  Dentro de um workflow, clique no ícone de engrenagem **Settings** no canto superior direito.
> 2.  Na janela de **Workflow settings**, localize a opção **Timeout Workflow**.
> 3.  **Ative o switch**.
> 4.  Defina um tempo limite razoável no campo **Timeout After**. Um valor de **60 segundos** é um bom ponto de partida.
> 5.  Salve as configurações.
>
> Com isso, se a execução completa de um workflow ultrapassar o tempo definido, o N8N irá automaticamente interrompê-la e marcá-la como falha, prevenindo o surgimento de "execuções zumbis". Caso ainda encontre alguma execução antiga travada, ela pode ser cancelada manualmente na tela de **Executions**.

Respeite a arquitetura, dev, e o código respeitará você. Agora, bom trabalho e que a força (e o café) esteja com você! ☕💪