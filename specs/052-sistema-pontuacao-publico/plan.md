# Plan: Página pública do sistema de pontuação

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/sistema-de-pontuacao/page.jsx` | Página com os dois PDFs |
| `src/app/page.jsx` | Item no menu da página inicial |
| `src/app/home/page.jsx`, `src/app/home-professor/page.jsx`, `src/app/biblioteca/page.jsx`, `src/app/provas-antigas/page.jsx`, `src/app/calendario/page.jsx`, `src/app/contato/page.jsx`, `src/app/regulamento/page.jsx` | Mesmo menu institucional, item não some ao navegar |
| `docs/PROJECT_CONTEXT.md` | Rota nova na matriz §3.2 |

## Queries

Nenhuma.

## Writes a preservar

Nenhum.

## Auth e UI

Página pública, mesmo shell de Provas Antigas. Sem `useSearchParams`.

## Risco Spark

Zero reads/writes.
