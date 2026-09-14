# Plan: Tarefa recorte Migalhas / Flávio Tavares

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/tarefas/migalhas-flavio-tavares/page.jsx` | Página da tarefa |
| `src/app/tarefas/migalhas-flavio-tavares/config.js` | Pontos %, frases, gabarito, paths, Drive |
| `public/tarefas/migalhas-flavio-tavares/` | `imagem-central` + `recortes/` |
| `src/app/resumo-fase/page.jsx` | Status `tarefa_{faseId}` |
| `docs/DATABASE.md` | Payload da resposta de tarefa |
| `docs/CODE_CONVENTIONS.md` | Exemplo de rota `tarefas/` |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`. Só `getDoc` equipe, resposta, fase.

## Writes a preservar

Transação do contrato `docs/AI_PROMPT_TAREFAS.md`. Dual-write subcoleção + mapas em `equipes`. Rascunho: `delta = 0`. Entrega: `increment` em `ni`/`di`/`df`.

## Auth e UI

- Identidade: `authUser.uid` do Firebase; membro `ativo` na equipe.
- `useSearchParams` em `<Suspense>`.
- Imagens em `/public/...`; `optimizeCloudinaryUrl` só se `PDF`/imagem for Cloudinary.

## Risco Spark

Uma equipe: ~3 reads no load + 1 write por rascunho de frase + 1 transação na entrega. Sem listener de coleção nova.

## Docs a atualizar

`docs/DATABASE.md` (id `tarefa_{faseId}`, campo `associacoes`). `docs/CODE_CONVENTIONS.md` (rota kebab `tarefas/...`).
