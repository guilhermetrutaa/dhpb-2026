# Plan: Liberar montagem e acesso do professor

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/montagem-equipe/page.jsx` | Reabrir add; esconder criar; remover professor sem apagar índice se multi-equipe; Sala de Equipe se `>= 4` |
| `src/app/home-professor/page.jsx` | Lookup `orientadorUids`/`criadorUid`; `membro-index` lowercased; retry pós-questionário |
| `src/app/home/page.jsx` | `membro-index` lowercased; retry pós-questionário; sem criar-equipe |
| `docs/ARCHITECTURE.md` | Fluxo home → montagem vs alerta |
| `docs/KNOWN_ISSUES.md` | Gap `membro-index` 1:1 e equipes com >4 membros |
| `src/lib/support/ai/knowledge.js` | Textos de suporte alinhados ao to-be |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`. Extra só no clique do professor sem índice: `orientadorUids array-contains` e `criadorUid ==`.

## Writes a preservar

Add/remove de membro: `arrayUnion`/`updateDoc` + `membro-index` de estudante como hoje. Dual-write de prova não é tocado. Heal só `participacoes` do professor.

## Auth e UI

- Identidade: `authUser.uid` do Firebase, não só `localStorage`.
- `useSearchParams`: já em `<Suspense>` na montagem.
- Cloudinary: não usado nesta feature.

## Risco Spark

1ª fase em curso (set/2026). Professor com índice ok: 0 query extra. Professor quebrado: +1 ou +2 `getDocs` filtrados por clique. Remoção de professor: +1 `array-contains`.

## Docs a atualizar

`docs/ARCHITECTURE.md`, `docs/KNOWN_ISSUES.md`, `src/lib/support/ai/knowledge.js`.
