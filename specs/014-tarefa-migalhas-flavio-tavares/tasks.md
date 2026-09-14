# Tasks: Tarefa recorte Migalhas / Flávio Tavares

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec + pastas public | `specs/014-...`, `public/tarefas/migalhas-flavio-tavares/` | Spec preenchida; `.gitkeep` em recortes | nenhum |
| T2 | config.js | `src/app/tarefas/migalhas-flavio-tavares/config.js` | 20 pontos, 26 frases, gabarito do PDF | nenhum |
| T3 | Página + entrega | `src/app/tarefas/migalhas-flavio-tavares/page.jsx` | Auth, UI, modal, transaction | 3 reads + writes da transação |
| T4 | Status no resumo | `src/app/resumo-fase/page.jsx` | Preferência `tarefa_{faseId}` | nenhum write novo |
| T5 | Docs + build | `docs/DATABASE.md`, `docs/CODE_CONVENTIONS.md` | Build código 0 | nenhum |

## Ordem

T1 → T2 → T3 → T4 → T5

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
