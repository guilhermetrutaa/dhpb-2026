# Plan: Autorização de viagem após confirmação de presença

Traduz `spec.md` para o stack atual (Next.js App Router, Firebase Spark).

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/sala-de-equipe/page.jsx` | Botão da autorização condicionado a `presencaFinalConfirmada` |
| `src/app/admin/final/page.jsx` | Upload Word ao lado do manual já existente |
| `docs/DATABASE.md`, `docs/PROJECT_CONTEXT.md` | Campo novo + ponteiro da spec |

## Queries

Path do participante: 0 queries novas. A URL sai do `getDoc(edicoes)` que a sala já faz.

## Writes a preservar

Não toca `presencaFinalConfirmada`, `df`, `ni`, `di`, `aprovadoAte` nem `manualFinalistaUrl` já gravado. Write novo é `updateDoc` pontual em `edicoes`, só no admin.

## Auth e UI

- Sala: membro ativo já validado no onSnapshot.
- Admin: `localStorage 'admin-authenticated'`.
- Cloudinary `auto/upload`, pasta `dhpb/final`. Aceita `.doc`/`.docx`. Manual permanece em `dhpb/manuais` e só PDF.

## Risco Spark

0 leituras extras. 1 `updateDoc` por upload admin. Desprezível.

## Docs a atualizar

`docs/DATABASE.md` (`autorizacaoViagemUrl`). `docs/PROJECT_CONTEXT.md` aponta esta spec na linha do encaminhamento da final.
