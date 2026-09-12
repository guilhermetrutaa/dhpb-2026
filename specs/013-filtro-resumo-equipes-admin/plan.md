# Plan: Filtro do resumo de equipes no admin

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/dashboard/page.jsx` | Filtro em stats, copy e lista |

## Queries

Nenhuma query nova. Path do participante: 0.

## Writes a preservar

Nenhum write. Documento `LhT2fV3JvyQhZU8PrSFl` permanece no Firestore.

## Auth e UI

Só aba Equipes do dashboard admin. Sem `Suspense` novo.

## Risco Spark

0 reads/writes extras.

## Docs a atualizar

Nenhum schema/rota novo.
