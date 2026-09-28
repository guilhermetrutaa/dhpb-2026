# Tasks: Contagem do item C na questão 15 (admin)

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Constante `NUMERO_QUESTAO_ITEM_C` + `resolverFase2` (casa por `nome`/`faseId` em `fasesCopia`, sem leitura extra) | `src/app/admin/dashboard/page.jsx` | Função no escopo do módulo, sem estado nem import novo | 0 |
| T2 | Função pura de contagem (4+ membros, edição da fase, sem equipe de teste, participação na fase, `entregue` + `alternativa === 'C'`, nomes ordenados) | `src/app/admin/dashboard/page.jsx` | Lista ordenada, sem estado nem import novo | 0 |
| T3 | Handler `handleContarItemC` travado na Fase 2, usando `garantirScanEquipes` + `questoes` da fase com fallback legado; `alert` de contagem e `copiarTexto` com contagem e nomes | `src/app/admin/dashboard/page.jsx` | `alert` mostra o total; clipboard recebe contagem + nomes; `prompt` no fallback | Leitura admin filtrada (`orderBy` + `limit(50)`) só quando o `numero` fixo não bater |
| T4 | Botão na barra de cópia, com `title` explicando o critério, sem depender do seletor de fase | `src/app/admin/dashboard/page.jsx` | Botão ao lado de "Copiar e-mails sem prova", rótulo cita Fase 2 e Q15 | 0 |

## Ordem

T1 → T2 → T3 → T4

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
