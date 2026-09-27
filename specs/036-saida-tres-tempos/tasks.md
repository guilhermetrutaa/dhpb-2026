# Tasks: Saída do DVD em três tempos (fase 3)

Uma responsabilidade por task.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec + plan + tasks | `specs/036-.../` | Artefatos preenchidos | nenhum |
| T2 | Quatro tempos na saída | `globals.css`, `config.js`, `page.jsx` | Capa fecha → chega ao meio opaca → para → some | nenhum |
| T3 | Corrigir o `fill-mode` | `globals.css` | `dvd-sai` com `forwards`; travessia visível | nenhum |
| T4 | Validação | — | Trajetória medida nos 4 tempos; `npm run build` código 0 | nenhum |

## Ordem

T1 → T2 → T3 → T4

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
