### 1. Atualização do `README.md` (Versão Turbinada) 📄✨

Este é o `README.md` revisado e atualizado. Ele agora reflete a nova estrutura de SPAs, o Agente IA e consolida as "Regras de Ouro".

```markdown
# 🍔 Sistema de Delivery Full-Stack v3.1 (Phoenix)

Olá, dev do presente e do futuro! Bem-vindo ao QG do Sistema de Delivery. Este projeto é um ecossistema robusto focado em **escalabilidade**, **segurança** e **manutenibilidade**, otimizado para deploy em **Easypanel/VPS**.

**LEIA ISTO ANTES DE ESCREVER UMA ÚNICA LINHA DE CÓDIGO. É a primeira regra do clube.**

---

## 🛠️ Tech Stack & Ferramentas

*   **Linguagens Base:** `HTML5` (Semântico), `CSS3`, `JavaScript (ES6+)` (Vanilla JS puro).
*   **Estilização & UI:** **Tailwind CSS** (Utility-first), **Bootstrap 5** (Componentes complexos), **Bootstrap Icons**.
*   **Backend & Automação:** **N8N** (Backend Low-Code).
*   **Banco de Dados:** **Supabase** (PostgreSQL as a Service).
*   **APIs Externas:** **PlugNotas** (Emissão de NFC-e), **Evolution API** (WhatsApp).
*   **Bibliotecas JS:** **SweetAlert2**, **Swiper.js**, **SortableJS**, **Chart.js**, **QRCode.js**.

---

## 🗺️ Arquitetura Geral: Como a Casa Funciona

O sistema é modular e desacoplado, dividido em um **Painel Principal (SPA)**, um **Hub de Gerenciamento (SPA)** e páginas públicas independentes.

### **Estrutura de Arquivos Essencial**

```
/app
├── index.html            # 🚀 SPA Principal (Dashboard, Produtos, Pedidos, Caixa)
├── gerenciamento.html    # 📈 SPA Secundário (Financeiro, Equipe, Fiscal)
├── cliente.html          # 🛍️ Vitrine Pública para Clientes
├── cardapio-mesa.html    # 🍽️ QR Code da Mesa (Boas-vindas)
├── cardapio-digital.html # 📖 Cardápio Digital (Visualização)
├── garcom-login.html     # 🤵 Acesso da Equipe
├── garcom-mesas.html     # 🗺️ Mapa de Mesas do Garçom
├── agente-ia.html        # 🤖 Página de Suporte com o Agente Virtual
├── bloqueado.html        # 🚫 Página de Suspensão de Acesso
└── js/
    ├── main.js           # 🧠 Maestro do SPA Principal (index.html)
    ├── gerenciamento.js  # 🧠 Maestro do SPA Secundário (gerenciamento.html)
    ├── config.js         # 🔑 Endpoints e Configurações Globais
    └── /functions/
        ├── authVigia.js  # 🛡️ Script de Segurança "Kill Switch"
        ├── components.js # 🧩 Fábrica de Componentes de UI (Cards)
        └── ... (demais módulos como pedidos.js, caixa.js, etc.)
```

### **Fluxo de Navegação (SPA)**

1.  **A Fachada:** Páginas independentes (`cliente.html`, `garcom-login.html`, etc.) possuem sua própria lógica de inicialização.
2.  **As Torres de Controle:** O `index.html` e o `gerenciamento.html` funcionam como **Single Page Applications**. Os scripts `main.js` e `gerenciamento.js` atuam como roteadores, carregando dinamicamente os módulos (`admin.js`, `financeiro.js`) com base no parâmetro `?view=` na URL.

---

## 🔒 Lógicas de Segurança e Acesso (LEITURA OBRIGATÓRIA) 🚨

### **1. Operação "Corta-Acesso" (Kill Switch)**

*   **Gatilho:** A coluna `cliente_ativo` (booleano) na tabela `loja_config` do Supabase.
*   **Mecanismo:** O `authVigia.js` (agora um módulo importado pelo `main.js` e outras páginas críticas) verifica o status de `cliente_ativo` **antes de renderizar qualquer conteúdo**.
*   **Ação:** Se `cliente_ativo` for `false`, o usuário é imediatamente redirecionado para `bloqueado.html`.

### **2. O Convite Dourado (Acesso Demo Temporário)**

*   **Como Funciona:** Um workflow no N8N (`/gerar-link-demo`) usa a API Admin do Supabase para criar um usuário "fantasma", extrair seu `access_token` e montar uma URL (`.../index.html?token_demo=TOKEN_AQUI`). O usuário é agendado para autodestruição.
*   **No Frontend:** O `main.js` detecta o `token_demo`, valida a sessão e libera o acesso, pulando o login.

---

## 📝 Regras de Ouro e Fluxos Críticos

### **1. O Ciclo de Notificação Inter-abas**

O sistema utiliza o `localStorage` para comunicação "quase" em tempo real entre abas (ex: da vitrine para o painel).

1.  **O Gatilho:** Um módulo seta uma flag: `localStorage.setItem('novoPedidoAdmin', 'external')`.
2.  **O Vigia (`main.js`):** Um `setInterval` monitora o `localStorage`, remove a flag e dispara um evento global (`novoPedidoRecebido`).
3.  **Os Ouvintes (`pedidos.js`, `caixa.js`):** Escutam o evento e chamam suas funções de atualização.

### **2. Sincronia de Dados: A Fonte da Verdade**

**🛑 REGRA DE OURO DA CONSISTÊNCIA 🛑**
> Interfaces que exibem dados críticos de um pedido (ex: resumo de mesa no Caixa) devem **SEMPRE** fazer uma nova consulta (`fetch`) ao backend para buscar os dados mais recentes antes de renderizar. **NUNCA confie em dados em memória que podem estar desatualizados.**

Respeite a arquitetura, dev, e o código respeitará você. Agora, bom trabalho e que a força (e o café) esteja com você! ☕💪
