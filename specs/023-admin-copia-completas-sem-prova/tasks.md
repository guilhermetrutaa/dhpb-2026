# Tasks: Copiar escolas e e-mails de completas sem prova

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Helper `listarCompletasSemProva(docs)` com escolas únicas e e-mails únicos | `src/app/admin/dashboard/page.jsx` | Recorte 013/017/020; nomes por `escolaId`; e-mails lowercase unique | 0 reads (filtro no snapshot) |
| T2 | Dois botões + clipboard; reusar `garantirScanEquipes` | `src/app/admin/dashboard/page.jsx` | Copia listas; alert/prompt; scan só no 1º clique | ~N reads no 1º clique; 0 no 2º |

## Ordem

T1 → T2

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
