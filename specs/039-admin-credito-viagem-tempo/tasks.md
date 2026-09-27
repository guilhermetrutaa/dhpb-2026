# Tasks: Crédito retroativo do gabarito da Viagem no Tempo (imagens 2 e 7)

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec + plan + checklist | `specs/039-admin-credito-viagem-tempo/` | Artefatos SDD preenchidos | nenhum |
| T2 | Funções puras de crédito | `src/lib/bonificarViagemTempo.js` | Só 0,00 no componente + entregue + completa; flags/teto = 0; idempotente; `imagens` preservado | nenhum (sem I/O) |
| T3 | Botão simular/confirmar na aba Equipes | `src/app/admin/dashboard/page.jsx` | Simular não grava e copia a lista; confirmar dual-write + `increment` por transação | 1 query equipes/`edicaoId`; 3 writes por elegível |
| T4 | Docs + build | `docs/BUSINESS_RULES.md`, `docs/DATABASE.md` | Aceite da spec; `npm run build` 0 | nenhum |

## Ordem

T1 → T2 → T3 → T4

## Validation

- [x] Critérios de `spec.md`
- [x] Asserts na lógica pura: elegibilidade (0,00 vs parcial), rascunho/incompleta, equipe de teste, flag idempotente, teto, `imagens` preservado, preview (`sem_fase_viagem`)
- [x] Botão Simular como conferência no admin (lógica pura, zero writes, delta por equipe copiado)
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
