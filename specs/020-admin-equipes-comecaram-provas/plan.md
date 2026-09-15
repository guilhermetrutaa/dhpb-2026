# Plan: Equipes que começaram as provas (admin)

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/dashboard/page.jsx` | Helper, estado a partir de `allSnap`, botão na aba Equipes |

## Queries

Nenhuma query nova. Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`. Reusa o scan admin já existente.

## Writes a preservar

Nenhum write. Dual-write legado em `questao` permanece intocado.

## Auth e UI

Só aba Equipes do dashboard admin. Sem `Suspense` novo. Sem Cloudinary.

## Risco Spark

0 reads/writes extras no clique. O carregamento da aba já custa 1 leitura por documento de `equipes` (existente).

## Docs a atualizar

Nenhum schema/rota novo.
