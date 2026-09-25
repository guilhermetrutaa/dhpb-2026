# Plan: Tarefa Charadas (fase 3)

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/tarefas/charadas/page.jsx` | Página da tarefa |
| `src/app/tarefas/charadas/config.js` | 20 placeholders, capacidades, `calcularPontosTarefa` |
| `public/tarefas/charadas/` | Ícone, 4 mídias, estante |
| `docs/DATABASE.md` | Campos `prateleiras` e `enigmas` |
| `docs/CODE_CONVENTIONS.md` | Rota kebab `tarefas/charadas` |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`. Só `getDoc` equipe, resposta, fase.

## Writes a preservar

Transação do contrato `docs/AI_PROMPT_TAREFAS.md`. Dual-write subcoleção + mapas em `equipes`. Rascunho: `delta = 0`. Entrega: `increment` em `ni`/`di`/`df`.

## Auth e UI

- Identidade: `authUser.uid` do Firebase; membro `ativo` na equipe.
- `useSearchParams` em `<Suspense>`.
- Título e teto vêm do doc da fase (`tarefa.titulo`, `tarefa.pontuacao`).
- Imagens em `/public/...`; `optimizeCloudinaryUrl` só se a URL for Cloudinary.
- Botões empilhados (rascunho acima, entregar abaixo). Cores `#C5A00A` / `#197400`.
- Alocação: clique no ícone + clique na prateleira. Sem lib de DnD.

## Risco Spark

Uma equipe: ~3 reads no load + 1 write por rascunho + 1 transação na entrega. Sem listener de coleção nova.

## Docs a atualizar

`docs/DATABASE.md` (campos `prateleiras`, `enigmas`). `docs/CODE_CONVENTIONS.md` (rota `tarefas/charadas`).
