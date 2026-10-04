# Tasks: Nota fixa 20 na tarefa da fase 3

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec + plan + tasks | `specs/043-admin-nota-tarefa-fase3/` | Artefatos SDD preenchidos | nenhum |
| T2 | Funções puras da nota fixa | `src/lib/fixarNotaTarefaFase3.js` | Entregue vira peso 20; peso 20 e rascunho não mudam; aborta fase errada | nenhum (sem I/O) |
| T3 | Botão simular/confirmar na aba Equipes | `src/app/admin/dashboard/page.jsx` | Simular não grava e copia a lista; confirmar dual-write + `increment` por transação | 1 query equipes/`edicaoId`; 3 writes por elegível |
| T4 | Docs + build | `docs/BUSINESS_RULES.md` | Aceite da spec; `npm run build` 0 | nenhum |

## Ordem

T1 → T2 → T3 → T4

## Validation

- [x] Critérios de `spec.md`
- [x] Asserts na lógica pura: peso 11,5 → delta 8,5; peso 20 parado; rascunho parado; equipe de teste; galeria preservada; preview sem 3ª fase e com URL errada
- [x] Botão Simular como conferência no admin (lógica pura, zero writes, delta por equipe copiado)
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
