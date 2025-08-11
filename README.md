# 🍔 Sistema de Delivery Full-Stack v3.0

Olá, dev do presente e do futuro! Bem-vindo ao QG do Sistema de Delivery. Este projeto evoluiu de uma simples aplicação para um ecossistema robusto, focado em **escalabilidade**, **segurança** e **manutenibilidade** via **Easypanel/VPS**.

**LEIA ISTO ANTES DE ESCREVER UMA ÚNICA LINHA DE CÓDIGO. É a primeira regra do clube.**

---

## 🛠️ Tech Stack & Ferramentas

Esta é a caixa de ferramentas usada para construir e manter o sistema.

*   **Linguagens Base:** `HTML5` (Semântico), `CSS3`, `JavaScript (ES6+)` (Vanilla JS puro).
*   **Estilização & UI:** **Tailwind CSS** (Utility-first), **Bootstrap 5** (Modais/Offcanvas), **Bootstrap Icons**.
*   **Backend & Banco de Dados:** **N8N** (Backend Low-Code), **Supabase** (PostgreSQL).
*   **APIs Externas Integradas:** **PlugNotas** (Emissão de NFC-e), **Evolution API** (WhatsApp).
*   **Bibliotecas JavaScript:** **SweetAlert2**, **Swiper.js**, **SortableJS**, **Chart.js**.

---

## 🗺️ Arquitetura Geral: Como a Casa Funciona

A estrutura do projeto é modular e desacoplada.

### **Estrutura de Arquivos**

A estrutura do repositório foi refatorada para facilitar o deploy no Easypanel e o desenvolvimento local:

/conectafood-repo
├── docker-compose.yml # Orquestração do Easypanel
├── /nginx
│ └── default.conf # Configuração do Proxy Reverso Nginx
├── /app # Todo o código-fonte do frontend (HTML, JS, CSS, Assets)
│ ├── index.html # SPA Principal (Admin)
│ ├── gerenciamento.html # SPA Secundário (Gerencial)
│ ├── cliente.html # Vitrine Pública
│ ├── bloqueado.html # Página de Suspensão de Acesso
│ └── js/
│ ├── config.js # Endpoints e Configurações Globais
│ └── /functions/
│ ├── authVigia.js # Script de Segurança de Acesso
│ ├── components.js # Fábrica de Componentes de UI
│ └── ...
├── .gitignore
└── README.md


### **Fluxo de Navegação (SPA)**

1.  **A Fachada (`/app/*.html`):** Páginas independentes para clientes, garçons e login.
2.  **As Torres de Controle (`/app/index.html` e `/app/gerenciamento.html`):** Nossos **SPAs (Single Page Applications)**. O `main.js` e o `gerenciamento.js` atuam como roteadores dinâmicos, carregando e inicializando os módulos (`admin.js`, `pedidos.js`, `financeiro.js`) com base no parâmetro `?view=` na URL.

---

## 🔒 Lógicas de Segurança e Acesso (LEITURA OBRIGATÓRIA) 🚨

### **1. Operação "Corta-Acesso" (Kill Switch)**

Para garantir a segurança e a gestão comercial, o sistema possui um mecanismo de suspensão de acesso.

*   **Gatilho:** A coluna `cliente_ativo` (booleano) na tabela `loja_config` do Supabase.
*   **Mecanismo:** O script `js/functions/authVigia.js` é carregado em todas as páginas públicas. Ele verifica o status de `cliente_ativo` antes de renderizar qualquer conteúdo.
*   **Ação:** Se `cliente_ativo` for `false`, o usuário é imediatamente redirecionado para a página `bloqueado.html`, impedindo qualquer acesso à vitrine ou ao painel.

### **2. O Convite Dourado (Acesso Demo Temporário)**

Para demonstrações a clientes, o sistema permite a geração de um link de acesso temporário que não cria usuários permanentes.

*   **Como Funciona:** Um workflow no N8N (`/gerar-link-demo`) utiliza a API Admin do Supabase para:
    1.  Criar um usuário "fantasma" com email e senha aleatórios.
    2.  Extrair o `access_token` deste novo usuário.
    3.  Montar uma URL de acesso `.../index.html?token_demo=TOKEN_AQUI`.
    4.  Agendar a **autodestruição** do usuário fantasma após 2 horas.
*   **No Frontend:** O script `main.js` detecta o parâmetro `token_demo` na URL, valida a sessão com o Supabase e libera o acesso ao painel, pulando a tela de login.

---

## 📝 Regras de Ouro e Fluxos Críticos

### **1. A Arquitetura das Taxas: O "Produto Invisível"**

Todas as taxas (entrega, serviço) são tratadas como produtos na tabela `produtos`.

**🛑 REGRA DE OURO DAS TAXAS 🛑**
> A **"Taxa de Entrega"** principal (ID `99999`) é um item fixo e **não pode ser removida** da comanda pelo operador do caixa. Já a **"Taxa de Entrega Adicional"** é tratada como um produto comum e pode ser adicionada/removida livremente.

### **2. O Ciclo de Notificação: A Fofoca com Crachá**

O sistema utiliza o `localStorage` para comunicação "quase" em tempo real entre a vitrine do cliente e o painel admin (SPA).

1.  **O Gatilho:** Um módulo seta uma flag no `localStorage`: `localStorage.setItem('novoPedidoAdmin', 'external')` (alerta sonoro/visual) ou `'internal'` (atualização silenciosa).
2.  **O Vigia (`main.js`):** Um `setInterval` monitora o `localStorage`, remove a flag e dispara um evento global (`novoPedidoRecebido`).
3.  **Os Ouvintes (`pedidos.js`, `caixa.js`):** Escutam o evento e chamam as funções de atualização (`buscarPedidosAtivos()`, `fetchDadosDoCaixa()`).

### **3. Sincronia de Dados: A Fonte da Verdade**

Para evitar inconsistências, como totais de pedidos desatualizados:

**🛑 REGRA DE OURO DA CONSISTÊNCIA 🛑**
> Interfaces que exibem dados críticos de um pedido (como o pop-up de resumo de mesa no Caixa) devem **SEMPRE** fazer uma nova consulta (`fetch`) ao backend para buscar os dados mais recentes antes de renderizar, em vez de confiar em dados previamente carregados na memória.

Respeite a arquitetura, dev, e o código respeitará você. Agora, bom trabalho e que a força (e o café) esteja com você! ☕💪