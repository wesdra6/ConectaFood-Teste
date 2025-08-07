### **Arquivo Atualizado - Final: `README.md` (v2.6 - Edição Ficha Técnica)**

# 🍔 Sistema de Delivery Full-Stack v2.6

Olá, dev do presente e do futuro! Bem-vindo ao QG do Sistema de Delivery, agora em sua versão **2.6 - A Edição da Arquitetura Blindada**.
Este não é apenas um sistema; é um ecossistema vivo, forjado no fogo dos bugs, polido com refatorações e abençoado por São Deploy 😇.

**LEIA ISTO ANTES DE ESCREVER UMA ÚNICA LINHA DE CÓDIGO. Não é uma sugestão, é a primeira regra do clube.**

---

## 🛠️ Tech Stack & Ferramentas

Esta é a caixa de ferramentas usada para construir e manter o sistema.

*   **Linguagens Base:**
    *   `HTML5` (Semântico)
    *   `CSS3`
    *   `JavaScript (ES6+)` (Vanilla JS, sem frameworks de UI)

*   **Estilização & UI:**
    *   **Tailwind CSS:** Framework utility-first para estilização rápida e responsiva.
    *   **Bootstrap 5:** Utilizado principalmente para componentes complexos como Modais e Offcanvas, aproveitando sua robusta API JavaScript.
    *   **Bootstrap Icons:** Biblioteca de ícones principal do projeto.

*   **Backend & Banco de Dados:**
    *   **N8N:** Plataforma de automação de workflows que atua como nosso backend *low-code*. Toda a lógica de negócio, APIs e comunicação com o banco de dados passam por aqui.
    *   **Supabase:** Backend-as-a-Service sobre **PostgreSQL**. Usado para:
        *   Banco de Dados Relacional.
        *   Autenticação de usuários do painel.
        *   `VIEWS` do PostgreSQL para otimização de consultas.

*   **Bibliotecas JavaScript (via CDN):**
    *   **SweetAlert2:** Para alertas, confirmações e pop-ups bonitos e interativos.
    *   **Swiper.js:** Para carrosséis responsivos e touch-friendly (banners, categorias, produtos).
    *   **SortableJS:** Para funcionalidades de arrastar e soltar (drag-and-drop) na ordenação de categorias e banners.
    *   **Chart.js:** Para a criação dos gráficos no painel financeiro.

*   **Padrão de Cores (Paleta Principal):**
    *   `fundo`: `#1a163a` (Azul escuro profundo)
    *   `sidebar`: `#2c2854` (Azul/Roxo escuro)
    *   `card`: `#38326b` (Roxo meio-tom)
    *   `principal`: `#ff6b35` (Laranja vibrante - cor de destaque)
    *   `texto-base`: `#ffffff` (Branco)
    *   `texto-muted`: `#a3a0c2` (Cinza/Lavanda claro para textos secundários)
    *   `borda`: `#4a4480` (Roxo para bordas e divisórias)

---

## 🗺️ Arquitetura Geral: Como a Casa Funciona

A estrutura do projeto é modular e desacoplada. Entendê-la é crucial:

1.  **A Fachada (Páginas Públicas):** `cliente.html`, `acompanhar.html`, `garcom-login.html`, `garcom-mesas.html`, e `entregador.html`. São páginas independentes, otimizadas para mobile, cada uma com seu próprio script de inicialização orquestrado pelo `main.js`.
2.  **A Torre de Controle (Painel Admin):** O `index.html` é nossa **SPA (Single Page Application)**. O `main.js` atua como um roteador, carregando dinamicamente os módulos (`pedidos.js`, `caixa.js`, etc.) sem recarregar a página.
3.  **A Cozinha Inteligente (Backend):** Nossa lógica de negócio, acesso ao banco e regras complexas residem em workflows do **N8N**. O `js/config.js` é o mapa de todos os endpoints (webhooks).
4.  **A Despensa (Banco de Dados):** Usamos **Supabase** (PostgreSQL). **REGRA:** Consultas complexas **DEVEM** ser feitas através de `VIEWS` no Supabase. Isso mantém a lógica de negócio no backend e o frontend "burro" (apenas para exibição).

---

## 🚨 REGRAS DE OURO E ZONAS DE ALTO RISCO (LEITURA OBRIGATÓRIA) 🚨

As regras a seguir são o resultado de bugs caçados e lições aprendidas. Ignorá-las é invocar o caos.

### **1. A Arquitetura das Taxas: O "Produto Invisível"**

Todas as taxas (entrega, serviço, couvert) são tratadas como produtos para garantir consistência em cálculos, relatórios e comissões.

*   **Como funciona:** Na tabela `produtos`, uma coluna `tipo_item` (`'PRODUTO'`, `'TAXA'`, `'SERVICO'`) diferencia itens vendáveis de taxas operacionais. A `view_produtos_vitrine` (usada pelo cliente) filtra e mostra apenas `'PRODUTO'`.
*   **O "Produto Fantasma":** A "Taxa de Entrega" principal usa um ID fixo (`99999`). Seu preço vem da `loja_config`, não da tabela `produtos`.

**🛑 REGRA DE OURO DAS TAXAS 🛑**

> **NUNCA CRIE UMA TAXA SEM REGISTRÁ-LA COMO UM PRODUTO.** O preço da Taxa de Entrega principal (ID 99999) é controlado **exclusivamente** pela `loja_config`. As demais taxas têm seu preço na tabela `produtos`.

### **2. O Ciclo de Notificação: A Fofoca com Crachá (REFORÇADO)**

Este é o sistema nervoso do painel. Ele permite que ações em uma parte do sistema (um pedido novo do cliente) reflitam em outra (a tela de pedidos do admin) em tempo real, **com som e alerta visual**.

**Como funciona (Passo a Passo):**

1.  **O Gatilho:** Um módulo (ex: `cliente.js` ou `garcom.js`) finaliza uma ação que precisa notificar o painel. Ele **DEVE** setar uma flag no `localStorage`:
    *   `localStorage.setItem('novoPedidoAdmin', 'external');` -> Para ações que precisam de **alerta sonoro e visual** (pedidos de clientes, garçons).
    *   `localStorage.setItem('novoPedidoAdmin', 'internal');` -> Para ações que precisam apenas **atualizar a tela silenciosamente** (pedidos de balcão lançados pelo próprio admin no caixa).

2.  **O Vigia (`main.js`):** Um `setInterval` (`iniciarVigiaDePedidos`) verifica o `localStorage` a cada 5 segundos.
    *   Se encontra a flag, ele a remove e dispara um **evento global**: `window.dispatchEvent(new CustomEvent('novoPedidoRecebido', ...));`.
    *   Se a flag for `'external'`, ele também **toca o som de notificação** e mostra um **toast (popup)**.

3.  **O Ouvinte (`pedidos.js`):** O módulo de pedidos, durante sua inicialização (`initPedidosPage`), "assina" este evento:
    *   `window.addEventListener('novoPedidoRecebido', () => { ... });`
    *   Quando o evento é disparado, a função dentro do `addEventListener` é executada, chamando `buscarPedidosAtivos()` para recarregar a lista de pedidos.

**🛑 GUIA DE SOBREVIVÊNCIA DA NOTIFICAÇÃO 🛑**

> **Se a notificação em tempo real quebrar, siga este checklist:**
>
> 1.  **O Módulo Gatilho está setando a flag?** Verifique se o `localStorage.setItem('novoPedidoAdmin', 'external')` (ou `'internal'`) está sendo chamado no lugar certo (ex: após o sucesso de um `enviarParaN8N`).
> 2.  **A Flag está correta?** O valor **TEM QUE SER** `'external'` para tocar som. `'internal'` é silencioso.
> 3.  **O Vigia (`main.js`) está rodando?** Verifique o console para a mensagem "Maestro: Iniciando com calma...".
> 4.  **O Ouvinte (`pedidos.js`) está escutando?** A função `initPedidosPage` precisa ter o bloco `window.addEventListener('novoPedidoRecebido', ...)` e ele só pode ser registrado uma vez (dentro do `if (!isPedidosInitialized)`).
> 5.  **A Aba de Pedidos está visível?** O ouvinte só recarrega os pedidos se a página de pedidos estiver aberta, para economizar recursos.

### **3. Gerenciamento de Pedidos: A Cirurgia Atômica**

O modal "Gerenciar Pedido" opera com ações instantâneas. Não existe mais botão "Salvar".

*   **Como funciona:** Foram criados workflows no N8N para ações específicas (`pedido/adicionar-item`, `pedido/remover-item`). Cada ação é uma chamada de API única que atualiza o pedido e recalcula o total no backend.
*   **Contexto é Rei:** A função `abrirModalGerenciamento(pedido, contexto)` aceita um parâmetro de contexto (`'CAIXA'` ou `'GARCOM'`). O modal se adapta, mostrando/escondendo botões (como a lixeira de remoção de itens) com base em quem o abriu.

**🛑 REGRA DE OURO DA ATUALIZAÇÃO DE PEDIDOS 🛑**

> **NUNCA REIMPLEMENTE UM FLUXO DE "SALVAR TUDO DE UMA VEZ".** Se precisar de uma nova ação (ex: "mudar quantidade"), crie um novo endpoint atômico no N8N. A fonte da verdade sobre o `total` do pedido é sempre o **backend** (a `VIEW` no Supabase).

### **4. A Condição de Corrida: A Batalha Contra o Tempo**

Um bug clássico onde o código tenta desenhar a tela antes dos dados chegarem da API, resultando em uma tela em branco.

*   **Como foi resolvido:** A função de inicialização de páginas que dependem de dados, como `initPedidosPage`, agora é `async` e usa `await` na chamada que busca os dados iniciais.
    *   **Exemplo:** `export async function initPedidosPage() { ... await buscarPedidosAtivos(); ... }`
*   Isso força o JavaScript a **esperar** a resposta da API antes de continuar a execução e renderizar a página.

**🛑 REGRA DE OURO DA SINCRONIA 🛑**

> **SEMPRE USE `await` AO CHAMAR UMA FUNÇÃO QUE BUSCA DADOS INICIAIS PARA UMA VIEW.** Garanta que a função que renderiza os dados seja chamada somente *após* o `await`.

---

## 💡 Dicas para Futuras Alterações (Checklist Pré-Voo)

-   **Nova Feature?** Pense primeiro: "Como isso se encaixa na arquitetura de 'Tudo é um Produto' e nas Regras de Ouro?"
-   **Novo `addEventListener`?** Garanta que ele seja ligado *depois* que o elemento existir no DOM. Use delegação de eventos em containers pai para elementos criados dinamicamente.
-   **Nova consulta de dados?** Crie ou modifique uma `VIEW` no Supabase. Mantenha o frontend com o mínimo de lógica de negócio possível.

Respeite a arquitetura, dev, e o código respeitará você. Agora, bom trabalho e que a força (e o café) esteja com você! ☕💪

==============================================================================

# 🗺️ Mapa Arquitetural do Ecossistema de PDV - LegalConnect

## 1. Visão Geral e Filosofia Central

Este é um **ecossistema de software modular** projetado para gerenciar operações de Ponto de Venda (PDV) e Delivery. A arquitetura é construída sobre três pilares filosóficos:

1.  **Backend Inteligente, Frontend "Burro":** A lógica de negócio complexa, regras e cálculos residem no backend (N8N). O frontend é responsável por apresentar dados e capturar a intenção do usuário, mas não toma decisões de negócio críticas.
2.  **Modularidade e Desacoplamento:** Cada funcionalidade (pedidos, caixa, produtos) é encapsulada em seu próprio módulo JavaScript. As páginas são independentes ou parte de uma SPA, garantindo que cada contexto carregue apenas o necessário.
3.  **Fonte Única da Verdade:** O banco de dados **Supabase** é a fonte única e definitiva da verdade. O frontend sempre busca dados frescos em vez de confiar em estados locais de longa duração, especialmente para informações críticas como status de pedidos ou estoque.

---

## 2. Divisão de Componentes Principais

O sistema se divide em três camadas distintas:

| Camada | Tecnologia Principal | Papel no Ecossistema | Apelido |
| :--- | :--- | :--- | :--- |
| **Frontend (Apresentação)** | HTML, TailwindCSS, JS (ES6+) | Interface do Usuário, Captura de Eventos | `O Palco` 🎭 |
| **Backend (Lógica)** | N8N Workflows | Orquestração, Regras de Negócio, API | `O Cérebro` 🧠 |
| **Banco de Dados (Persistência)** | Supabase (PostgreSQL) | Armazenamento, Consulta de Dados | `A Memória` 🗄️ |

---

## 3. Frontend - Uma Análise Profunda do "Palco" 🎭

O frontend tem uma arquitetura híbrida inteligente.

### 3.1. Estrutura de Páginas (HTML)

-   **`index.html` (A SPA Principal):**
    -   **Função:** É o "shell" do Painel de Administração. Funciona como uma **Single Page Application**.
    -   **Mecanismo:** A navegação é controlada pelo `main.js` através de parâmetros na URL (ex: `?view=pedidos`). O conteúdo das diferentes "páginas" (Dashboard, Produtos, Pedidos, Caixa, Configurações) é injetado e alternado dinamicamente dentro deste único arquivo, sem recarregamentos de página.

-   **Páginas Autônomas (Standalone):**
    -   **Arquivos:** `cliente.html`, `acompanhar.html`, `garcom-login.html`, `garcom-mesas.html`, `financeiro.html`, `garcons-admin.html`.
    -   **Função:** São páginas completas e independentes, cada uma com um propósito específico.
    -   **Vantagem:** São leves e rápidas de carregar, pois não precisam de toda a estrutura da SPA do painel admin. São otimizadas para seus contextos de uso (ex: mobile para `cliente.html` e `garcom-mesas.html`).

### 3.2. O Orquestrador (`js/main.js`) 👨‍✈️

Este arquivo é o ponto de entrada e o maestro de todo o frontend. Ele opera em dois modos:

1.  **Modo SPA (se `admin-sidebar` existir):**
    -   Gerencia a navegação interna, trocando as views.
    -   Inicializa o `vigia` de notificações (`iniciarVigiaDePedidos`).
    -   Carrega dinamicamente os módulos JS (`admin.js`, `pedidos.js`, etc.) conforme a `view` é solicitada.
    -   Controla a lógica do menu mobile.

2.  **Modo Página Autônoma (se `admin-sidebar` não existir):**
    -   Detecta o nome do arquivo HTML (ex: `cliente`).
    -   Carrega dinamicamente o módulo JS correspondente (`cliente.js`).
    -   Chama a função de inicialização específica daquela página (ex: `initClientePage()`).

### 3.3. Módulos de Função (`js/functions/*.js`)

-   **`api.js`:** O "Carteiro". Centraliza **TODAS** as chamadas para o backend (N8N). Fornece funções `fetchDeN8N` e `enviarParaN8N` que garantem consistência no tratamento de erros e no parsing de JSON. **Nenhum outro arquivo deve fazer `fetch` diretamente.**
-   **`admin.js`:** Controla o Dashboard e a página "Meus Produtos". Busca estatísticas, gerencia o CRUD de produtos (criação, edição) e renderiza os cards/listas.
-   **`pedidos.js`:** O "Centro de Comando de Pedidos".
    -   Busca e renderiza os pedidos ativos.
    -   Contém a lógica para os botões de fluxo de status (ACEITAR, EM PREPARO, etc.).
    -   **Escuta o evento global `novoPedidoRecebido`** para se atualizar em tempo real.
    -   Gerencia a edição de pedidos em andamento através do `modal-gerenciamento-pedido`.
-   **`caixa.js`:** A "Interface do Mundo Físico".
    -   Renderiza o status das mesas (LIVRE/OCUPADA).
    -   Gerencia as comandas de BALCÃO.
    -   Inicia o fluxo de lançamento de pedidos internos (`create_order_internal`).
    -   Inicia o fluxo de fechamento de conta, que pode incluir a **taxa de serviço (10%)**.
-   **`cliente.js` & `carrinho.js`:** A "Experiência do Cliente".
    -   `cliente.js` busca e renderiza toda a vitrine (banners, categorias, produtos).
    -   `carrinho.js` gerencia o estado do carrinho de compras, incluindo a adição/remoção da taxa de entrega fixa como um item de pedido.
-   **`garcom.js`:** Um "Mini-App" para a equipe.
    -   Gerencia o login por PIN na `garcom-login.html`.
    -   Na `garcom-mesas.html`, busca e exibe apenas as mesas atribuídas àquele garçom.
    -   Contém a lógica para lançar pedidos diretamente de uma mesa.
-   **`impressao.js`:** Uma "Ferramenta Utilitária". Exporta uma função `gerarHtmlImpressao` que cria um template de comprovante padronizado, reutilizável pelo Caixa e pelo Garçom.

---

## 4. Backend e Banco de Dados - A Sinergia 🧠+🗄️

### 4.1. N8N (O Cérebro)

-   **Função:** Atua como a **camada de lógica de negócio**. É o único ponto de contato entre o Frontend e o Banco de Dados.
-   **Operação:** Cada endpoint listado em `config.js` corresponde a um workflow no N8N. Um workflow típico:
    1.  Recebe uma requisição do frontend.
    2.  Valida os dados recebidos.
    3.  Executa uma ou mais queries no banco de dados Supabase.
    4.  Pode realizar cálculos ou formatações (ex: calcular total de um pedido após adicionar um item).
    5.  Retorna uma resposta formatada (JSON) para o frontend.

### 4.2. Supabase / PostgreSQL (A Memória)

-   **Função:** Armazenar os dados de forma estruturada e segura. É a **fonte da verdade**.
-   **`VIEWS` (O Pulo do Gato):** O `views.txt` revela uma decisão arquitetural crucial. Em vez de fazer `JOIN`s complexos no N8N ou (pior ainda) no frontend, o sistema utiliza `VIEWS` do PostgreSQL.
    -   **`view_pedidos_ativos`:** Já une `pedidos`, `itens_pedido`, `produtos` e `garcons` para entregar uma visão completa de um pedido ativo em uma única consulta.
    -   **`view_produtos_vitrine`:** Filtra apenas os produtos ativos e do tipo `PRODUTO`, garantindo que o cliente só veja o que pode comprar.
    -   **`view_financeiro_detalhado`:** Agrega todos os dados necessários para os relatórios, simplificando imensamente o trabalho do workflow no N8N.
    -   **Vantagem:** Centraliza a lógica de consulta no banco, melhora a performance e mantém o backend mais limpo.

---

## 5. Padrões de Arquitetura e Fluxos de Dados Críticos

### 5.1. Fluxo de Notificação em Tempo Real (O Sistema Nervoso)

1.  **Gatilho:** Uma ação no frontend (ex: `cliente.js` finaliza um pedido) executa: `localStorage.setItem('novoPedidoAdmin', 'external');`
2.  **Vigilância:** O `main.js`, na SPA do admin, tem um `setInterval` (`vigia`) que verifica o `localStorage` a cada 5 segundos.
3.  **Detecção:** O `vigia` encontra a `key`, a remove imediatamente para evitar repetições, e dispara um evento global: `window.dispatchEvent(new CustomEvent('novoPedidoRecebido', { detail: { tipo: 'external' } }))`.
4.  **Alerta:** Se o `tipo` for `'external'`, o `main.js` também toca um som (`notification-sound`) e exibe um toast do SweetAlert2.
5.  **Reação:** O módulo `pedidos.js`, que está "escutando" (`addEventListener`), captura o evento `novoPedidoRecebido` e chama sua função `buscarPedidosAtivos()` para atualizar a tela com os novos dados.

### 5.2. Padrão "Tudo é um Produto"

-   Para manter a consistência em cálculos e relatórios, itens que não são produtos físicos (como "Taxa de Entrega" ou "Taxa de Serviço 10%") são registrados na tabela `produtos` com um `tipo_item` diferente (`'TAXA'` ou `'SERVICO'`).
-   Isso permite que o carrinho, a comanda e os relatórios financeiros tratem todos os itens de forma polimórfica, simplesmente somando seus valores. A diferenciação só é necessária para relatórios específicos (ex: comissão do garçom, que ignora taxas).

### 5.3. Padrão de Operações Atômicas

-   A edição de um pedido em andamento (`modal-gerenciamento-pedido`) não acumula alterações para um "salvamento final".
-   Cada ação (adicionar item, remover item) dispara uma chamada de API **atômica** e independente para o N8N (ex: `pedido/adicionar-item`).
-   O N8N executa a alteração e **recalcula o total do pedido no banco de dados**.
-   O frontend simplesmente confia no novo total que vem do backend após a ação. Isso garante que a fonte da verdade (`total` na tabela `pedidos`) esteja sempre correta e evita inconsistências de cálculo no lado do cliente.