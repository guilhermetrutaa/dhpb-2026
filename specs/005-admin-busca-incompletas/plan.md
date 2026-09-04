# Plan: Busca flexível de equipes e relatório de incompletas (Glayds)

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/firestore/page.jsx` | `normalizarNome` local + prefixo `nomeNormalized` + fallback `nomeLower` |
| `src/app/admin/dashboard/page.jsx` | Handler + botão em `TabEquipes`; reusa `abrirWhatsAppGlayds` |
| `docs/KNOWN_ISSUES.md` | Equipes antigas sem `nomeNormalized` |
| `specs/005-admin-busca-incompletas/*` | Artefatos SDD |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

Busca admin: `getDoc`; `where('nomeNormalized','>=',n)` + `where('nomeNormalized','<=',n+'\uf8ff')` + `limit(15)`; fallback `where('nomeLower','==',…)`.

Relatório, no clique: `getDocsFromServer(collection(db, 'equipes'))`. Filtro e agrupamento no cliente. Sem índice novo além do que o Console pedir para range em `nomeNormalized` (campo simples, em geral automático).

## Writes a preservar

Nenhum write. Dual-write legado e `membro-index` intactos.

## Auth e UI

- Gate já existente: `localStorage('admin-authenticated')`.
- Mesmo `wa.me/558399600143`. Sem `useSearchParams` novo. Sem Cloudinary.

## Risco Spark

Busca: 1–3 reads indexadas por pesquisa. Relatório: ~N reads em `equipes` por clique, só admin, sob demanda.

## Docs a atualizar

`docs/KNOWN_ISSUES.md` (limitação de equipes sem `nomeNormalized`). Sem schema nem rota nova.
