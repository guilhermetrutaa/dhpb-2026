# Plan: Aba admin Firestore — respostas da equipe por fase

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/firestore/ops.js` | Busca por nome, listar fases/respostas, editar/excluir com transação |
| `src/app/admin/firestore/respostas-tab.jsx` | UI da aba (page.jsx já tem ~1167 linhas) |
| `src/app/admin/firestore/page.jsx` | Terceiro botão de aba + render |
| `docs/DATABASE.md` | Override admin e exclusão que reabre |
| `docs/BUSINESS_RULES.md` | Exceção admin à trava de `entregue` |
| `docs/CONSTITUTION.md` | §5: override só na aba Respostas, spec 027 |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

- `equipes` `nomeNormalized` >= / <= prefix `\uf8ff` `limit(15)`; fallback `nomeLower ==` `limit(15)`
- `edicoes/{edicaoId}/fases` `orderBy('dataInicio')` `limit(10)`
- `equipes/{equipeId}/respostas` `limit(80)`
- Edição: `getDoc` de `questoes/{qId}` e da fase

## Writes a preservar

Dual-write de prova permanece: subcoleção `respostas` + mapa `equipes.respostas` + subcoleção `pontuacoes` + mapa `equipes.pontuacoes` + `df`. Tarefa também espelha `respostas.tarefa` quando o legado é desta fase. `runTransaction` + `increment`. Não tocar `membro-index` nem `aprovadoAte`.

Fórmula: `pesoCreditado = status === 'entregue' ? peso : 0`; `deltaDi = round(delta * pesoFase * 100) / 100`.

## Auth e UI

- Gate da página: `localStorage admin-authenticated` (já existente). Writes no client como `admin@dhpb.com`.
- Sem `useSearchParams` novo.
- Sem Cloudinary.

## Risco Spark

Uma consulta: até 15 + 10 + 80 reads. Edição: 2 `getDoc` + transação (2–3 reads, 2–3 writes). Sem scan de `equipes`/`questoes`.

## Docs a atualizar

`DATABASE.md`, `BUSINESS_RULES.md`, `CONSTITUTION.md` §5.
