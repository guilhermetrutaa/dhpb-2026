# Plan: Busca admin Firestore por ID de equipe e nome completo

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/firestore/page.jsx` | Parse de ID/URL, query de nome, UI (única mudança de código) |
| `docs/KNOWN_ISSUES.md` | Drift: busca de nome case/acento-sensível |
| `specs/001-admin-firestore-busca/*` | Artefatos SDD |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

- Equipe: 1 `getDoc`; fallback `where('nomeLower','==')` se o termo não foi extraído de URL.
- Pessoa e-mail: `where('email','==')` (existente).
- Pessoa nome: `where('nome','==')` + `where('sobrenome','==')` + `limit(15)`. Índice composto `users`: `nome` ASC + `sobrenome` ASC (criar no Console se `failed-precondition`).
- Detalhes: `participacoes` + `getDoc` em `membro-index` por edição (existente; não expandir).

## Writes a preservar

Nenhum write novo. Dual-write legado e `membro-index` de inscrição não são tocados. `deleteDoc` de suporte permanece como está.

## Auth e UI

- Gate admin: `localStorage('admin-authenticated')` (já existente nesta página; sem `useSearchParams`).
- Input de pessoa: `type="text"`.
- Sem Cloudinary nesta tela.

## Risco Spark

Uso só no painel admin (não no path da 1ª fase). Nome: no máximo 15 reads por busca. Sem scan de `users`.

## Docs a atualizar

`docs/KNOWN_ISSUES.md` — limitação de igualdade exata no nome. Sem schema/rota nova.
