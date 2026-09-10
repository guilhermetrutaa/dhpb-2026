# Plan: Encerrar inscricoes com interruptor no admin

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Nao escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/lib/inscricoes.js` | Path `config/plataforma`, `inscricoesEstaoAbertas`, `equipeTemQuatroMembros`, texto da mensagem |
| `src/app/admin/dashboard/page.jsx` | Card Encerrar/Reabrir entre abas e conteudo |
| `src/app/cadastro/page.jsx` | Recusar URL e submit |
| `src/app/login/page.jsx` | Esconder "Crie agora" |
| `src/app/criar-equipe/page.jsx` | Recusar load e submit |
| `src/app/cadastro-escola/page.jsx` | Recusar |
| `src/app/home/page.jsx` | Sem equipe: nao ir a criar-equipe |
| `src/app/home-professor/page.jsx` | Idem |
| `src/app/montagem-equipe/page.jsx` | Recusar add/swap; sala so com 4 slots |
| `src/app/sala-de-equipe/page.jsx` | Recusar URL se faltar slot |
| `docs/DATABASE.md` | Schema `config/plataforma` |
| `docs/BUSINESS_RULES.md` | Regra de encerramento |
| `src/lib/support/ai/knowledge.js` | Cadastro/equipe fechados |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`. So `getDoc(config/plataforma)`.

## Writes a preservar

Batch de criar-equipe e writes de `membro-index`/membros permanecem iguais; so nao disparam com flag fechada.

## Auth e UI

- Identidade: `authUser.uid` do Firebase nas paginas ja autenticadas.
- `useSearchParams`: manter `<Suspense>` existente.
- Cadastro/login: `getDoc` no mount; submit de criar-equipe usa `getDocFromServer`.

## Risco Spark

1 leitura extra por visita as rotas listadas. 1 write admin ao clicar. Sem listener em `config`.

## Docs a atualizar

`docs/DATABASE.md`, `docs/BUSINESS_RULES.md`.
