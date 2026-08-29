# DHPB 2026 — Project Context (Agent Quickstart)

> **Contexto de inicialização rápida para Coding Agents (Cursor, Claude Code, Codex, Gemini).**
> Leia este arquivo antes de planejar ou executar alterações. Ele contém a topologia essencial do sistema, matriz de consulta de arquivos e regras inegociáveis de segurança e custos.

---

## 1. O que é o Projeto

O **DHPB (Desafio em História da Paraíba)** é uma plataforma web para uma olimpíada acadêmica estadual realizada pelo **IFPB**.
* **Público:** ~8.000 a 10.000 estudantes e professores da Paraíba.
* **Escopo:** Inscrição, formação de equipes (3 alunos + 1 professor de História), realização de 4 fases de provas online (questões objetivas com mídias e tarefas interativas), ranking com ações afirmativas (cotas), emissão de certificados e chat de suporte em tempo real com IA e atendentes humanos.
* **Restrição Crítica:** Operação no **Firebase Spark Free Tier** (50k reads/20k writes diários) e **Cloudinary Free Tier** (25 créditos mensais).

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Detalhes Cruciais para o Agente |
|---|---|---|
| **Framework** | Next.js 16.2.6 (App Router) + React 19.2.4 | Turbopack. Todas as páginas usam `'use client'`. Páginas com `useSearchParams` **exigem** `<Suspense>`. |
| **Estilização** | Tailwind CSS v4 + Poppins | Cores: Vinho/Bordô `#82181A` (hover `#631214`), Fundo `#ffffff`. |
| **Banco Principal** | Firebase Web SDK v12 | Firestore (Olimpíada: users, equipes, fases, questoes, ranking). Long polling ativo (`experimentalForceLongPolling: true`). |
| **Banco de Suporte** | Firebase Instance Separada | Firestore isolado apenas para o chat (`chamados`, `mensagens`). NUNCA misturar com o banco principal. |
| **Backend Helpers** | `firestore-rest.js` + `jose` | Comunicação server-side sem SDK pesado para evitar conflitos ESM no Turbopack. |
| **Mídia** | Cloudinary | Renderização **sempre** via helper `@/lib/cloudinary` (`optimizeCloudinaryUrl`). |
| **Dados Estáticos** | `public/escolas-pb.json` | 5.239 escolas da PB cacheadas localmente (**0 leituras no Firestore** no cadastro/busca). |

---

## 3. Matriz de Navegação e Leitura para Agentes

### 3.1. Arquivos de Leitura Obrigatória ANTES de Iniciar uma Tarefa
* `docs/PROJECT_CONTEXT.md` (este documento) — Visão geral e restrições.
* `docs/CONSTITUTION.md` — Regras inegociáveis de engenharia e custos.
* Se a mudança altera comportamento: a pasta ativa em `specs/<nnn-slug>/` (spec → plan → tasks) e `docs/SDD_ADOPTION_PLAN.md`.
* Se docs e código divergirem, o **código vence**. Não alinhar código ao doc sem spec.

### 3.2. Consulta por Área Específica
| Se você vai modificar... | Consulte obrigatoriamente | Arquivos de código relacionados |
|---|---|---|
| **Provas, Fases e Questões** | `docs/DATABASE.md` e `docs/BUSINESS_RULES.md` | `src/app/questao/page.jsx`, `src/app/resumo-fase/page.jsx`, `src/app/documento/page.jsx`, `src/app/admin/questoes/page.jsx`, `src/app/admin/questoes/visualizar/page.jsx` |
| **Equipes e Participantes** | `docs/BUSINESS_RULES.md` e `docs/DATABASE.md` | `src/app/criar-equipe/page.jsx`, `src/app/montagem-equipe/page.jsx`, `src/app/sala-de-equipe/page.jsx`, `src/app/cadastro-escola/page.jsx` |
| **Autenticação e Permissões** | `docs/AUTHENTICATION.md` | `src/context/AuthContext.jsx`, `src/app/login/page.jsx`, `src/app/cadastro/page.jsx`, `src/app/recuperar-senha/page.jsx`, `src/app/admin/page.jsx` |
| **Ranking, Medalhas e Certificados** | `docs/BUSINESS_RULES.md` | `src/app/admin/ranking/page.jsx`, `src/app/admin/medalhas/page.jsx`, `src/app/certificado/page.jsx`, `src/app/certificado-medalha/page.jsx` |
| **Chat e Suporte** | `docs/INTEGRATIONS.md` e `docs/DATABASE.md` | `src/components/support/*`, `src/hooks/useSupportChat.js`, `src/app/api/support/*`, `src/app/admin/suporte/page.jsx` |
| **Upload de Mídias e Imagens** | `docs/INTEGRATIONS.md` e `docs/CODE_CONVENTIONS.md` | `src/lib/cloudinary.js`, `src/app/enviar-documento/page.jsx`, `src/app/admin/documentos/page.jsx` |
| **Admin / dados / questionários** | `docs/DATABASE.md` e `docs/AUTHENTICATION.md` | `src/app/admin/dashboard/page.jsx`, `src/app/admin/firestore/page.jsx`, `src/app/admin/questionarios/page.jsx` |
| **Páginas institucionais** | `docs/CODE_CONVENTIONS.md` | `src/app/page.jsx`, `src/app/sobre/page.jsx`, `src/app/regulamento/page.jsx`, `src/app/calendario/page.jsx`, `src/app/biblioteca/page.jsx`, `src/app/contato/page.jsx`, `src/app/provas-antigas/**` |

### 3.3. Arquivos Críticos (NÃO ALTERAR SEM ANÁLISE RIGOROSA)
1. `src/lib/firebase.js`: Configuração do banco principal com persistência e long polling (necessário para redes escolares).
2. `src/context/AuthContext.jsx`: Gerenciamento global de sessão e cache de usuário com TTL.
3. `src/lib/support/server/firestore-rest.js`: Helper nativo REST para Service Account.
4. `src/app/questao/page.jsx`: Lógica de prova e submissão atômica (`runTransaction`).
5. `public/escolas-pb.json`: Base estática que impede explosão de custos no Firestore.

### 3.4. Diretórios que Devem ser Evitados / Não Modificados
* `.system_generated/`, `.git/`: Metadados internos e de versionamento.
* `.cursor/` exceto `.cursor/rules/` (governança SDD do projeto).
* `public/escolas-pb.json`: Não editar manualmente; gerado a partir do CSV oficial do INEP.

### 3.5. Artefatos SDD
* Processo: `docs/SDD_ADOPTION_PLAN.md`.
* Templates: `specs/_templates/` → copiar para `specs/<nnn-slug>/`.
* Rules: `.cursor/rules/dhpb-sdd.mdc` e `.cursor/rules/dhpb-constitution.mdc`.

---

## 4. Regras que NUNCA Devem ser Quebradas

1. **Zero Full Scans no Firestore:** Nunca faça `getDocs(collection(...))` sem `where()` ou `limit()`. A busca de escolas é sempre local no JSON estático.
2. **Subcoleções Desacopladas:** Questões ficam em `fases/{fId}/questoes/{qId}` e respostas em `equipes/{eqId}/respostas/{qId}`. Nunca volte a embutir todas as questões ou respostas no documento pai.
3. **Imagens Otimizadas:** Toda tag `<img>` de mídia do Cloudinary deve usar `optimizeCloudinaryUrl(url)` para injetar `f_auto,q_auto,w_820`.
4. **Isolamento de Bancos:** O chat de suporte NUNCA lê nem grava no Firebase principal.
5. **Anti-Concorrência:** Submissão de respostas e pontuações usam `runTransaction` ou `increment()`.
6. **Integridade de Build:** Todo trabalho deve compilar com código 0 em `npm run build`.

---

## 5. Comandos do Projeto

```bash
npm run dev    # Inicia servidor local de desenvolvimento
npm run build  # Compila e valida todas as 43 rotas estáticas/dinâmicas
npm run lint   # Checagem de regras ESLint
```
