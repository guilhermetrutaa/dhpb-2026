# Plan: Copiar resumo de equipes inscritas completas

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/dashboard/page.jsx` | `TabEquipes`: scan, topo, remover WhatsApp, botão copiar |
| `specs/013-admin-copia-resumo-completas/*` | Artefatos SDD |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

Admin, no mount de `TabEquipes`: `getDocsFromServer(collection(db, 'equipes'))`. Filtro no cliente via `equipeTemQuatroMembros`. Remove as 6 agregações `tipoEscola` / `isCompleta`. Mantém count total + lista paginada + `edicoes`.

Clique: reusa snapshot em state; `fetch('/escolas-pb.json')` para municípios.

## Writes a preservar

Nenhum write. Dual-write legado e `membro-index` intactos. Campo `isCompleta` não é atualizado.

## Auth e UI

- Gate já existente: `localStorage('admin-authenticated')`.
- Sem `wa.me`. Sem `useSearchParams` novo. Sem Cloudinary.

## Risco Spark

~N reads em `equipes` por abertura da aba Equipes, só admin. Clique do botão: 0 reads Firestore extras.

## Docs a atualizar

Nenhum (sem schema nem rota).
