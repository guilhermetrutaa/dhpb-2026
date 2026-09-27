# Plan: Faixa da pergunta, saída animada, vão vazio e ORDENAR (fase 3)

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/tarefas/charadas/page.jsx` | Faixa, papel com a alternativa, estado `fechando`/`virados`/`viradas`, tile semeado/vão vazio, botão ORDENAR, `data-slot` + inserção por índice, ghost com capa |
| `src/app/globals.css` | `.charada-faixa`, `dvd-saindo` + `@keyframes dvd-fechar`/`dvd-sair`, `.dvd-vira` + `@keyframes dvd-virar` |
| `src/app/tarefas/charadas/config.js` | `CAPA_SRC`, `DVD_ANIM.saidaCapaMs/saidaPalcoMs`, `FLIP_ANIM` |
| `public/tarefas/charadas/capas/` | 20 capas provisórias 3:4 + `LEIA-ME.md` |
| `specs/033-arrastar-enigma-estante/spec.md` | origem do arrasto e dos slots |

## Estado novo

| Nome | Tipo | Por quê |
|---|---|---|
| `fechando` | state | classe `dvd-saindo`; também trava contra duplo clique |
| `virados` | state | classe `dvd-virado` na grade |
| `viradas` | state | vai no `key` da grade: remonta os tiles e refaz a virada |
| `alvoSlot` | state | `data-slot` sob o cursor, no formato `"bloco:indice"` |

`alvoBloco` (da `033`) continua, para o destaque da faixa inteira da prateleira.

## Inserção por índice

O arrasto da `033` acertava a prateleira pela faixa inteira e sempre empurrava para o fim. Agora cada slot tem `data-slot="bloco:indice"` e `slotEm(x, y)` devolve os dois. Depois de `retirar(prateleiras, id)` — que já devolve uma array nova, sem mutar a original — `fila.splice(indice, 0, id)` devolve exatamente a posição visual solta:

- mover para trás: remove em `i`, insere em `indice < i` → ok;
- mover para a frente: remove em `i`, insere em `indice > i` → ok;
- soltar no próprio lugar: remove em `i`, insere em `i` → sem mudança.

O caminho de dois cliques chama `moverParaPrateleira(bloco)` com `indice = Infinity`, que é o `Math.min` no fim da fila — mesmo comportamento antigo.

## Queries

Nenhuma leitura nova. Path do participante segue com 3 `getDoc`.

## Writes a preservar

`persistirResposta` intacta: `runTransaction`, dual-write, rascunho com `delta = 0`, entrega com `increment` em `ni`/`di`/`df`, `entregue` imutável.

## Auth e UI

- `authUser.uid` + membro `ativo`; sem alteração.
- `useSearchParams` continua no `<Suspense>` da página.
- Imagens locais em `public/`; nenhum URL novo, logo nenhum `optimizeCloudinaryUrl`.
- `fecharEnigma` é usada pelo `useEffect` do `Esc`, então ficou declarada **antes** do efeito (regra `react-hooks/immutability`).

## Risco Spark

Nenhuma leitura ou escrita nova. `virados`/`viradas` são estado de tela: não vão para o Firestore, então o schema `enigmas`/`prateleiras` não muda.

## Docs a atualizar

Nenhum. Rota, schema e regras de negócio inalterados.
