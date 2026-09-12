# Tasks: Gabarito em PDF na fase

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Campo + `salvarGabaritoUrl` | `src/app/admin/dashboard/page.jsx` | Input e save gravam `gabaritoPdfUrl` | 1 write admin |
| T2 | Botão do resumo | `src/app/resumo-fase/page.jsx` | `correcao` + URL → azul / “Baixar gabarito” | 0 |
| T3 | Docs | `docs/DATABASE.md`, `src/lib/support/ai/knowledge.js` | Schema e knowledge alinhados | 0 |

## Ordem

T1 → T2 → T3

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
