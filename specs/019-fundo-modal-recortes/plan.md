# Plan: Fundo SVG no modal de recortes

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/tarefas/recortes-flavio-tavares/config.js` | `FUNDO_SRC` |
| `src/app/tarefas/recortes-flavio-tavares/page.jsx` | Fundo CSS único no painel; recorte com zoom |
| `public/tarefas/migalhas-flavio-tavares/recortes/fundo.svg` | Capa (já existe; não regenerar) |

## Queries

Nenhuma. Path do participante inalterado.

## Writes a preservar

Nenhum write nesta feature. Transação da tarefa (014) permanece intocada.

## Auth e UI

- Sem mudança de auth. `useSearchParams` já em `<Suspense>`.
- Imagens locais em `/public/...`; sem Cloudinary.

## Risco Spark

Zero reads/writes extras.

## Docs a atualizar

Nenhum: rota e schema inalterados.
