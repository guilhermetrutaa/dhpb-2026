# Tasks: Equipes que começaram as provas (admin)

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | `equipeComecouProva` + lista a partir de `allSnap` (exclui equipe de teste) | `src/app/admin/dashboard/page.jsx` | Estado `equipesComecaram` preenchido no load | 0 extras |
| T2 | Botão: copia contagem + nomes (clipboard / prompt) | `src/app/admin/dashboard/page.jsx` | Clique cola na área de transferência ou prompt se falhar | 0 extras |

## Ordem

T1 → T2

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
