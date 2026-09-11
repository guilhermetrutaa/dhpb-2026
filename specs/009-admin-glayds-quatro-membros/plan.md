# Plan: Relatórios Glayds por quatro membros

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/dashboard/page.jsx` | Helper + `handleShareIncompletas` + `handleShareGlayds` |
| `specs/009-admin-glayds-quatro-membros/*` | Artefatos SDD |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

Admin, no clique: `getDocsFromServer(collection(db, 'equipes'))`. Filtro no cliente via `equipeTemQuatroMembros`.

## Writes a preservar

Nenhum write. Dual-write legado e `membro-index` intactos. Campo `isCompleta` não é atualizado.

## Auth e UI

- Gate já existente: `localStorage('admin-authenticated')`.
- Mesmo `wa.me/558399600143`. Sem `useSearchParams` novo. Sem Cloudinary.

## Risco Spark

~N reads em `equipes` por clique de cada um dos dois botões, só admin, sob demanda. Header continua usando `getCountFromServer(isCompleta)` no load.

## Docs a atualizar

Nenhum (sem schema nem rota).
