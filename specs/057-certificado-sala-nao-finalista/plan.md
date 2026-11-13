# Plan: Certificado de participação para não-finalista na Sala de Equipe

Traduz `spec.md` para o stack atual (Next.js 16 App Router, Firebase Spark).

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/sala-de-equipe/page.jsx` | Botão de certificado no bloco não-finalista; número 4 para `aprovadoAte === 'fase4'` |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`. Nenhuma query nova.

## Writes a preservar

Não toca prova, equipe, ranking, `df` nem `aprovadoAte`.

## Auth e UI

- Sala já exige membro ativo (`authUser.uid`) e `useSearchParams` sob `<Suspense>`.
- Sem Cloudinary.

## Risco Spark

Nenhum. Só render no cliente.

## Docs a atualizar

Nenhum. Rota e schema não mudam.
