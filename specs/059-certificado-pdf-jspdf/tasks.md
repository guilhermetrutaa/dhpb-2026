# Tasks: PDF do certificado montado direto com jsPDF

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Gerar fundo JPEG do SVG | `public/certificado-fundo.jpg` | Assinaturas e logos visíveis no JPEG | 0 |
| T2 | Helper jsPDF com layout da prévia | `src/lib/certificadoPdf.js` | PDF A4 com fundo e textos | 0 |
| T3 | Páginas usam o helper | `src/app/certificado/page.jsx`, `src/app/certificado-medalha/page.jsx` | Sem `html2canvas` nas páginas | 0 |
| T4 | Check em Node + conferência visual | `src/lib/certificadoPdf.test.mjs` | Check passa; PDF conferido no browser | 0 |

## Ordem

T1 → T2 → T4 → T3 → `npm run build`

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
