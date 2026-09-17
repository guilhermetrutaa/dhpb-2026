# Plan: Copiar escolas e e-mails de completas sem prova

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/dashboard/page.jsx` | Helper `listarCompletasSemProva` + dois botões na `TabEquipes` |
| `specs/023-admin-copia-completas-sem-prova/*` | Artefatos SDD |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

Admin: reusa `garantirScanEquipes()` — `getDocsFromServer(collection(db, 'equipes'))` no primeiro clique de qualquer botão de cópia; snapshot em `useRef`. Filtro no cliente: `equipeTemQuatroMembros` + `equipeContaNoResumo` + `!equipeComecouProva`. Escolas: campo `escola` do documento (0 `fetch` de JSON).

## Writes a preservar

Nenhum write. Dual-write legado e `membro-index` intactos. Campo `isCompleta` não é atualizado.

## Auth e UI

- Gate já existente: `localStorage('admin-authenticated')`.
- Dois botões ao lado de “Copiar resumo”. Sem `useSearchParams` novo. Sem Cloudinary.

## Risco Spark

~N reads em `equipes` só no primeiro clique de cópia, só admin. Cliques seguintes: 0 reads Firestore extras.

## Docs a atualizar

Nenhum (sem schema nem rota).
