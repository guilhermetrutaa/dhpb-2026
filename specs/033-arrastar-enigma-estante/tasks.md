# Tasks: Arrastar enigma para a estante + modal sem moldura (fase 3)

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec + plan + tasks | `specs/033-.../` | Spec, plan e tasks preenchidos | nenhum |
| T2 | Modal sem moldura | `page.jsx` | Sem painel marrom, sem sombra, sem botão de fechar; A/B em `inset-0` com cores legíveis sobre fundo claro | nenhum |
| T3 | Texto nas réguas | `globals.css`, `config.js` | `.dvd-texto` calibrado; override no mobile; geometria documentada | nenhum |
| T4 | Arrasto para a estante | `page.jsx` | Pointer Events + ghost + destaque + auto-scroll; clique/teclado preservados; `colocarNaPrateleira(bloco, id)` | nenhum (mesma transação) |
| T5 | `INSTRUCAO` + validação | `config.js` | Texto descreve arrasto + reserva; `npm run build` código 0 | nenhum |

## Ordem

T1 → T2 → T3 → T4 → T5

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
