# Plan: Atualização de textos oficiais (regulamento e calendário)

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/calendario/page.jsx` | Array da timeline: novos `date` |
| `src/app/regulamento/page.jsx` | Bloco §9 + microcorreções |
| `src/lib/support/ai/knowledge.js` | Cronograma citado pelo bot |

## Queries

Path do participante: 0. Sem Firestore.

## Writes a preservar

Não toca prova/equipe/ranking.

## Auth e UI

- Sem mudança de auth.
- Sem `useSearchParams` novo.
- Sem Cloudinary.

## Risco Spark

Nenhum. Copy estático.

## Docs a atualizar

Nenhum em `/docs` (sem rota/schema). Fontes: `public/Mudanças das datas.pdf` e `public/Regulamento 4º DHPB corrigido.pdf`.
