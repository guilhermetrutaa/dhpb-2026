# DHPB 2026 — Architecture & Data Flow

Este documento detalha o desenho arquitetural do DHPB, a separação de responsabilidades entre frontend e serviços de backend, os fluxos de dados do usuário e as decisões técnicas tomadas.

---

## 1. Visão Geral da Arquitetura

```mermaid
graph TB
    subgraph Client [Frontend Next.js 16 - Client SPA]
        UI[UI Pages / Poppins + Tailwind v4]
        AuthCtx[AuthContext / LocalCache TTL 60s]
        SupWidget[SupportWidget / useSupportChat]
        StaticSchools[escolas-pb.json / 0 Firestore Reads]
    end

    subgraph MainBackend [Firebase Principal (Olimpíada)]
        FAuth[Firebase Auth - Alunos & Professores]
        FStoreMain[(Firestore Principal)]
        FStoreMain --> Users[users / participacoes / questionarios]
        FStoreMain --> Edicoes[edicoes / fases / questoes]
        FStoreMain --> Equipes[equipes / respostas / pontuacoes]
        FStoreMain --> MembroIdx[membro-index / Trava de Unicidade]
    end

    subgraph SupportBackend [Firebase Suporte (Isolado)]
        FStoreSup[(Firestore Suporte)]
        FStoreSup --> Chamados[chamados / mensagens]
        FStoreSup --> QuickResp[respostas_rapidas]
    end

    subgraph ExternalServices [Serviços e APIs Externas]
        Cloudinary[Cloudinary CDN / Transformations]
        Groq[Groq AI / Llama 3.1 8b / 3.3 70b]
        Telegram[Telegram Bot API / Atendentes]
        OneSignal[OneSignal Web Push]
    end

    subgraph ServerRoutes [Next.js Route Handlers]
        ApiAuth[POST /api/support/auth]
        ApiAi[POST /api/support/ai]
        ApiNotify[POST /api/support/notify-telegram]
        ApiWebhook[POST /api/support/webhook-telegram]
        ApiCron[GET /api/support/cron-auto-close]
    end

    UI --> FAuth
    UI --> FStoreMain
    UI --> StaticSchools
    UI --> Cloudinary
    UI --> OneSignal
    SupWidget --> ServerRoutes
    ServerRoutes --> FStoreSup
    ServerRoutes --> Groq
    ServerRoutes --> Telegram
```

---

## 2. Componentes e Responsabilidades

### 2.1. Frontend (Next.js 16 App Router)
* **Padrão de Renderização:** Quase 100% dos componentes e páginas utilizam `'use client'`, funcionando como uma SPA de alto desempenho.
* **Gerenciamento de Sessão:** `AuthContext.jsx` monitora o `onAuthStateChanged`, busca os dados do usuário em `users/{uid}` e salva em cache local no `localStorage` por 60 segundos (`TTL_CACHE = 60000`) para minimizar leituras desnecessárias de perfil.
* **Suporte Flutuante:** `SupportWidget.jsx` é injetado no `src/app/layout.jsx` e fica disponível em todas as páginas, exceto nas rotas `/admin/*`.
* **Editor Rich Text:** O admin de questões utiliza `@tiptap/react` com extensões completas para formatação acadêmica (tabelas, cores, links, listas de tarefas, fórmulas e documentos).

### 2.2. Backend e Rotas de API (`src/app/api/support/*`)
O backend do Next.js é utilizado exclusivamente para operações seguras do sistema de suporte:
* **`/api/support/auth`:** Recebe o Firebase ID Token do usuário, valida a assinatura usando a biblioteca `jose` contra os JWKS públicos do Google (`securetoken.google.com`) e emite um Custom Token para o Firebase do Suporte (com claim `admin` se o e-mail estiver em `SUPPORT_ADMIN_EMAILS`).
* **`/api/support/ai`:** Recebe o histórico recente da conversa e chama a API do Groq (Llama 3.1/3.3) com prompt de sistema injetado e formato de resposta em JSON estrito.
* **`/api/support/notify-telegram`:** Notifica o grupo/canal de atendentes humanos no Telegram quando um chamado precisa de intervenção humana (com botão inline "Assumir atendimento").
* **`/api/support/webhook-telegram`:** Recebe as respostas dos atendentes enviadas pelo Telegram e grava como mensagem no Firestore do Suporte.
* **`/api/support/cron-auto-close`:** Fecha automaticamente chamados inativos há mais de 48 horas.

---

## 3. Fluxos de Dados Principais

### 3.1. Jornada do Estudante
1. **Cadastro/Login:** Cria conta como `estudante`.
2. **Home (`/home`):** Carrega edições ativas. Ao clicar em uma edição:
   * Verifica se já respondeu o questionário individual (`users/{uid}/questionarios/{edicaoId}`). Se não, abre o modal obrigatório.
   * Verifica participação em equipe (`users/{uid}/participacoes/{edicaoId}`). Se estiver em equipe, vai para `/montagem-equipe` ou `/sala-de-equipe`. Se não, vai para `/criar-equipe`.
3. **Criação de Equipe (`/criar-equipe`):**
   * Busca escola no dataset estático `escolas-pb.json`.
   * Executa gravação atômica via `writeBatch`: grava a equipe, grava a participação e cria a trava no `membro-index/{base64email_edicaoId}`.
4. **Sala de Prova (`/sala-de-equipe` $ightarrow$ `/resumo-fase` $ightarrow$ `/questao`):**
   * Acesso à fase liberado apenas se status for `aberta` ou `correcao` e equipe aprovada até aquela fase.
   * Na tela de questão (`/questao`), faz `getDoc()` estático da questão (sem broadcast em massa) e escuta apenas a subcoleção de respostas da equipe (`equipes/{id}/respostas/{questaoId}`).
   * Ao entregar questão, executa `runTransaction` no Firestore: bloqueia edição concorrente, salva resposta e atualiza pontuação (`pontuacoes/{faseId}`) e nota final (`df`).

### 3.2. Jornada do Professor
1. **Cadastro:** Cria conta como `professor`.
2. **Envio de Comprovante (`/enviar-documento`):** Faz upload do documento de vínculo (contracheque, termo de posse ou carteira de trabalho; máx 500KB) para o Cloudinary e grava status `pendente` em `users/{uid}`.
3. **Bloqueio:** Fica bloqueado em `/home-professor` até que o administrador aprove o documento.
4. **Orientação Multi-Equipe:** Uma vez aprovado, pode criar e orientar múltiplas equipes simultaneamente na mesma edição.

---

## 4. Decisões Arquiteturais Chave

1. **Uso de `firestore-rest.js` em vez de SDK Admin pesado no Edge:**
   * Evita incompatibilidades de CommonJS / ESM no Turbopack do Next.js 16.
   * Utiliza apenas `fetch` nativo e `crypto.subtle` (Web Crypto API) para autenticação com Service Account.
2. **Desacoplamento de Fases e Questões:**
   * Questões movidas para `fases/{faseId}/questoes/{questaoId}`, mantendo a Fase apenas com `questoesIndex: [{id, numero}]`.
   * Reduz o payload transferido durante a realização de provas em mais de 98%.
3. **Desacoplamento de Equipes e Respostas:**
   * Respostas salvas em `equipes/{equipeId}/respostas/{questaoId}`, eliminando o problema do documento "quente" de equipe que disparava updates contínuos para todos os membros.
4. **Cache Estático de Escolas (`escolas-pb.json`):**
   * Eliminou a necessidade de fazer full scan da coleção de escolas no Firestore, economizando até 8 milhões de leituras gratuitas por edição.
