# Tasks: Reabrir cadastro de pessoas

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec | `specs/018-reabrir-cadastro-pessoas/*` | pasta alinhada ao pedido humano | nenhum |
| T2 | Restaurar `/cadastro` | `src/app/cadastro/page.jsx` | formulário cria conta | 1 write + 1 read por cadastro |
| T3 | Link no login | `src/app/login/page.jsx` | "Crie agora" visível | nenhum |

## Ordem

T1 → T2 → T3

## Validation

- [ ] Critérios de `spec.md`
- [ ] Checklist de `docs/CONSTITUTION.md`
- [ ] `npm run build` no lote final
