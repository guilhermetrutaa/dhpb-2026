# Tasks: Prazo da presença, camisas à meia-noite e lista de espera

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Relógio | `src/lib/prazoFinal.js`, sala | Presença trava 23:59; camisa abre 00:00 | 0 |
| T2 | Orientador único | modal, `tamanhosCamisa.js` | Segunda equipe não pede nem conta de novo | 1 query filtrada |
| T3 | Convocação | `convocacaoFinal.js`, `/admin/final` | Preview e batch de `aprovadoAte` até 121 | 1 leitura da edição + batches |

## Ordem

T1 → T2 → T3

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
