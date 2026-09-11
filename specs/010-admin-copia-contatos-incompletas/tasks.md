# Tasks: Copiar e-mails e telefones de orientadores de equipes incompletas

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Artefatos SDD desta feature | `specs/010-admin-copia-contatos-incompletas/*` | spec/plan/tasks/checklist preenchidos | nenhum |
| T2 | Botões copiar e-mail/telefone | `src/app/admin/dashboard/page.jsx` | clipboard com listas únicas no clique | ~N + M reads no clique |
| T3 | Validation | — | build 0; critérios da spec | nenhum |

## Ordem

T1 → T2 → T3

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
