# Plan: <titulo>

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

<!-- Matriz docs/PROJECT_CONTEXT.md §3.2 + arquivos extras desta feature. -->

| Arquivo | Motivo |
|---|---|
| | |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

## Writes a preservar

Se toca prova/equipe/ranking: transação/batch existente e dual-write legado (subcoleção + mapa em `equipes`) permanecem até spec de remoção.

## Auth e UI

- Identidade: `authUser.uid` do Firebase, não só `localStorage`.
- `useSearchParams`: envolver em `<Suspense>`.
- Cloudinary de produção: `optimizeCloudinaryUrl`.

## Risco Spark

<!-- Janela da 1ª fase (set/2026) e estimativa de reads/writes. -->

## Docs a atualizar

<!-- Se schema, rota ou regra mudar. -->
