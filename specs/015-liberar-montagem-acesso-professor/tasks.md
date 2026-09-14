# Tasks: Liberar montagem e acesso do professor

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Reabrir add/remove e esconder Criar Nova Equipe | `src/app/montagem-equipe/page.jsx` | `podeAddMembro` por papel; add grava de novo | writes já existentes no add |
| T2 | Acesso edição professor/aluno | `home-professor/page.jsx`, `home/page.jsx` | professor acha equipe via `orientadorUids`; pós-questionário retenta | +1–2 reads filtrados se índice falhar |
| T3 | Remoção de professor multi-equipe | `src/app/montagem-equipe/page.jsx` | não apaga `participacoes`/`membro-index` se ainda orientar outra | 1 `array-contains`; write condicional |
| T4 | Sala de Equipe com `>= 4` | `src/app/montagem-equipe/page.jsx` | 4+ ativos veem o botão | 0 |
| T5 | Docs + build | `ARCHITECTURE.md`, `KNOWN_ISSUES.md`, `knowledge.js` | build 0 | 0 |

## Ordem

T1 → T2 → T3 → T4 → T5

## Validation

- [ ] Critérios de `spec.md`
- [ ] Checklist de `docs/CONSTITUTION.md`
- [ ] `npm run build` no lote final
