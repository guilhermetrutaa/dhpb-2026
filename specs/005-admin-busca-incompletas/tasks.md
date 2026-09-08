# Tasks: Busca flexível de equipes e relatório de incompletas (Glayds)

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Artefatos SDD desta feature | `specs/005-admin-busca-incompletas/*` | spec/plan/tasks/checklist preenchidos | nenhum |
| T2 | Prefixo `nomeNormalized` + fallback `nomeLower` | `src/app/admin/firestore/page.jsx` | ID/URL intactos; placeholder atualizado | 1–3 queries filtradas |
| T3 | Botão incompletas Glayds | `src/app/admin/dashboard/page.jsx` | Mensagem no formato da spec; botões existentes intactos | ~N reads em `equipes` no clique |
| T4 | Nota KNOWN_ISSUES + validation | `docs/KNOWN_ISSUES.md` | build 0; critérios da spec | nenhum |

## Ordem

T1 → T2 → T3 → T4

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
