# Tasks: Autorização de viagem após confirmação de presença

Uma responsabilidade por task.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec | `specs/051-docs-presenca-final/` | spec, plan e tasks existem | 0 |
| T2 | Upload admin | `src/app/admin/final/page.jsx` | Word grava `autorizacaoViagemUrl`; outro tipo recusado; manual intacto | +1 updateDoc por upload |
| T3 | Botão na sala | `src/app/sala-de-equipe/page.jsx` | Botão só com `presencaFinalConfirmada`; desabilitado sem URL | 0 |
| T4 | Docs | `docs/DATABASE.md`, `docs/PROJECT_CONTEXT.md` | Campo e spec documentados | 0 |

## Ordem

T1 → T2 → T3 → T4

## Validation

- [ ] Critérios de `spec.md`
- [ ] Checklist de `docs/CONSTITUTION.md`
- [ ] `npm run build` no lote final
