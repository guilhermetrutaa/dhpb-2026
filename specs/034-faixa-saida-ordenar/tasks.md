# Tasks: Faixa da pergunta, saída animada, vão vazio e ORDENAR (fase 3)

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec + plan + tasks | `specs/034-.../` | Spec, plan e tasks preenchidos | nenhum |
| T2 | Pasta das capas | `public/tarefas/charadas/capas/`, `config.js` | 20 capas 3:4 provisórias + LEIA-ME; `CAPA_SRC` com extensão num lugar só | nenhum |
| T3 | Faixa + papel com a alternativa | `globals.css`, `page.jsx` | Pergunta na faixa acima do DVD; papel com o texto da alternativa escolhida | nenhum |
| T4 | Saída animada | `globals.css`, `page.jsx` | `dvd-saindo` com `dvd-fechar` + `dvd-sair`; `fecharEnigma` em `Esc`/clique fora/fundo; reduced-motion fecha na hora | nenhum |
| T5 | Vão vazio no tile alocado | `page.jsx` | Sem imagem, só o vão tracejado | nenhum |
| T6 | ORDENAR + virada | `page.jsx`, `globals.css`, `config.js` | Botão travado até 20/20; `dvd-virar` com cascata; replay por `key` | nenhum |
| T7 | Reordenar por slot | `page.jsx` | `data-slot` + `slotEm` + `moverParaPrateleira(bloco, indice, id)`; estante e ghost com a capa | nenhum (mesma transação) |
| T8 | Validação | — | Critérios da spec + `npm run build` código 0 | nenhum |

## Ordem

T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
