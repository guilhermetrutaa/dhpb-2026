# Plan: Gabarito em PDF na fase

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/dashboard/page.jsx` | Input + `salvarGabaritoUrl` no card da fase |
| `src/app/resumo-fase/page.jsx` | Botão vira gabarito em `correcao` se houver URL |
| `docs/DATABASE.md` | Campo `gabaritoPdfUrl` na fase |
| `src/lib/support/ai/knowledge.js` | Texto do botão em correção |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`. O `onSnapshot` do doc da fase já existe.

## Writes a preservar

Só metadado `gabaritoPdfUrl` no doc da fase. Sem pontuação, dual-write de equipe ou `membro-index`.

## Auth e UI

- Admin: mesmo padrão de `salvarPdfUrl` (`updateDoc` + recarregar fases).
- `useSearchParams` do resumo já está em `<Suspense>`.
- Sem Cloudinary.

## Risco Spark

1 write por clique “Salvar” no admin. Zero write extra no path do aluno. 0 reads novos.

## Docs a atualizar

`docs/DATABASE.md` (schema da fase). `src/lib/support/ai/knowledge.js` (resumo).
