# Tasks: <titulo>

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | | | | reads/writes estimados |
| T2 | | | | |

## Ordem

T1 → T2 → …

## Validation

- [ ] Critérios de `spec.md`
- [ ] Checklist de `docs/CONSTITUTION.md`
- [ ] `npm run build` no lote final
