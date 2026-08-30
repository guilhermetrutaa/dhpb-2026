# Plan: Relação de cidades no dashboard admin (WhatsApp)

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/dashboard/page.jsx` | Handler + botão em `TabEquipes` |
| `specs/002-admin-share-cidades/*` | Artefatos SDD |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

Admin, no clique: `getDocsFromServer(collection(db, 'equipes'))`. Município via `fetch('/escolas-pb.json')` mapeando `id` → `municipio`. Sem índice novo.

## Writes a preservar

Nenhum write. Dual-write legado e `membro-index` intactos.

## Auth e UI

- Gate já existente: `localStorage('admin-authenticated')` na página.
- Mesmo `wa.me/558399600143` dos outros botões.
- Sem `useSearchParams` novo. Sem Cloudinary.

## Risco Spark

~600–2.000 reads por clique, ~1×/semana, só admin. Fora da janela do path da 1ª fase do participante.

## Docs a atualizar

Nenhum: sem schema nem rota nova.
