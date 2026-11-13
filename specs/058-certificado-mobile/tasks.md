# Tasks: Certificado legível no celular

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | `@container` no certificado e fonte em `cqw` | `src/app/certificado/page.jsx`, `src/app/certificado-medalha/page.jsx` | Sem sobreposição em ~360px | 0 reads / 0 writes |
| T2 | `html2canvas` renderiza o clone em 1400px | mesmos | PDF do celular igual ao do desktop | 0 |

## Ordem

T1 → T2 → `npm run build`

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
