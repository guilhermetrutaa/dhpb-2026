# Tasks: Fase encerrada na Sala de prova

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Rótulo "Fase encerrada." na última fase visível finalizada, se a equipe não é finalista e essa é a fase dela | `src/app/sala-de-equipe/page.jsx` | Não-finalista parado na Fase 4 não vê "Aguardando resultados..." | 0 reads / 0 writes |
| T2 | Incluir o status novo na lista do chat | `src/lib/support/ai/knowledge.js` | Texto "Fase encerrada." citado | 0 |

## Ordem

T1 → T2 → `npm run build`

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
