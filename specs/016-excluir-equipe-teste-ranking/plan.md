# Plan: Excluir equipe teste do ranking

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/ranking/page.jsx` | Constante local + filtro em `carregarDados` |

## Queries

Nenhuma query nova. Path do participante: 0. Scan admin existente: `equipes` com `where('edicaoId','==', edId)`.

## Writes a preservar

`handleConfirmar` continua com `writeBatch` em chunks de 400 gravando `aprovadoAte`. Dual-write legado e `membro-index` não são tocados. Documento `LhT2fV3JvyQhZU8PrSFl` permanece no Firestore.

## Auth e UI

Página admin já autenticada via `localStorage` `admin-authenticated` e `<Suspense>`. Sem `useSearchParams` novo. Sem Cloudinary.

## Risco Spark

0 reads/writes extras. Filtro só em memória após o `getDocs` já existente.

## Docs a atualizar

Nenhum schema/rota novo.
