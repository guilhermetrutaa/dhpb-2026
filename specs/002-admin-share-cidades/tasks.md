# Tasks: Relação de cidades no dashboard admin (WhatsApp)

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Artefatos SDD desta feature | `specs/002-admin-share-cidades/*` | spec/plan/tasks/checklist preenchidos | nenhum |
| T2 | Botão Lista de Cidades: scan + join + wa.me/clipboard | `src/app/admin/dashboard/page.jsx` | Mensagem no formato da spec; 4 botões intactos | ~N reads em `equipes` no clique |
| T3 | Validation | — | build 0; critérios da spec | nenhum |

## Ordem

T1 → T2 → T3

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
