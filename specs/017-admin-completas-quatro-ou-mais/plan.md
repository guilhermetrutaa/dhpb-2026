# Plan: Completas com 4 ou mais membros no admin

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/dashboard/page.jsx` | Helper de completa, stats, titles do topo e do copy |

## Queries

Nenhuma query nova. Path do participante: 0.

## Writes a preservar

Nenhum write. Dual-write legado e `membro-index` intactos. Campo `isCompleta` não é atualizado. `handleRecalcularCompletas` permanece.

## Auth e UI

Só aba Equipes do dashboard admin. Sem `Suspense` novo.

## Risco Spark

0 reads/writes extras.

## Docs a atualizar

Nenhum schema/rota novo.
