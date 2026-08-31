# Plan: Normalizacao de nome e sobrenome no cadastro

Traduz `spec.md` para o stack atual (Next.js 16 App Router, Firebase Spark), sem nova stack.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/cadastro/page.jsx` | Normalizar e validar `nome` e `sobrenome` antes do `setDoc` de `users/{uid}` |
| `src/app/admin/firestore/page.jsx` | Aplicar a mesma normalizacao no termo de busca por nome completo |
| `specs/004-normalizacao-nome-cadastro/spec.md` | Fonte do comportamento aprovado |
| `specs/004-normalizacao-nome-cadastro/tasks.md` | Execucao e validacao da implementacao |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()` introduzidos por esta feature.

Nao ha mudanca de indice nem de formato da query composta de usuario (`nome` + `sobrenome` + `limit`).

## Writes a preservar

- Nao toca prova/equipe/ranking.
- Nao altera dual-write legado.
- Mantem o write atual em `users/{uid}` com `setDoc`, apenas normalizando os valores de string.

## Auth e UI

- Identidade preservada via Firebase Auth (`createUserWithEmailAndPassword`).
- Nao usa `useSearchParams`.
- Nao toca Cloudinary.

## Risco Spark

Risco baixo: sem consultas novas, sem ampliacao de cardinalidade, sem listeners extras.

## Docs a atualizar

Nao ha rota ou schema novo; nenhuma atualizacao obrigatoria em `/docs` para este lote.
