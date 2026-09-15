# Tasks: Copiar resumo de equipes só no clique

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Tirar scan completo do `useEffect`; manter `edicoes` + count + `limit(50)` | `src/app/admin/dashboard/page.jsx` | Abrir a aba não chama `getDocsFromServer` em `equipes` sem `limit` | ~50 + count + edicoes no mount |
| T2 | Um botão: scan no 1º clique, cache em ref, topo + clipboard (completas + quem começou); remover o segundo botão | `src/app/admin/dashboard/page.jsx` | Clique copia os dois blocos; segundo clique sem `getDocs` extra | ~N reads no 1º clique; 0 no 2º |

## Ordem

T1 → T2

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
