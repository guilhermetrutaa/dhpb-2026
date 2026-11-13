# Tasks: Certificado legível no celular

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | `@container` no certificado e fonte em `cqw` | `src/app/certificado/page.jsx`, `src/app/certificado-medalha/page.jsx` | Sem sobreposição em ~360px | 0 reads / 0 writes |
| T2 | `html2canvas` captura a tela com `scale = 2800 / offsetWidth` (sem clone em 1400px, que quebrava no Chrome Android) | mesmos | PDF do celular igual à tela | 0 |
| T3 | Fundo como `<img>` em vez de `background-image` (o `resizeImage` do `html2canvas` borrava o fundo) | mesmos | Assinaturas e logos nítidos no PDF | 0 |

## Ordem

T1 → T2 → T3 → `npm run build`

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
