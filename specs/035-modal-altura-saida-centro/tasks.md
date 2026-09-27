# Tasks: Modal cabe na tela, saída pelo centro, estante só depois do ORDENAR (fase 3)

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec + plan + tasks | `specs/035-.../` | Spec, plan e tasks preenchidos | nenhum |
| T2 | Modal limitado pela altura | `page.jsx`, `globals.css` | `larguraModal` com termo de altura; faixa com `line-clamp-[3]`; 4:3 mantido | nenhum |
| T3 | Saída pelo centro | `page.jsx`, `globals.css` | `--dvd-desvio-fechado` de `DVD_GEO`; `scale()` antes de `translateX()`; `dvd-apagar` na faixa | nenhum |
| T4 | Estante travada até ORDENAR | `page.jsx`, `config.js` | `gesto.permitido`; guarda em `moverParaPrateleira`; aviso vermelho; cursor; `INSTRUCAO` na ordem nova | nenhum (mesma transação) |
| T5 | Validação | — | 6 tamanhos de tela, trajetória da saída, trava e libera, `npm run build` código 0 | nenhum |

## Ordem

T1 → T2 → T3 → T4 → T5

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
