# 🍔 ConnectFood - Sistema de Delivery Full-Stack v3.2 (Titan)

Olá, dev do presente e do futuro! Bem-vindo(a) ao QG do ConnectFood. Este projeto é um ecossistema robusto focado em **escalabilidade**, **segurança** e **manutenibilidade**, otimizado para deploy em ambientes como **Easypanel e VPS**.

**⚠️ LEIA ISTO ANTES DE ESCREVER UMA ÚNICA LINHA DE CÓDIGO. É a primeira regra do clube.**

---

## 🛠️ Tech Stack & Ferramentas

    -   **Linguagens Base:** `HTML5` (Semântico), `CSS3`, `JavaScript (ES6+)` (Puro, Modular e Moderno).
    -   **Estilização & UI:**
    -   **Tailwind CSS:** Para uma estilização rápida e consistente (utility-first).
    -   **Bootstrap 5:** Utilizado para componentes complexos e robustos como Modais e Offcanvas.
    -   **Bootstrap Icons:** Para uma iconografia limpa e completa.
    -   **Backend & Automação:** **API** (Nosso poderoso Backend Low-Code).
    -   **Banco de Dados:** **Supabase** (PostgreSQL as a Service).
    -   **APIs Externas:**
    -   **PlugNotas:** Para emissão de NFC-e.
    -   **Evolution API:** Para integração com WhatsApp.
    -   **Bibliotecas JS Auxiliares:**
    -   `SweetAlert2`: Para alertas e modais bonitos e interativos.
    -   `Swiper.js`: Para carrosséis fluidos (banners, categorias, pedidos).
    -   `SortableJS`: Para listas arrastáveis (reordenar categorias, banners).
    -   `Chart.js`: Para a criação de gráficos dinâmicos nos relatórios.
    -   `QRCode.js`: Para a geração de QR Codes (cardápio de mesa)

---


## 🗺️ Arquitetura Geral: Como a Casa Funciona

O sistema é modular e desacoplado, dividido em um **Painel Principal (SPA)**, um **Hub de Gerenciamento (SPA)** e páginas públicas independentes.

### Estrutura de Arquivos Essencial

/app
├── 🚀 index.html # SPA Principal (Dashboard, Produtos, Pedidos, Caixa, Configs)
├── 📈 gerenciamento.html # SPA Secundário (Financeiro, Equipe, Fiscal, Precificação)
│
├── 🛍️ cliente.html # Vitrine Pública para Clientes
├── 🍽️ cardapio-mesa.html # QR Code da Mesa (Boas-vindas)
├── 📖 cardapio-digital.html # Cardápio Digital (Visualização)
├── 🤵 garcom-login.html # Acesso da Equipe
├── 🗺️ garcom-mesas.html # Mapa de Mesas do Garçom
├── 🤖 agente-ia.html # Página de Suporte com o Agente Virtual
├── 🚫 bloqueado.html # Página de Suspensão de Acesso
│
└── js/
├── 🧠 main.js # Maestro do SPA Principal (index.html)
├── 🧠 gerenciamento.js # Maestro do SPA Secundário (gerenciamento.html)
├── 🔑 config.js # Endpoints e Configurações Globais (A Fonte da Verdade)
├── 💰 precificacao.js # Lógica do Módulo de Precificação/Almoxarifado
├── 💸 rentabilidade.js # Lógica do Relatório de Rentabilidade
└── /functions/
├── 🛡️ authVigia.js # Script de Segurança "Kill Switch"
├── 🔗 api.js # Central de Comunicação com o API
├── 🧩 components.js # Fábrica de Componentes de UI (Cards)
└── ... (demais módulos como pedidos.js, caixa.js, etc.)



## ✨ Módulos e Funcionalidades Chave

### 📈 Hub de Gerenciamento (`gerenciamento.html`)

O centro estratégico do negócio, focado em dados e administração.

-   **Relatório Financeiro:** Análise de vendas com filtros por período, origem e forma de pagamento. Inclui gráficos de faturamento e um resumo para fechamento de caixa.
-   **Gerenciar Equipe:** Cadastro de garçons, gestão de PINs de acesso e atribuição de mesas.
-   **Emitir NFC-e:** Integração com a PlugNotas para emissão de Notas Fiscais ao Consumidor.
-   **Precificação (Almoxarifado):** Cadastro de insumos e seus custos. A base para o cálculo de CMV.
-   **Rentabilidade:** Relatório detalhado que cruza dados de vendas com o CMV para exibir o lucro bruto de cada produto, identificando os itens mais e menos lucrativos do cardápio.


### 🚀 Painel Principal (`index.html`)

O centro operacional do dia a dia, com uma interface redesenhada para máxima eficiência.

-   **Dashboard:** Visão em tempo real do status da loja (aberta/fechada), mapa de mesas, feed de pedidos e atalhos rápidos.
-   **Meus Produtos:** Catálogo completo de produtos e serviços. Inclui ferramentas de 
-   **Marketing com IA** para gerar nomes e descrições (ícone ✨), posts para redes sociais (ícone 📣) e o acesso à 
-   **Ficha Técnica** (ícone 🏷️) para cálculo de CMV.
-   **Painel de Pedidos (KDS Híbrido):** A antiga grade de pedidos foi substituída por uma 
-   **Esteira de produção (Kanban)** com seções horizontais e sliders (`Novos Pedidos`, `Em Preparo`, `Prontos`, etc.), otimizada para alto volume e clareza operacional.
-   **Caixa e Configurações:** Módulos operacionais para gestão de mesas, comandas de balcão e configurações gerais da loja.
---

## 🔒 Arquitetura de Segurança (LEITURA OBRIGATÓRIA) 🚨

### 1. Autenticação Padronizada via Header Auth

-   **Padrão:** Todos os workflows sensíveis no API são protegidos por 
-   **Header Auth**, esperando uma `X-API-API-KEY`.
-   **Implementação:** A chave secreta é armazenada **APENAS** no arquivo `api.js`.


### 2. O Proxy de IA Seguro
-   **Problema:** A IA precisa ser chamada de locais públicos (`agente-ia.html`) sem expor a chave de API.
-   **Solução:** Foi criado um workflow intermediário no API (`/ia/proxy/suporte`) que não exige autenticação. O front-end chama esse proxy "burro", que por sua vez faz a chamada interna e segura para o workflow principal da IA.

### 3. Operação "Corta-Acesso" (Kill Switch)
-   **Gatilho:** A coluna `cliente_ativo` (booleano) na tabela `loja_config`.
-   **Mecanismo:** O `authVigia.js` verifica este status em todas as páginas críticas **antes de renderizar qualquer conteúdo**.
-   **Ação:** Se `cliente_ativo` for `false`, o acesso é bloqueado e o usuário é redirecionado para `bloqueado.html`.

---

## 📝 Regras de Ouro e Fluxos Críticos

### 1. Sincronia de Dados: A Fonte da Verdade

**🛑 REGRA DE OURO DA CONSISTÊNCIA 🛑**
> Interfaces que exibem dados críticos (ex: resumo de uma mesa) devem **SEMPRE** fazer uma nova consulta (`fetch`) ao backend para buscar os dados mais recentes antes de renderizar. **NUNCA confie em dados em memória que podem estar desatualizados.**

### 2. Modularização e ES6

-   **Padrão:** O código está migrando para o uso de Módulos ES6 (`import`/`export`). Arquivos que são módulos devem importar suas dependências (como o `config.js`) em vez de depender de variáveis globais (`window`).
-   **Compatibilidade:** O `config.js` mantém a atribuição à `window` para garantir que scripts mais antigos ou não-modulares (como `authVigia.js`) continuem funcionando durante a transição.

---

## 🚀 Arquitetura de Rede Otimizada (Comunicação Interna)

Para máxima performance e segurança, o sistema utiliza a rede interna do Docker (gerenciada pelo Easypanel) para a comunicação entre os serviços de backend.

### O Conceito do "Túnel VIP"

-   **Comunicação Externa (Cliente -> Backend):** O front-end (rodando no navegador do usuário) **SEMPRE** se comunica com o API através da **URL pública** (ex: `https://n8n.meudominio.com`). É a porta de entrada oficial do sistema.

-   **Comunicação Interna (Backend -> Serviços):** Uma vez que a requisição está dentro da nossa VPS, a comunicação entre os serviços (API -> Supabase, API -> Zipline, ou até mesmo um workflow do API chamando outro) é feita através da **URL interna** do serviço no Docker.

    -   **Exemplo (API -> Supabase):** A credencial do Supabase no API não aponta para o domínio público, mas sim para o nome do serviço interno, como `http://supabase_kong:8000`.
    -   **Exemplo (API -> Zipline):** Os workflows de upload de imagem não chamam a URL pública do Zipline, mas sim a interna, como `http://ferramentas_zipline:3000`.

### Vantagens dessa Abordagem

1.  ⚡ **Performance Absurda:** A latência da rede para operações de backend é praticamente nula, resultando em um sistema muito mais rápido.
2.  🔒 **Segurança Reforçada:** O tráfego de dados sensíveis (como a comunicação com o banco de dados) nunca é exposto à internet, permanecendo confinado à rede segura da VPS.
3.  📉 **Eficiência:** Reduz o tráfego de dados de saída e a carga sobre os gateways e proxies públicos.

Essa arquitetura garante que, embora as imagens no Supabase tenham URLs públicas para serem exibidas ao cliente, todo o processo interno de upload, consulta e manipulação de dados ocorra na via expressa, preservando a velocidade e a segurança do núcleo do sistema.

## 📝 Regras de Ouro e Fluxos Críticos

### **1. O Ciclo de Notificação Inter-abas**

O sistema utiliza o `localStorage` para comunicação "quase" em tempo real entre abas (ex: da vitrine para o painel).

1.  **O Gatilho:** Um módulo seta uma flag: `localStorage.setItem('novoPedidoAdmin', 'external')`.
2.  **O Vigia (`main.js`):** Um `setInterval` monitora o `localStorage`, remove a flag e dispara um evento global (`novoPedidoRecebido`).
3.  **Os Ouvintes (`pedidos.js`, `caixa.js`):** Escutam o evento e chamam suas funções de atualização.

### **2. Sincronia de Dados: A Fonte da Verdade**

**🛑 REGRA DE OURO DA CONSISTÊNCIA 🛑**
> Interfaces que exibem dados críticos de um pedido (ex: resumo de mesa no Caixa) devem **SEMPRE** fazer uma nova consulta (`fetch`) ao backend para buscar os dados mais recentes antes de renderizar. **NUNCA confie em dados em memória que podem estar desatualizados.**

## 3. O Despertar dos Componentes Dinâmicos (Regra do Modal)

**🛑 REGRA DE OURO DA INICIALIZAÇÃO TARDIA (Lazy Initialization) 🛑**
> A instância de componentes dinâmicos (como modais do Bootstrap) deve ser criada **sob demanda (just-in-time)**, dentro da função que os ativa. Isso garante que o JavaScript sempre encontre o HTML correspondente, que foi injetado dinamicamente na nossa SPA.


-   **O Problema:** Tentar mostrar um modal (`modal.show()`) usando uma instância criada no início (`new bootstrap.Modal(...)`) resultará em falha, pois a instância foi criada com uma referência a um elemento HTML que não existia naquele momento.
-   **A Solução:** A instância de componentes dinâmicos (como modais) deve ser criada **sob demanda (just-in-time)**, dentro da função que os ativa. Em vez de armazenar a instância do modal em uma variável global, a função que o abre deve primeiro buscar o elemento no DOM e então criar uma `new bootstrap.Modal(elemento)` antes de chamar o `.show()`. Isso garante que o JavaScript sempre encontre o HTML correspondente no momento exato em que ele é necessário.

Respeite a arquitetura, dev, e o código respeitará você. Agora, bom trabalho e que a força (e o café) esteja com você! ☕💪