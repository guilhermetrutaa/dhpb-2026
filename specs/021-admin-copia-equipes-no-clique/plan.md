# Plan: Copiar resumo de equipes só no clique

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/dashboard/page.jsx` | `TabEquipes`: mount barato, um botão, cache do scan, clipboard unificado |
| `specs/021-admin-copia-equipes-no-clique/*` | Artefatos SDD |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

Admin, no mount de `TabEquipes`: `edicoes` + `getCountFromServer(equipes)` + lista `orderBy(documentId())` `limit(50)`. Sem scan completo.

Admin, no primeiro clique de “Copiar resumo”: `getDocsFromServer(collection(db, 'equipes'))`. Snapshot em `useRef`. Filtro no cliente via `computarStatsCompletas` e `listarEquipesComecaramProva`. Cidades: `fetch('/escolas-pb.json')`.

## Writes a preservar

Nenhum write. Dual-write legado e `membro-index` intactos. Campo `isCompleta` não é atualizado.

## Auth e UI

- Gate já existente: `localStorage('admin-authenticated')`.
- Um botão “Copiar resumo”. Sem `useSearchParams` novo. Sem Cloudinary.

## Risco Spark

~N reads em `equipes` só no primeiro clique do botão, só admin. Abertura da aba: ~50 docs + 1 aggregation + `edicoes`. Segundo clique: 0 reads Firestore extras.

## Docs a atualizar

Nenhum (sem schema nem rota).
