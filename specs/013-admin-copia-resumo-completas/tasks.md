# Tasks: Copiar resumo de equipes inscritas completas

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Artefatos SDD desta feature | `specs/013-admin-copia-resumo-completas/*` | spec/plan/tasks/checklist preenchidos | nenhum |
| T2 | Scan no mount + topo só com quatro slots | `src/app/admin/dashboard/page.jsx` | header não usa `isCompleta` | ~N reads no mount |
| T3 | Remover WhatsApp + botão copiar resumo | `src/app/admin/dashboard/page.jsx` | 0 `wa.me`; clipboard com métricas da spec | 0 reads extras no clique |
| T4 | Validation | — | build 0; critérios da spec | nenhum |

## Ordem

T1 → T2 → T3 → T4

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
