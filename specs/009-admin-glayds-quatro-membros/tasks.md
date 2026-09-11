# Tasks: Relatórios Glayds por quatro membros

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Artefatos SDD desta feature | `specs/009-admin-glayds-quatro-membros/*` | spec/plan/tasks/checklist preenchidos | nenhum |
| T2 | Helper + handlers Glayds | `src/app/admin/dashboard/page.jsx` | incompletas e share usam quatro slots | ~N reads no clique |
| T3 | Validation | — | build 0; critérios da spec | nenhum |

## Ordem

T1 → T2 → T3

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
