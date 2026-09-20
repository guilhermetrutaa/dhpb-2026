# Plan: Número contínuo das questões entre fases

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/questoes/page.jsx` | Tirar `max="10"`, placeholder e contador `/10` |
| `docs/BUSINESS_RULES.md` | Regra: `numero` é da prova inteira, não reinicia por fase |
| `docs/DATABASE.md` | Campo `numero` descreve ordinal contínuo da edição |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`. Nenhuma query nova.

## Writes a preservar

Cadastro admin existente (`setDoc` na subcoleção + `updateDoc` de `questoesIndex` / `questoes`). Sem tocar entrega, `df`, `membro-index` ou `aprovadoAte`.

## Auth e UI

- Identidade: inalterada (`admin-authenticated` já existente nesta página).
- `useSearchParams`: já envolvido em `<Suspense>`.
- Cloudinary: inalterado.

## Risco Spark

Zero reads/writes extras. Só muda validação HTML e copy.

## Docs a atualizar

`docs/BUSINESS_RULES.md` §1.3 e `docs/DATABASE.md` no campo `numero`.
