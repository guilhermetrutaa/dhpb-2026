# Plan: Certificado legível no celular

Traduz `spec.md` para o stack atual (Next.js 16 App Router, Tailwind v4).

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/certificado/page.jsx` | `@container` + fonte em `cqw`; `html2canvas` em 1400px |
| `src/app/certificado-medalha/page.jsx` | Mesmo diff |

## Queries

Nenhuma query nova.

## Writes a preservar

Nenhum write.

## Auth e UI

- Páginas já exigem login e `useSearchParams` sob `<Suspense>`.
- Sem Cloudinary.

## Risco Spark

Nenhum. Só CSS e geração de PDF no cliente.

## Docs a atualizar

Nenhum. Rota e schema não mudam.
