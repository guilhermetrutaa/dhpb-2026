# Plano — 038 Ajustes de UI do DVD

## Required reading

1. `src/app/tarefas/charadas/page.jsx`
2. `src/app/tarefas/charadas/config.js`
3. `src/app/globals.css`
4. `specs/037-enigmas-tarefa-pdf/spec.md`
5. `.cursor/rules/dhpb-constitution.mdc`

## Passos

1. **`FaixaPergunta`** (`page.jsx`) — componente novo, extracted do modal. 3
   degraus de fonte por `texto.length`, com degrau mobile menor em cada. Sem
   `max-h`, sem `line-clamp`. Aceita `ref` (React 19 trata `ref` como prop normal
   em function component).
2. **Medição** (`page.jsx`) — `faixaRef` + `alturaFaixa`. `ResizeObserver` num
   `useEffect` dependente de `detalheId`. Só o callback do observer escreve
   estado, então não nasce erro novo de `set-state-in-effect`, e ele dispara
   antes do paint, então o palco já nasce no tamanho certo.
3. **Larguras** (`page.jsx`) — `larguraModal` (uma reserva fixa de `15rem`)
   vira `larguraFaixa` (`min(96vw, 1100px)`) + `larguraPalco`
   (`min(96vw, 1100px, (100dvh - faixa - 88px) * 4/3)`). A coluna do modal perde
   `width`; a faixa e o palco recebem a sua. O palco ganha `shrink-0`.
4. **Seleção** (`page.jsx`) — os dois botões das metades perdem o `<span>` do
   valor e o `hover:bg-...`; ganham `aria-label` describing o lado, não o
   valor. A faixa vermelha de respondidos é removida.
5. **Capa respondida** (`page.jsx`) — `TileEnigma` troca a prop `respondido`
   (booleano) por `marcado` (boolean), e a grade passa
   `Boolean(enigma.respondido) || Boolean(enigmas[enigma.id]?.valor)`.
6. **Legenda do ORDENAR** (`page.jsx`) — "As 10 caixas vermelhas já vêm
   respondidas" não vale mais, já que o vermelho também marca o que a equipe
   respondeu.

## Verificação

- `npm run build`
- `npx eslint src/app/tarefas/charadas/page.jsx` — esperado: só os 2
  `react-hooks/set-state-in-effect` pré-existentes
- CDP: 8 perguntas (incluindo a de 287 caracteres) x 4 viewports, medindo
  `scrollHeight` vs `clientHeight` da faixa e a caixa do palco contra a viewport
- CDP: ausência dos textos de ponto, da faixa de aviso e do hover; tinta vinho
  na metade escolhida
- CDP: `src` da arte do quadrado depois de escolher

## Riscos

- **Feedback de layout** entre a altura da faixa e a largura do palco. Quebrado
  de propósito: a faixa tem largura própria, independente do palco.
- **Primeiro quadro com o palco grande.** O `ResizeObserver` entrega antes do
  paint, então não chega a aparecer.
- **Moldura de 88px** é um palpite conservador que cobre o pior caso (20+20 de padding
  + 16 de vão + 32 de folga). Se sobrar espaço, o palco apenas não usa.
