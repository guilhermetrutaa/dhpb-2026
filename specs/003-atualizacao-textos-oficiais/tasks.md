# Tasks: Atualização de textos oficiais

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Datas na timeline | `src/app/calendario/page.jsx` | Array alinhado aos PDFs | nenhum |
| T2 | §9 + microcopy | `src/app/regulamento/page.jsx` | Cronograma e correções 6.3/7.4/7.12/7.19/7.20 | nenhum |
| T3 | Knowledge do bot | `src/lib/support/ai/knowledge.js` | Mesmas datas; fases até 18:00 | nenhum |
| T4 | Validation | — | build 0 + conferência `/regulamento` e `/calendario` | nenhum |

## Ordem

T1 → T2 → T3 → T4

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
