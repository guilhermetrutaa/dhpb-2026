# Plan: PDF do certificado montado direto com jsPDF

Traduz `spec.md` para o stack atual (Next.js 16 App Router).

## Arquivos

| Arquivo | Motivo |
|---|---|
| `public/certificado-fundo.jpg` | Fundo raster gerado do SVG (`sharp`, 2480px, q85) |
| `src/lib/certificadoPdf.js` | `gerarCertificadoPdf` compartilhado pelas duas páginas |
| `src/lib/certificadoPdf.test.mjs` | Check mínimo em Node (assert) |
| `src/app/certificado/page.jsx` | `handleDownloadPDF` usa o helper; sai `html2canvas` |
| `src/app/certificado-medalha/page.jsx` | Idem |

## Queries

Nenhuma query nova.

## Writes a preservar

Nenhum write.

## Auth e UI

- Páginas já exigem login e `useSearchParams` sob `<Suspense>`.
- Prévia em tela inalterada.

## Risco Spark

Nenhum. Geração no cliente; +1 GET estático do JPEG (~200 KB) por download.

## Docs a atualizar

Nenhum. Rota e schema não mudam.
