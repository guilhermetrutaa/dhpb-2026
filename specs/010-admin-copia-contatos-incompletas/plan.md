# Plan: Copiar e-mails e telefones de orientadores de equipes incompletas

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/dashboard/page.jsx` | Helpers + dois handlers + dois botões em `TabEquipes` |
| `specs/010-admin-copia-contatos-incompletas/*` | Artefatos SDD |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

Admin, no clique: `getDocsFromServer(collection(db, 'equipes'))`. Filtro no cliente via `equipeTemQuatroMembros` (já existente). Telefones: `getDoc` em `users/{uid}/questionarios/{edicaoId}` por par único.

## Writes a preservar

Nenhum write. Dual-write legado e `membro-index` intactos. Campo `isCompleta` não é atualizado.

## Auth e UI

- Gate já existente: `localStorage('admin-authenticated')`.
- Botões vinho `#82181A` ao lado de “Equipes incompletas”. Sem `useSearchParams` novo. Sem Cloudinary.
- Clipboard: `navigator.clipboard.writeText`; alert se falhar.

## Risco Spark

~N reads em `equipes` por clique. Botão de telefone: +1 read por orientador único com `uid`. Só admin, sob demanda.

## Docs a atualizar

Nenhum (sem schema nem rota).
