# Tasks: Tamanhos de camisa da final

Uma responsabilidade por task.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec | `specs/053-tamanhos-camisa-final/` | spec, plan e tasks existem | 0 |
| T2 | Trava + modal | `src/lib/tamanhosCamisa.js`, `src/components/ModalTamanhosCamisa.jsx` | Transação recusa reenvio e ausência de presença | +1 read +1 write por envio |
| T3 | Botão na sala | `src/app/sala-de-equipe/page.jsx` | Botão só com presença; bloqueado depois do envio | 0 |
| T4 | Admin | `src/app/admin/final/page.jsx` | Tamanho, selo e download HTML | 0 |
| T5 | Docs | `docs/DATABASE.md`, `docs/PROJECT_CONTEXT.md` | Campo e spec documentados | 0 |

## Ordem

T1 → T2 → T3 → T4 → T5

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
