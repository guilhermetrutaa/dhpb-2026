# Plan: Painel admin Firestore — contas, equipes e questionários

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/lib/admin/main-firebase-admin.js` | Admin SDK do projeto principal (`MAIN_SERVICE_ACCOUNT`), app nomeado `main-admin` |
| `src/lib/admin/require-admin.js` | `verifyIdToken` + e-mail `admin@dhpb.com` |
| `src/app/api/admin/auth/create-user/route.js` | Auth `createUser` + `users/{uid}` (rollback Auth se o write falhar) |
| `src/app/api/admin/auth/update-user/route.js` | Auth: e-mail e/ou senha |
| `src/app/api/admin/auth/delete-user/route.js` | Auth `deleteUser` (Firestore já limpo no client) |
| `src/app/api/admin/auth/get-user/route.js` | Metadados Auth por uid ou e-mail |
| `src/app/admin/firestore/ops.js` | Chaves `membro-index`, batches de equipe/membro/cascata (só client) |
| `src/app/admin/firestore/page.jsx` | UI das duas abas |
| `docs/AUTHENTICATION.md` | Rotas admin Auth |
| `docs/DATABASE.md` | Nota de ops admin em `membro-index` |
| `docs/PROJECT_CONTEXT.md` | APIs `/api/admin/*` |

Não editar: `criar-equipe`, `montagem-equipe`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, ranking, cadastro.

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`. Subcoleções do uid com `limit(50)`. Escolas: `fetch('/escolas-pb.json')`.

## Writes a preservar

Dual-write de prova e mapas `equipes.pontuacoes` / `respostas` não são lidos nem gravados. `membro-index` só via as funções de `ops.js` (batch). Payload de criar equipe igual ao de `criar-equipe` (sem checar questionário individual).

## Auth e UI

- Mutações Auth: Bearer `getIdToken()` da sessão `admin@dhpb.com` (login em `/admin`). UI ainda checa `localStorage`, mas a API não confia só nisso.
- Sem `useSearchParams` novo.
- Sem Cloudinary nesta feature.

## Risco Spark

Ops pontuais por busca (1 pessoa / 1 equipe). Cascata de conta: O(equipes do uid + edições). Sem scan de `users`/`equipes`. Janela da 1ª fase: impacto desprezível vs dashboard.

## Docs a atualizar

`AUTHENTICATION.md`, `DATABASE.md`, `PROJECT_CONTEXT.md` (rotas API e env `MAIN_SERVICE_ACCOUNT`).
