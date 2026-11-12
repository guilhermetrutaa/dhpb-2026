# Plan: Tamanhos de camisa da final

Traduz `spec.md` para o stack atual (Next.js App Router, Firebase Spark).

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/lib/tamanhosCamisa.js` | Trava de envio único e HTML da tabela admin |
| `src/lib/tamanhosCamisa.test.mjs` | Check mínimo da trava e do HTML |
| `src/components/ModalTamanhosCamisa.jsx` | Formulário no visual do questionário da equipe |
| `src/app/sala-de-equipe/page.jsx` | Botão só com `presencaFinalConfirmada` |
| `src/app/admin/final/page.jsx` | Tamanho, selo e download HTML |
| `docs/DATABASE.md`, `docs/PROJECT_CONTEXT.md` | Campo novo + ponteiro da spec |

## Queries

Path do participante: 0 queries novas. O doc da equipe já vem do `onSnapshot`. Admin reusa a query de finalistas.

## Writes a preservar

Não toca `presencaFinalConfirmada`, `df`, `ni`, `di`, `aprovadoAte`, `membro-index` nem dual-write. Write novo é `runTransaction` que só cria `tamanhosCamisa` se o campo ainda não existe.

## Auth e UI

- Sala: membro ativo já validado no `onSnapshot`.
- Admin: `localStorage 'admin-authenticated'`.
- Modal, sem rota nova. `useSearchParams` permanece sob `<Suspense>`.

## Risco Spark

1 leitura + 1 escrita por envio de equipe. No máximo ~120 equipes. Desprezível.

## Docs a atualizar

`docs/DATABASE.md` (`tamanhosCamisa`). `docs/PROJECT_CONTEXT.md` aponta esta spec na linha do encaminhamento da final.
