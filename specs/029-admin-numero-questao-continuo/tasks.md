# Tasks: Número contínuo das questões entre fases

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Remover `max="10"`; placeholder `Número` (ex.: 10, 11…); lista `Questões (N)` | `src/app/admin/questoes/page.jsx` | Input aceita 11+; título sem `/10` | 0 |
| T2 | Documentar numeração contínua da prova | `docs/BUSINESS_RULES.md`, `docs/DATABASE.md` | §1.3 e campo `numero` descrevem continuidade entre fases | 0 |

## Ordem

T1 → T2

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
