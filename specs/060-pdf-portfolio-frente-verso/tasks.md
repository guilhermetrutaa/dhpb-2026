# Tasks: PDF do portfólio em frente e verso

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Folhas A4 frente e verso | `portfolioPdf.jsx` | Duas `div` A4 com o layout do cartaz | 0 |
| T2 | Captura por página com encaixe | `portfolioPdf.jsx` | Texto encolhe até caber; 1 `addImage` por folha | 0 |
| T3 | Wrappers | `correcao/page.jsx`, `portfolio-artistico/page.jsx` | Sem `w-[800px]` | 0 |

## Ordem

T1 → T2 → T3

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` código 0; self-check do encaixe OK; PDF = 2 capturas `[data-pdf-pagina]` (sem fatiamento)
