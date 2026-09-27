# Plan: Modal do DVD na tarefa Charadas (fase 3)

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/tarefas/charadas/config.js` | `DVD_ANIM` sem `staggerMs`; `DVD_GEO` intacto (eixo real, folha, recortes, papel) |
| `src/app/globals.css` | `.dvd-cena` no lugar de `.dvd-tile`; overlay A/B revelado por `--dvd-espera` |
| `src/app/tarefas/charadas/page.jsx` | `IconeEnigma` vira quadrado estático; `DvdCaixa` novo; modal reformulado |
| `Specs/031-tarefa-charadas/spec.md` | origem do comportamento anterior |

## Trigger da animação

Sem estado novo. O palco do DVD só existe dentro do modal (`{detalhe && …}`), então **montar o modal é o gatilho**: CSS puro, `animation: dvd-abrir … both`. `both` segura o keyframe `from` durante `delayMs`, logo a capa aparece fechada antes de girar. Fechar o modal desmonta a subárvore → a próxima abertura recomeça em `rotateY(0deg)`. Nada de `useState`, nada de `setTimeout`, nada de `onAnimationEnd`.

O overlay A/B aparece com `animation: dvd-revelar … var(--dvd-espera) both`, sendo `--dvd-espera = delayMs + duracaoMs`. O mesmo keyframe anima `opacity` (fade) e `visibility` (herdada pelos botões) — sem isso o clique fantasma durante a rotação seleciona uma opção invisível. **Não usar `step-end`**: o Chrome descarta o keyframe de `visibility` nesse timing. Em `prefers-reduced-motion: reduce` o overlay vira `opacity: 1; visibility: visible` estático.

## Geometria

`DVD_GEO` não muda. O palco mantém `aspect-ratio: 1448 / 1086` (4:3, o frame de `dvd-aberto.png`) e `perspective: 170cqw`, então a perspectiva e o texto (`4.4cqw`) escalam juntos em qualquer largura. O contenedor precisa ser um elemento **pai** do palco (`container-type: inline-size` não pode consultar a si mesmo para o `170cqw` do `perspective`), por isso `.dvd-cena` (container) → `.dvd-palco` (perspectiva) → filhos.

## Layout do modal

```text
overlay fixo (fundo + blur)
└─ tira          [Fechar]                              ← sem título de charada
└─ palco (4:3, canto escuro)
   ├─ .dvd-base  clip inset(0 0 0 eixoX)  → bandeja + CD
   ├─ .dvd-capa  rotateY 0 → -180        → frente | verso c/ papel pautado
   └─ overlay A/B  grid-cols-2 (pointer-events só nos botões)
```

Largura: `w-[min(96vw,1100px)]`. 4:3 ⇒ altura ≈ 0,75 × largura; com `p-3` na overlay e a tira de ~44 px sobra `92vh` em desktop e ~70vh em celular. Sem distorção, sem corte.

## Opção A/B

Duas `<button>` absolutely posicionadas sobre as metades do palco, `aria-label` = “Opção A: {texto}”. `escolherOpcao` e `disabled={locked}` entram sem alteração. `aria-pressed` continua. Os chips ficam no rodapé de cada metade, pequenos, revelados só depois da abertura — subordinados ao DVD.

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`. Nenhuma leitura nova.

## Writes a preservar

`persistirResposta` intacta: `runTransaction`, dual-write subcoleção + mapas em `equipes`, rascunho com `delta = 0`, entrega com `increment` em `ni`/`di`/`df`, `entregue` imutável.

## Auth e UI

- Identidade: `authUser.uid` do Firebase; membro `ativo` na equipe. Sem alteração.
- `useSearchParams` continua dentro do `<Suspense>` da página.
- Imagens locais em `public/`; nenhum URL novo, logo nenhum `optimizeCloudinaryUrl`.
- Botão “Fechar” com `×` dedicado no canto superior direito do palco (formato diferente do `×` na barra de título da `031`).

## Risco Spark

Nenhuma leitura ou escrita nova. Diff 100% UI/CSS: mesma contagem de `getDoc` e mesma transação de entrega.

## Docs a atualizar

Nenhum. Rota, schema e regras de negócio inalterados. O drift contra a `031` fica registrado na própria `spec.md` desta pasta.
