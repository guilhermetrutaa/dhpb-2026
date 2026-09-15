# Tasks: Fundo SVG no modal de recortes

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec 019 | `specs/019-fundo-modal-recortes/` | spec/plan/tasks/checklist preenchidos | nenhum |
| T2 | `FUNDO_SRC` | `src/app/tarefas/recortes-flavio-tavares/config.js` | Constante aponta para `fundo.svg` | nenhum |
| T3 | Camadas do modal | `src/app/tarefas/recortes-flavio-tavares/page.jsx` | Cinza removido; um fundo CSS; só o recorte escala | nenhum |

## Ordem

T1 → T2 → T3

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
