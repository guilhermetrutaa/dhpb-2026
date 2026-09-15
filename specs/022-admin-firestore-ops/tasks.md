# Tasks: Painel admin Firestore — contas, equipes e questionários

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Helper Admin SDK principal + guard `admin@dhpb.com` | `src/lib/admin/main-firebase-admin.js`, `src/lib/admin/require-admin.js` | Importa sem misturar com `support-admin` | 0 |
| T2 | Rotas Auth create/update/delete/get | `src/app/api/admin/auth/*/route.js` | 401/403 sem token admin; create grava `users/{uid}` | 1 write `users` no create |
| T3 | `ops.js`: chaves index + batches equipe/membro/cascata | `src/app/admin/firestore/ops.js` | Funções cobrem add/remove/mover/troca/e-mail/criar equipe/cascata | writes em batch; 2 chaves index |
| T4 | Aba usuários (conta, nome/e-mail, questionário, cascata, reset, Auth) | `src/app/admin/firestore/page.jsx` | Critérios de conta/nome/e-mail/questionário/UID/reset | leituras limitadas do uid |
| T5 | Aba equipes (criar, nome, escola, membros, questionarioEquipe) | `src/app/admin/firestore/page.jsx` | Critérios de equipe/membros | batch + `nomeLower` filtrado |
| T6 | Docs + `npm run build` | `docs/AUTHENTICATION.md`, `docs/DATABASE.md`, `docs/PROJECT_CONTEXT.md` | Código 0; rotas documentadas | 0 |

## Ordem

T1 → T2 → T3 → T4 → T5 → T6

T3–T5 tocam `membro-index` (isoladas de prova/`df`). T1–T2 são só Auth/API.

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
