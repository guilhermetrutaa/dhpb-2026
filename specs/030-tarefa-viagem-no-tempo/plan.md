# Plan: Tarefa Viagem no Tempo (fase 2)

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/tarefas/viagem-no-tempo/page.jsx` | Página da tarefa |
| `src/app/tarefas/viagem-no-tempo/config.js` | Fotos, gabarito, bandas, `calcularPontosTarefa` |
| `src/app/tarefas/viagem-no-tempo/TravelMap.jsx` | Mapa Leaflet da tarefa |
| `public/tarefas/viagem-no-tempo/` | `1.webp`–`10.webp` + marcador |
| `docs/DATABASE.md` | Campo `imagens` na resposta de tarefa |
| `docs/CODE_CONVENTIONS.md` | Rota kebab `tarefas/viagem-no-tempo` |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`. Só `getDoc` equipe, resposta, fase.

## Writes a preservar

Transação do contrato `docs/AI_PROMPT_TAREFAS.md`. Dual-write subcoleção + mapas em `equipes`. Rascunho: `delta = 0`. Entrega: `increment` em `ni`/`di`/`df`.

## Auth e UI

- Identidade: `authUser.uid` do Firebase; membro `ativo` na equipe.
- `useSearchParams` em `<Suspense>`.
- Título e teto vêm do doc da fase (`tarefa.titulo`, `tarefa.pontuacao`).
- Imagens em `/public/...`; `optimizeCloudinaryUrl` só se a URL for Cloudinary.

## Risco Spark

Uma equipe: ~3 reads no load + 1 write por rascunho de foto + 1 transação na entrega. Sem listener de coleção nova.

## Docs a atualizar

`docs/DATABASE.md` (campo `imagens`). `docs/CODE_CONVENTIONS.md` (rota `tarefas/viagem-no-tempo`).
