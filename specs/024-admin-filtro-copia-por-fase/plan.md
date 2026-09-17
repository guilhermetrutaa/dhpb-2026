# Plan: Filtro de cópia admin por fase

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/dashboard/page.jsx` | `equipeComecouFase`, seletor, os três handlers de cópia |
| `specs/024-admin-filtro-copia-por-fase/*` | Artefatos SDD |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

Admin, mount de `TabEquipes`: `edicoes` + `getCountFromServer(equipes)` + lista `limit(50)` + `getDocsFromServer(query(edicoes/{id}/fases, orderBy(dataInicio)))` por edição.

Admin, primeiro clique de cópia: `getDocsFromServer(collection(db, 'equipes'))` (spec 021). Filtro `faseId` no cliente.

## Writes a preservar

Nenhum write. Dual-write legado e `membro-index` intactos.

## Auth e UI

- Gate já existente: `localStorage('admin-authenticated')`.
- `<select>` ao lado dos três botões. Sem `useSearchParams` novo. Sem Cloudinary.

## Risco Spark

~4 reads de fases no mount da aba. Scan de equipes só no clique. Zero writes com a prova aberta.

## Docs a atualizar

Nenhum (sem schema nem rota).
