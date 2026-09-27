# Spec: Arrastar enigma para a estante + modal sem moldura (fase 3)

| Campo | Valor |
|---|---|
| Slug | `033-arrastar-enigma-estante` |
| Status | implementada |
| Firebase | principal |

Continuidade da `032-modal-dvd-charadas`. Três correções de UI sobre a apresentação da tarefa Charadas.

## Problema / valor

1. O modal da `032` desenhava um painel marrom (`#17130F`) atrás do palco e um botão `× FECHAR`. O painel é uma moldura que não existe no desenho: `dvd-aberto.png` tem alpha e o caso já vem com a própria sombra. O botão occupying uma faixa acima do DVD empurrava o palco para baixo e criava um segundo caminho de saída redundante.
2. A charada no papel pautado estava com fonte e entrelinha soltas: o texto cortava as réguas do desenho em vez de se apoiar nelas.
3. A alocação exigia dois cliques separados (quadro → prateleira). Arrastar o quadrado até a estante é o gesto direto e é o que a equipe espera.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`) — mesmo acesso, mesmas interações
- [ ] Admin principal — nada muda
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `persistirResposta`, `alocacaoCompleta`, `calcularPontosTarefa`, `CAPACIDADES`, `escolherOpcao`, `removerDaPrateleira`, `selecionadoId`, `alocados`, `ativo`, `status`, `locked`, `enigmas[].opcao`, a transação, o dual-write, rotas ou schema. Não usa HTML5 drag-and-drop (não funciona em toque). Não instala dependências. Não mexe na animação 3D da `032`.

## Decisões humanas

- Texto entre as réguas **no desktop**; no mobile a fonte cresce e cada linha passa a ocupar ~2 réguas (o papel tem 139px de largura a 1,9cqw a fonte daria 6,5px, ilegível).
- Arrasto **mais** o caminho de dois cliques, que segue como reserva.

## As-is vs to-be

| Regra | No código hoje (032) | Depois desta spec |
|---|---|---|
| Fundo do modal | `bg-[#17130F]` + `shadow-[0_18px_50px_…]` + `pt-8/pt-10` | Nada. O palco é transparente e o caso aparece sobre a página escurecida (`bg-black/70` + blur, que segue para dar foco e ser a área de clique para sair) |
| Botão de fechar | `× FECHAR` no canto superior direito | Nenhum. Sai por `Esc`, por clique fora da área do DVD ou por clique no fundo |
| Metades A/B | `top-8 sm:top-10` (abaixo da faixa do botão) | `inset-0`, as metades cobrem o palco inteiro |
| Cor dos rótulos A/B | `bg-black/60 text-[#E9E1D3]` (pensados para o painel escuro) | `bg-[#E9E1D3]/90 text-[#3B2A1E]`; hover `bg-[#3B2A1E]/10` em vez de `bg-white/10`, invisível sobre página clara |
| Charada no papel | `4,4cqw` / `leading 1,35`, inline | `.dvd-texto` no CSS: `1,9cqw` / `line-height 2,448cqw` / `padding-top 0,8cqw`. Medido contra as réguas reais do PNG |
| Charada no mobile | idem | `3,6cqw` / `4,6cqw` / `padding-top 1,6cqw` (< 640px) |
| Alocação | clicar no quadro → clicar na prateleira | **arrastar** o quadro até a prateleira (ghost + prateleira destacada). O caminho de dois cliques continua como reserva |
| Clique no quadro | abre o DVD | igual, mas só quando o ponteiro **não** arrastou (limiar de 5px) |
| Teclado | — | `Enter`/`Espaço` no quadro focado abre o DVD (`onClick` com `event.detail === 0`) |
| `INSTRUCAO` | "Clique no ícone… depois clique na prateleira" | "Arraste o quadrado até a prateleira — ou clique no quadrado e depois clique na prateleira" |

## Geometria do texto (medida, não estimada)

No frame de 1448×1086 do `dvd-aberto.png`:

- as réguas do papel distam **35,45px** = **2,448cqw**;
- a primeira régua está a **205px** do topo = **14,157cqw**;
- o topo da caixa de texto fica a **11,465cqw** do topo do palco.

Poppins 500 (medido via `measureText`): ascent 1,05em, descent 0,35em. Com `font-size: 1,9cqw` e `line-height: 2,448cqw` a linha de base cai 1,889cqw do topo da linha, então `padding-top = 14,157 − 11,465 − 1,889 = 0,8cqw`. Uma linha de texto por régua, 20 linhas, ~32 caracteres por linha. **Mudou a fonte? Recalcule.**

## Arrasto

Pointer Events, sem lib. `setPointerCapture` no `pointerdown` (a estante está longe do quadro; sem capture o `pointerup` chegaria no elemento sob o cursor). `touch-action: none` no quadro. A posição do ponteiro fica num ref — o React só guarda `arrastando` e `alvoBloco`, que mudam com pouca frequência, então arrastar não re-renderiza a página a 60fps. O ghost é posicionado por `style.transform` direto no DOM.

Soltar: se moveu > 5px, aloca na prateleira sob o cursor (ou cancela se não houver); se não moveu, abre o DVD. `colocarNaPrateleira(bloco, id = selecionadoId)` recebe o id do arrasto; sem argumento continua usando a seleção por clique.

**Trade-off conhecido:** `touch-action: none` no quadro impede o browser de rolar a página quando o gesto começa sobre a grade (≈340px de altura no celular). É o preço de um arrasto por toque determinístico — `touch-action` é avaliado no início do gesto e não pode ser ligado depois. Mitigações: a rolagem normal funciona em qualquer outro lugar da página, e o caminho de dois cliques continua disponível. Rolagem automática por `requestAnimationFrame` quando o arrasto encosta nas bordas (110px de margem, velocidade proporcional à distância), porque no celular a grade e a estante não cabem juntas na tela.

## Firestore

**Leituras/writes:** nenhuma nova, nenhuma alteração. `escolherOpcao` continua gravando `enigmas.<id>.opcao`; a alocação continua indo por `persistirResposta` com a mesma transação, o mesmo dual-write e o mesmo `entregue` imutável.

## Required reading

1. `specs/032-modal-dvd-charadas/spec.md`
2. `src/app/tarefas/charadas/page.jsx`
3. `src/app/tarefas/charadas/config.js`
4. `src/app/globals.css`
5. `public/dvd-aberto.png`

## Critérios de aceite

- [x] Modal sem painel marrom, sem sombra e sem botão de fechar; o PNG transparente aparece sobre a página escurecida
- [x] `Esc`, clique fora da área do DVD e clique no fundo fecham o modal
- [x] As metades A/B cobrem o palco inteiro; rótulos legíveis sobre fundo claro
- [x] Charada apoiada nas réguas: 1 linha por régua, 1ª linha de base na 1ª régua (erro medido < 0,01cqw)
- [x] No celular a fonte cresce e o texto fica legível
- [x] Arrastar o quadro até a prateleira aloca; ghost visível; prateleira do cursor destacada
- [x] Soltar fora de qualquer prateleira cancela e não abre o modal
- [x] Soltar sem mover abre o DVD
- [x] Enter/Espaço no quadro focado abre o DVD
- [x] Limite de capacidade no arrasto: 8º recusado com a mensagem vermelha
- [x] `touch-action: none` no quadro; rolagem nativa funciona fora da grade
- [x] Rolagem automática no arrasto por toque
- [x] Caminho de dois cliques continua funcionando
- [x] `INSTRUCAO` descreve o arrasto e a reserva
- [x] Sem erro de console
- [x] `npm run build` código 0
