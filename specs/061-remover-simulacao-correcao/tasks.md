# Tasks: Remover simulação local da correção

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Tirar modo `sim` | `page.jsx` | Sem banner, sem bypass | 0 |
| T2 | Apagar mock | `mock.js` | Arquivo removido | 0 |

## Ordem

T1 → T2

## Validation

- [x] Critérios de `spec.md`
- [x] `npm run build` código 0
