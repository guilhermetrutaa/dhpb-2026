# Tasks: Feedback ao salvar tarefa no admin e query no resumo

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Feedback e validação em `handleSalvarTarefa` | `src/app/admin/questoes/page.jsx` | Mensagens + sem catch vazio | 1 write admin |
| T2 | Append de query no cartão da tarefa | `src/app/resumo-fase/page.jsx` | Href com 3 params | 0 |

## Ordem

T1 → T2

## Validation

- [x] Critérios de `spec.md` (exceto build global)
- [x] Checklist de `docs/CONSTITUTION.md` (diff mínimo, sem Spark extra)
- [ ] `npm run build` no lote final — bloqueado por `send-fcm` / `send-mass-fcm` (`fsSendFcm` inexistente)
