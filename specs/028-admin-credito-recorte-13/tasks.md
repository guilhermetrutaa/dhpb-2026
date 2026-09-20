# Tasks: Crédito retroativo do recorte 13

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec + plan + checklist | `specs/028-admin-credito-recorte-13/` | Artefatos SDD preenchidos | nenhum |
| T2 | Funções puras de crédito | `src/lib/bonificarRecorte13.js` | Só errou + entregue + completa; acerto/`recorte13Bonificado`/teto = 0; idempotente | nenhum (sem I/O) |
| T3 | Botão simular/confirmar na aba Equipes | `src/app/admin/dashboard/page.jsx` | Simular não grava; confirmar dual-write + `increment` por transação | 1 query equipes/`edicaoId`; writes só no diff |
| T4 | Docs + build | `docs/BUSINESS_RULES.md` | Aceite da spec; `npm run build` 0 | nenhum |

## Ordem

T1 → T2 → T3 → T4

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
