# Plan: Seta da última questão → tarefa

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/questao/page.jsx` | Único ponto de código: `nextHref` da última questão e `aria-label` da seta |
| `src/app/resumo-fase/page.jsx` | Referência de montagem de `hrefTarefa` (não alterar) |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`. Reusa o listener já existente da fase.

## Writes a preservar

Não grava. Transação de entrega e dual-write legado em `questao/page.jsx` permanecem intactos.

## Auth e UI

- Identidade: inalterada.
- `useSearchParams`: já envolvido em `<Suspense>`.
- Cloudinary: inalterado.

## Risco Spark

Zero reads/writes extras. `fase.tarefaUrl` já vem no snapshot da fase.

## Docs a atualizar

Nenhum (sem schema, rota ou regra de negócio nova).
