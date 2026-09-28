# Plan: Contagem do item C na questão 15 (admin)

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova. Um único arquivo muda.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/dashboard/page.jsx` | Constante do número, função pura de contagem, handler e botão na barra de cópia |

Nenhum arquivo novo. Nenhuma dependência nova.

## Abordagem

1. **Constantes e resolvedor** no escopo do módulo, junto das demais constantes: `NUMERO_QUESTAO_ITEM_C = 15` e `resolverFase2(fases, edicaoPreferidaId)`. `faseId` é docId automático (`addDoc`), então a Fase 2 é identificada por `nome` (`Fase 2`, `2ª Fase`, `2`) ou `faseId === '2'`, sobre `fasesCopia` já em memória — **zero leitura extra**.
2. **Função pura** no escopo do módulo, no mesmo bloco de `equipeComecouFase` / `listarEquipesComecaramProva` (dashboard/page.jsx:62-85): recebe `docs` do scan, `edicaoId`, `faseId` e `questaoId`; filtra por edição, 4+ membros, exclusão da equipe de teste, participação na fase, e depois `respostas[questaoId]` com `status === 'entregue'` e `alternativa === 'C'`. Devolve a lista ordenada por `localeCompare('pt-BR')`.
3. **Handler** dentro de `TabEquipes`: resolve a Fase 2, garante o scan (`garantirScanEquipes`), carrega os docs de `questoes` **da Fase 2** com `orderBy('numero','asc')` + `limit(50)`, com fallback ao array legado `fase.questoes`; localiza `questaoId` pelo `numero`; se não achar, `alert` de erro; senão conta, dá `alert` com a contagem e `copiarTexto` com contagem + nomes. Reusa `copiarTexto` (dashboard/page.jsx:872) e o estado `copiando`.
4. **Botão** na barra de cópia (dashboard/page.jsx:998-1013), mesma classe Tailwind dos vizinhos, desabilitado só enquanto `copiando` ou se a Fase 2 não existir. Não depende do `<select>` de fase.

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`. As duas queries novas são filtradas (`orderBy` + `limit`, e `where('edicaoId','==')` já existente) e só no path de admin. O scan de `equipes` é o já cacheado por `garantirScanEquipes` — zero leitura extra no segundo clique.

## Writes a preservar

Nenhum write novo. Nada toca entrega, `df`, dual-write, `membro-index` ou `aprovadoAte`.

## Auth e UI

- Identidade: inalterada (`admin-authenticated` já existente nesta página).
- `useSearchParams`: não usado neste arquivo.
- Sem `toast` no projeto: manter `alert` + `copiarTexto`, como as specs 013/020/023/024.
- Nenhum wrapper novo.

## Risco Spark

Leitura nova por clique: `fases/{faseId}/questoes` (≤50 docs, com `orderBy`) só quando o número fixo não bater. Nenhuma escrita.

## Docs a atualizar

Nenhum. Não muda rota nem schema.
