# Tasks: Seta da última questão → tarefa

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Na última questão, `nextHref` aponta para `tarefaUrl` com os mesmos query params do resumo; `aria-label` da seta direita vira “Ir para a tarefa” nesse caso | `src/app/questao/page.jsx` | Seta clicável só se houver `tarefaUrl` válido; questões 1–N-1 intactas | 0 |

## Ordem

T1

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
