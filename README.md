**Arquivo:** `README.md`

### **Arquivo Atualizado: `README.md`**

# 🍔 ConnectFood - Sistema de Delivery Full-Stack v3.2 (Titan)

Olá, dev do presente e do futuro! Bem-vindo(a) ao QG do ConnectFood. Este projeto é um ecossistema robusto focado em **escalabilidade**, **segurança** e **manutenibilidade**, otimizado para deploy em ambientes como **Easypanel e VPS**.

**⚠️ LEIA ISTO ANTES DE ESCREVER UMA ÚNICA LINHA DE CÓDIGO. É a primeira regra do clube.**

---

## 🛠️ Tech Stack & Ferramentas

- **Linguagens Base:** `HTML5` (Semântico), `CSS3`, `JavaScript (ES6+)` (Puro, Modular e Moderno).
- **Estilização & UI:**
  - **Tailwind CSS:** A base para estilização rápida e consistente (utility-first).
  - **Bootstrap 5:** Usado estrategicamente para componentes complexos e robustos como Modais (`.modal`) e Offcanvas (`.offcanvas`), onde sua estrutura JS brilha.
  - **Bootstrap Icons:** Para uma iconografia limpa, completa e consistente em todo o sistema.
- **Backend & Automação:** **API Interna** (Nosso poderoso Backend Low-Code que orquestra as regras de negócio).
- **Banco de Dados:** **Supabase** (PostgreSQL as a Service), com uso intensivo de **Views** e **Functions (PL/pgSQL)** para otimizar queries e centralizar lógicas complexas.
- **APIs Externas:**
  - **PlugNotas:** Para emissão de NFC-e.
  - **Evolution API:** Para integração com WhatsApp (notificações de status, etc.).
- **Bibliotecas JS Auxiliares:**
  - `SweetAlert2`: Para alertas, confirmações e modais de feedback ricos e interativos.
  - `Swiper.js`: Para carrosséis fluidos e responsivos (banners, categorias, pedidos no KDS).
  - `SortableJS`: Para criar listas arrastáveis (reordenar categorias, banners).
  - `Chart.js`: Para a criação de gráficos dinâmicos nos relatórios financeiros.
  - `QRCode.js`: Para a geração de QR Codes (cardápio de mesa).

---

## 🗺️ Arquitetura Geral: A Filosofia por Trás da Casa

O sistema é modular e desacoplado, dividido em um **Painel Principal (SPA)**, um **Hub de Gerenciamento (SPA)** e páginas públicas independentes. A filosofia é simples: **cada arquivo é um especialista**.

- **Modelo SPA (Single-Page Application):** A navegação dentro do `index.html` e do `gerenciamento.html` é feita dinamicamente com JavaScript, carregando o HTML e o JS de cada módulo sem recarregar a página. Isso proporciona uma experiência de usuário fluida e rápida.
- **Configuração Central (`config.js`):** Nada de "magic strings". Todas as URLs, chaves públicas e configurações da aplicação vivem aqui. É a fonte da verdade, facilitando a manutenção e a troca entre ambientes de `dev` e `prod`.
- **Camada de API Abstrata (`api.js`):** Ninguém fala com o backend diretamente. O `api.js` é nosso diplomata: ele anexa tokens, trata erros de forma global com `SweetAlert2`, e garante que toda a comunicação siga o mesmo padrão de segurança e feedback.
- **Inteligência no Banco de Dados:** Lógicas de negócio pesadas, como calcular o CMV, dar baixa em estoque ou gerar relatórios complexos, são feitas através de `Views` e `Functions` no PostgreSQL. O front-end pede, o banco de dados processa e entrega o resultado pronto. Isso é performance na veia.

### Estrutura de Arquivos Essencial

/app
├── 🚀 index.html # SPA Principal (Dashboard, Produtos, Pedidos, Caixa, Configs)
├── 📈 gerenciamento.html # SPA Secundário (Financeiro, Equipe, Fiscal, Almoxarifado)
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
├── 🔑 config.js # Endpoints e Configs Globais (A Fonte da Verdade)
└── /functions/
├── 🛡️ authVigia.js # Script de Segurança "Guardião da Loja" (Kill Switch)
├── 🔗 api.js # Central de Comunicação com a API
├── 🧩 components.js # Fábrica de Componentes de UI (Cards)
└── ... (demais módulos como pedidos.js, caixa.js, estoque.js, etc.)

## ✨ Módulos e Funcionalidades Chave

### 📈 Hub de Gerenciamento (`gerenciamento.html`)

O centro estratégico do negócio, focado em dados e administração.

- **Relatório Financeiro:** Análise completa de vendas com filtros, KPIs, gráficos de faturamento e um resumo para fechamento de caixa.
- **Gerenciar Equipe:** Cadastro de "Garçons" (para o app de comandas, com PIN) e "Funcionários" (para o painel, com e-mail/senha). Inclui atribuição de mesas.
- **Emitir NFC-e:** Integração com a PlugNotas para emissão de Notas Fiscais ao Consumidor a partir dos pedidos finalizados.
- **Precificação (Almoxarifado):** Cadastro de insumos e seus custos. É a base para o cálculo automático de CMV.
- **Controle de Estoque:** Gestão de entradas, saídas manuais e estorno de movimentações. O histórico é a auditoria do seu estoque.
- **Custos Operacionais:** Registro de despesas fixas e variáveis (aluguel, salários, luz, etc.) para uma visão financeira completa.
- **Rentabilidade:** O "Boss Final" dos relatórios. Gera um DRE simplificado que cruza dados de vendas, CMV (calculado automaticamente) e custos operacionais para exibir a lucratividade real do negócio e o desempenho de cada produto.

### 🚀 Painel Principal (`index.html`)

O centro operacional do dia a dia, com uma interface redesenhada para máxima eficiência.

- **Dashboard:** Visão em tempo real do status da loja (aberta/fechada), mapa de mesas interativo, feed de pedidos e atalhos rápidos para os principais módulos.
- **Meus Produtos:** Catálogo completo de produtos e serviços. Inclui:
  - **✨ Marketing com IA:** Gera nomes e descrições vendedoras.
  - **📣 Social Post IA:** Cria legendas para redes sociais com um clique.
  - **🏷️ Ficha Técnica:** Onde você vincula insumos a um produto, permitindo que o sistema calcule o **CMV (Custo da Mercadoria Vendida)** e sugira um preço de venda com base no seu markup.
- **Painel de Pedidos (KDS Híbrido):** Uma **esteira de produção (Kanban)** com seções horizontais (`Novos Pedidos`, `Em Preparo`, `Prontos`, etc.) e sliders internos, otimizada para alto volume e clareza operacional em telas de qualquer tamanho.
- **Caixa:** Um PDV simplificado para gestão de mesas, lançamento de comandas de balcão e fechamento de contas com cálculo de troco.
- **Configurações:** Onde a mágica começa. Personalização da loja, identidade visual, regras de entrega, cadastro de mesas, categorias e banners.

---

## 🔒 Arquitetura de Segurança (LEITURA OBRIGATÓRIA) 🚨

### 1. Autenticação Padronizada via Header Auth

- **Padrão:** Todos os workflows sensíveis na API são protegidos por **Header Auth**, esperando uma `X-N8N-API-KEY`.
- **Implementação:** A chave secreta é armazenada **APENAS** no `env.js` (que nunca vai para o Git) e consumida pelo `api.js` para ser adicionada a cada requisição.

### 2. O Proxy de IA Seguro

- **Problema:** A IA precisa ser chamada de locais públicos (`agente-ia.html`) sem expor a chave de API no código do cliente.
- **Solução:** Foi criado um workflow intermediário na API (`/ia/proxy/suporte`) que não exige autenticação. O front-end chama esse proxy, que por sua vez faz a chamada interna e segura para o workflow principal da IA, adicionando a chave secreta no lado do servidor. Simples e genial.

### 3. O Guardião da Loja (Kill Switch) - `authVigia.js`

- **Gatilho:** A coluna `cliente_ativo` (booleano) na tabela `loja_config`.
- **Mecanismo:** O `authVigia.js` é carregado em **todas as páginas independentes** (`cliente.html`, `garcom-login.html`, etc.) e verifica este status **antes de qualquer outra coisa**.
- **Lógica de Exceção:** O Vigia é inteligente e ignora apenas as páginas estritamente necessárias, como a tela de login principal (`login.html`) e a própria tela de bloqueio (`bloqueado.html`), para evitar loops de redirecionamento.
- **Ação:** Se `cliente_ativo` for `false`, o script faz o logout forçado (se houver sessão) e redireciona o usuário para `bloqueado.html`. O acesso ao sistema é cortado na raiz.

### 4. O Guardião de Rota (Bloqueio de Acesso Direto)

- **Problema:** As "views" parciais da arquitetura SPA (ex: `caixa.html`, `custos.html`) não devem ser acessíveis diretamente pela URL, pois dependem do "corpo" do `index.html` ou `gerenciamento.html` para funcionar.
- **Solução:** Implementamos uma dupla camada de proteção:
  1.  **Flag Global:** As páginas-mestre (`index.html`, `gerenciamento.html`) declaram uma variável global `window.IS_SPA_FRAMEWORK_LOADED = true;` assim que carregam.
  2.  **Verificação Inline:** No topo de cada arquivo de view parcial, um pequeno script verifica se essa variável global existe. Se não existir, significa que o arquivo foi acessado diretamente.
- **Ação:** Em caso de acesso direto, o script redireciona o usuário para a SPA correta (`index.html` ou `gerenciamento.html`), forçando-o a passar pelo fluxo de autenticação padrão.

---

## 📝 Regras de Ouro e Fluxos Críticos

Para manter a sanidade e a integridade do código, siga estas regras como se sua vida de dev dependesse delas.

### 1. Notificação de Novos Pedidos via "Vigia Atômico"

O sistema utiliza um `setInterval` no `main.js` para consultar um endpoint específico da API (`/rpc/obter_e_marcar_pedidos_novos`) em busca de novos pedidos.

1.  **O Gatilho:** O `setInterval` (Vigia Atômico) roda a cada `5` segundos.
2.  **A Chamada:** Ele invoca uma função no Supabase que **busca pedidos com `notificado_painel = false` E os marca como `true` em uma única transação atômica**. Isso garante que um pedido nunca seja notificado duas vezes.
3.  **A Ação:** Se a chamada retornar um ou mais pedidos, o `main.js` dispara um evento global (`novoPedidoRecebido`).
4.  **Os Ouvintes:** Módulos como `pedidos.js` escutam este evento e disparam suas funções de atualização (tocar som, mostrar alerta, recarregar a lista).

### 2. Sincronia de Dados: A Fonte da Verdade

**🛑 REGRA DE OURO DA CONSISTÊNCIA 🛑**

> Interfaces que exibem dados críticos de um pedido (ex: resumo de mesa no Caixa, modal de gerenciamento) devem **SEMPRE** fazer uma nova consulta (`fetch`) ao backend para buscar os dados mais recentes antes de renderizar. **NUNCA confie em dados em memória ou em variáveis globais que podem estar desatualizados.**

```javascript
// ❌ ERRADO: Confiar em um objeto que pode estar velho
function mostrarResumoDaMesa(pedidoDaLista) {
  renderizarModal(pedidoDaLista); // Risco de dados desatualizados!
}

// ✅ CERTO: Buscar os dados frescos sempre que a ação for crítica
async function mostrarResumoDaMesa(pedidoId) {
  Swal.showLoading();
  const pedidoAtualizado = await fetchDeAPI(
    `${API_ENDPOINTS.get_order_status}?id=${pedidoId}`
  );
  Swal.close();
  renderizarModal(pedidoAtualizado);
}
```

### 3. O Despertar dos Componentes Dinâmicos (Regra do Modal)

**🛑 REGRA DE OURO DA INICIALIZAÇÃO TARDIA (Lazy Initialization) 🛑**

> A instância de componentes dinâmicos (como modais do Bootstrap) deve ser criada e armazenada em uma variável na primeira vez que for usada, e então reutilizada. Isso garante que o JS não tente criar a instância antes do HTML do modal existir na página (já que ele é carregado dinamicamente pela SPA).

```javascript
let modalGerenciamento = null; // Começa como nulo

export async function abrirModalGerenciamento(pedidoId) {
  // ... busca os dados do pedido ...

  if (!modalGerenciamento) {
    // Só cria na primeira vez que for usar
    const modalEl = document.getElementById("modal-gerenciamento-pedido");
    modalGerenciamento = new bootstrap.Modal(modalEl);
  }

  // Agora pode usar com segurança
  modalGerenciamento.show();
}
```

### 4. Delegação de Eventos para Listas Dinâmicas

**🛑 REGRA DE OURO DOS "BOTÕES IMORTAIS" 🛑**

> Para elementos criados dinamicamente (cards de pedido, itens de comanda), **NUNCA** adicione `onclick` no HTML ou `addEventListener` a cada botão individualmente. Em vez disso, adicione um único `addEventListener` ao **container pai** que sempre existe. Este "ouvinte" interceptará os cliques e agirá com base em `data-attributes` nos elementos filhos (ex: `data-action="aceitar"`). Isso garante que os botões sempre funcionem, não importa quantas vezes a lista seja recarregada.

```javascript
// Pega o container que SEMPRE está na página
const containerPedidos = document.getElementById("pedidos-ativos-container");

// Adiciona UM ÚNICO ouvinte
containerPedidos.addEventListener("click", (event) => {
  // Procura o botão mais próximo que foi clicado e que tem o 'data-action'
  const target = event.target.closest("button[data-action]");

  if (!target) return; // Se não clicou num botão de ação, ignora

  const pedidoId = parseInt(target.dataset.pedidoId);
  const acao = target.dataset.action;

  if (acao === "aceitar") {
    aceitarPedido(pedidoId);
  } else if (acao === "gerenciar") {
    abrirModalGerenciamento(pedidoId);
  }
});
```

---

## 🚀 Arquitetura de Rede Otimizada (Comunicação Interna)

Para máxima performance e segurança, o sistema utiliza a rede interna do Docker (gerenciada pelo Easypanel) para a comunicação entre os serviços de backend.

- **Comunicação Externa (Cliente -> Backend):** O front-end **SEMPRE** se comunica com a API através da **URL pública** (ex: `https://n8n.meudominio.com`).
- **Comunicação Interna (Backend -> Serviços):** Uma vez que a requisição está dentro da nossa VPS, a comunicação entre os serviços (API -> Supabase, API -> Zipline) é feita através da **URL interna** do serviço no Docker (ex: `http://supabase_kong:8000`).

Esta arquitetura garante que, embora as imagens no Supabase tenham URLs públicas para serem exibidas ao cliente, todo o processo interno de upload, consulta e manipulação de dados ocorra na via expressa, preservando a velocidade e a segurança do núcleo do sistema.

Respeite a arquitetura, dev, e o código respeitará você. Agora, bom trabalho e que a força (e o café) esteja com você! ☕💪
