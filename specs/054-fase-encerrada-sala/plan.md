# Plan: Fase encerrada na Sala de prova

Traduz `spec.md` para o stack atual (Next.js 16 App Router, Firebase Spark).

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/sala-de-equipe/page.jsx` | Rótulo da Fase 4 finalizada para quem não é finalista |
| `src/lib/support/ai/knowledge.js` | Lista de status que o chat descreve |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`. Nenhuma query nova.

## Writes a preservar

Não toca prova, equipe, ranking, `df` nem `aprovadoAte`.

## Auth e UI

- Sala já exige membro ativo (`authUser.uid`) e `useSearchParams` sob `<Suspense>`.
- Sem Cloudinary.

## Risco Spark

Nenhum. Só texto no cliente.

## Docs a atualizar

Nenhum. Rota e schema não mudam.
