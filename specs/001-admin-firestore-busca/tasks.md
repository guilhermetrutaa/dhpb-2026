# Tasks: Busca admin Firestore por ID de equipe e nome completo

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Artefatos SDD desta feature | `specs/001-admin-firestore-busca/*` | spec/plan/tasks/checklist preenchidos | nenhum |
| T2 | Parse de ID/URL, `getDoc`, mensagens, link montagem | `src/app/admin/firestore/page.jsx` | URL e ID cru resolvem; exclusão profunda intacta | 1 `getDoc` + fallback `nomeLower` |
| T3 | Busca por nome completo + e-mail; lista de homônimos | `src/app/admin/firestore/page.jsx` | 2+ palavras query com `limit(15)`; 1 palavra zero query | 1 query ≤15 reads |
| T4 | Nota de limitação + validation | `docs/KNOWN_ISSUES.md` | build 0; critérios da spec | nenhum |

## Ordem

T1 → T2 → T3 → T4

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
