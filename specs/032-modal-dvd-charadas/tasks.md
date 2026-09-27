# Tasks: Modal do DVD na tarefa Charadas (fase 3)

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec + plan + tasks | `Specs/032-modal-dvd-charadas/` | Spec, plan e tasks preenchidos | nenhum |
| T2 | Gatilho da animação | `config.js`, `globals.css` | `DVD_ANIM.staggerMs` removido; `.dvd-cena` no lugar de `.dvd-tile`; overlay A/B revelado por `--dvd-espera` | nenhum |
| T3 | Grade estática | `page.jsx` | `IconeEnigma` sem 3D: quadrado `?` 10 + 5/10 colunas, sem `index`/`stagger` | nenhum |
| T4 | `DvdCaixa` + modal | `page.jsx` | Palco 3D isolado no modal; sem barra de título; A/B nas metades; fechar por botão/`Esc`/fundo | nenhum (mesma transação) |
| T5 | Validação | — | Critérios da spec + `npm run build` código 0 | nenhum |

## Ordem

T1 → T2 → T3 → T4 → T5

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
