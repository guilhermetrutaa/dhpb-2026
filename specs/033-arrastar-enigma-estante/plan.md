# Plan: Arrastar enigma para a estante + modal sem moldura (fase 3)

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/tarefas/charadas/page.jsx` | `TileEnigma` vira handle de arrasto; estado/gistos/auto-scroll; `colocarNaPrateleira(bloco, id)`; modal sem painel nem botão |
| `src/app/globals.css` | `.dvd-texto` (fonte/entrelinha/padding) + override no mobile |
| `src/app/tarefas/charadas/config.js` | Comentário da geometria do papel; `INSTRUCAO` com o arrasto |
| `specs/032-modal-dvd-charadas/spec.md` | origem do modal e da animação 3D |

## Estado do arrasto

| Onde | O quê | Por quê |
|---|---|---|
| `gestoRef` | `{ id, x0, y0, x, y, ativo }` | muda a 60fps; não pode ser state |
| `fantasmaRef` | elemento do ghost | `style.transform` escrito direto, sem re-render |
| `prateleiraRef` | mapa `bloco -> elemento` | hit-test por `getBoundingClientRect` |
| `arrastando` (state) | `bool` | monta/desmonta o ghost e liga o rAF |
| `alvoBloco` (state) | `1 \| 2 \| 3 \| null` | destaque da prateleira; muda só na troca de bloco |

## Modal

O `dvd-aberto.png` tem alpha (cantos `rgba(0,0,0,0)`), então dispensar o painel não mostra retângulo branco. A moldura que fica é o `bg-black/70 backdrop-blur-sm` do overlay — ela dá foco e é a área de clique para sair, que é o comportamento pedido. O wrapper do palco encolhe para `relative w-[min(96vw,1100px)]`; as metades A/B voltam a `inset-0`.

## Queries

Nenhuma leitura nova. Path do participante segue com 3 `getDoc`.

## Writes a preservar

`persistirResposta` intacta: `runTransaction`, dual-write, rascunho com `delta = 0`, entrega com `increment` em `ni`/`di`/`df`, `entregue` imutável.

## Auth e UI

- `authUser.uid` + membro `ativo`; sem alteração.
- `useSearchParams` continua no `<Suspense>` da página.
- Nenhum URL novo, logo nenhum `optimizeCloudinaryUrl`.
- `aria-label` no `role="dialog"` com o id do enigma, já que não há mais botão de fechar visível. `Esc` segue como saída por teclado.

## Risco Spark

Nenhuma leitura ou escrita nova. Diff 100% UI/CSS/CSS-inline: mesma contagem de `getDoc` e mesma transação de entrega.

## Docs a atualizar

Nenhum. Rota, schema e regras de negócio inalterados; o texto do `INSTRUCAO` acompanha a UI.
