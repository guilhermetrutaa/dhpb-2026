# Tasks: Sistema de pontuação e eliminação por fases

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Fórmula `Di = Ni × peso` na entrega | `src/app/questao/page.jsx` | `deltaDi = delta * peso`; dual-write e `entregue` intactos | 1 transação / entrega; `increment` em `ni`/`di`/`df` |
| T2 | Módulo puro de cortes e desempate | `src/lib/eliminacaoFases.js` | Funções cobrem F1→2, F2→3, F3→4, F4→5, empate e VR pública | nenhum |
| T3 | Ranking: preview + batch `aprovadoAte` + tabela 2 casas | `src/app/admin/ranking/page.jsx` | Admin gera preview, confirma só aprovadas novas | 1 `getDocs` filtrado por `edicaoId`; batches de update em `aprovadoAte` |
| T4 | Textos oficiais, knowledge e docs | `regulamento/page.jsx`, `knowledge.js`, `dashboard/page.jsx`, `BUSINESS_RULES.md`, `DATABASE.md` | Mesmos números da spec | nenhum |

## Ordem

T1 → T2 → T3 → T4

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
