# Plan: Reabrir cadastro de pessoas

Traduz `spec.md` para o stack atual (Next.js 16 App Router, Firebase Spark).

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/cadastro/page.jsx` | Restaurar formulário de `ce76270` (com normalização 004) |
| `src/app/login/page.jsx` | Recolocar "Crie agora" → `/cadastro` |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

Cadastro volta a usar `getDocFromServer` no doc recém-escrito (`users/{uid}`) para detectar conta fantasma.

## Writes a preservar

- `setDoc(users/{uid})` como no fluxo aberto.
- Não toca dual-write, `membro-index`, prova ou ranking.

## Auth e UI

- Identidade: `createUserWithEmailAndPassword` + `authUser.uid`.
- Sem `useSearchParams`.
- Sem Cloudinary.

## Risco Spark

1 write + 1 read por cadastro bem-sucedido. Sem listener e sem scan.

## Docs a atualizar

Nenhuma rota ou schema novo. `docs/AUTHENTICATION.md` já descreve `/cadastro` aberto.
