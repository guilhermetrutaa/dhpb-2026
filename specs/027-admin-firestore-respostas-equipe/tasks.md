# Tasks: Aba admin Firestore — respostas da equipe por fase

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec/plan/checklist 027 | `specs/027-admin-firestore-respostas-equipe/` | Artefatos no template; humano aprovou override de `entregue` | nenhum |
| T2 | Ops: listar e mutar respostas | `src/app/admin/firestore/ops.js` | Busca nome; fases; respostas; edit/delete em transação com dual-write e `increment` de `df` | ~15+10+80 reads; 2–3 writes/tx |
| T3 | Aba Respostas | `page.jsx`, `respostas-tab.jsx` | Terceira aba; blocos por fase; editar/excluir com confirmação e delta | só as queries de T2 |
| T4 | Docs + build | `DATABASE.md`, `BUSINESS_RULES.md`, `CONSTITUTION.md` | Docs alinhados; `npm run build` 0 | nenhum |

## Ordem

T1 → T2 → T3 → T4

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
