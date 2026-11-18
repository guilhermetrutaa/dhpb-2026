# Plan: Cidades das equipes da final

| Arquivo | Motivo |
|---|---|
| `src/app/admin/final/page.jsx` | Join local INEP → município e a lista na tela |

## Queries

A query de finalistas permanece: `edicaoId` + `aprovadoAte == fase_final`. Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

## Writes a preservar

Nenhum write novo. `aprovadoAte` e o dual-write de equipe não entram neste lote.

## Auth e UI

Admin já entra por `localStorage` nesta página. Sem `useSearchParams` novo. Sem Cloudinary.

## Risco Spark

Uma leitura a mais de arquivo estático por carga da edição. 0 reads Firestore extras.

## Docs a atualizar

Nenhum. Rota e schema iguais.
