# Tasks: Tarefa Charadas (fase 3)

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec + pasta public | `specs/031-...`, `public/tarefas/charadas/` | Spec preenchida; ícone + 4 mídias | nenhum |
| T2 | config.js | `src/app/tarefas/charadas/config.js` | 20 placeholders, capacidades, `calcularPontosTarefa` + self-check | nenhum |
| T3 | Página + entrega | `page.jsx` | Auth, locadora, detalhamento, overflow, transação | 3 reads + writes da transação |
| T4 | Docs + build | `docs/DATABASE.md`, `docs/CODE_CONVENTIONS.md` | Build código 0 | nenhum |

## Ordem

T1 → T2 → T3 → T4

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
