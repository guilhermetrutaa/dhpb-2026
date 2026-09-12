# Tasks: Filtro do resumo de equipes no admin

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | `equipeContaNoResumo` + stats + copy | `src/app/admin/dashboard/page.jsx` | Sem “Sem classificação”; públicas = M+E+F | 0 |
| T2 | Omitir id excluído na lista | `src/app/admin/dashboard/page.jsx` | Card some em carregar/carregarMais | 0 |

## Ordem

T1 → T2

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
