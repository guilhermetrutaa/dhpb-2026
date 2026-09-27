# Spec: Faixa da pergunta, saída animada, vão vazio e ORDENAR (fase 3)

| Campo | Valor |
|---|---|
| Slug | `034-faixa-saida-ordenar` |
| Status | implementada |
| Firebase | principal |

Continuidade das `032` (modal do DVD) e `033` (arrastar para a estante). Quatro correções de apresentação e fluxo.

## Problema / valor

1. A pergunta vivia impressa no papel pautado, no tamanho do papel. Não lia como pergunta: lia como texto de formulário. E o papel pautado é o lugar natural da **alternativa escolhida**, não do enunciado.
2. Sair do modal era um corte seco. ODVD fechava e sumia, sem gesto.
3. Arrastado para a estante, o quadrado ficava com `opacity-35`: um "?" fantasma ocupando a vaga. O lugar devia ficar vazio.
4. A alocação era cega: 20 caixas iguais com "?", sem nenhuma pista de qual filme era qual. A equipe só podia ordenar por ids.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`) — mesmo acesso, mesmas interações
- [ ] Admin principal — nada muda
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Decisões humanas

- **Opções A/B continuam como estão**: as duas metades do DVD, com chip no rodapé. A única novidade do modal é a faixa da pergunta em cima.
- **O papel pautado passa a receber a alternativa escolhida**, não a pergunta. Pergunta e opção são textos diferentes.
- **ORDENAR libera com alternativa escolhida nos 20 enigmas** (não com alocação na estante).
- **Depois do flip os tiles ficam com as capas** e é aí que a ordem cronológica é montada na estante.

## Escopo negativo

Não altera `persistirResposta`, `alocacaoCompleta`, `calcularPontosTarefa`, `CAPACIDADES`, `escolherOpcao`, `removerDaPrateleira`, `selecionadoId`, `alocados`, `ativo`, `status`, `locked`, `enigmas[].opcao`, a transação, o dual-write, rotas ou schema. Não mexe na animação 3D de abertura da `032` nem no arrasto da `033`. Não instala dependências.

## As-is vs to-be

| Regra | No código hoje (033) | Depois desta spec |
|---|---|---|
| Pergunta | impressa no papel pautado (`.dvd-texto`) | faixa `.charada-faixa` acima do DVD: moldura `#2b1608` 6px, painel dourado em gradiente, texto `#5e1a0e` negrito centralizado, `clamp(0.9rem, 2.4vw, 1.9rem)` |
| Papel pautado | recebia a pergunta | recebe o texto da alternativa escolhida; vazio enquanto não houver escolha |
| Sair do DVD | corte seco (`setDetalheId(null)`) | `dvd-saindo`: a tampa fecha (`.dvd-fechar`, 520ms) e só depois a faixa + o palco encolhem para o meio e somem (480ms). Total 1000ms |
| Saídas | `Esc` e clique fora | as mesmas, agora animadas; `prefers-reduced-motion` fecha na hora |
| Tile alocado | `opacity-35` (quadrado fantasma) | sem imagem: só o vão tracejado, na mesma linguagem dos slots vazios da estante |
| ORDENAR | não existia | botão abaixo da grade, `disabled` até os 20 terem alternativa; contador `n/20` no texto de apoio |
| Virada | não existia | `.dvd-virado .dvd-vira` gira o quadrante no próprio eixo (620ms, cascata de 35ms) e revela a capa |
| Capas | não existiam | `public/tarefas/charadas/capas/capa-01.jpg`…`capa-20.jpg` (provisórias) + `LEIA-ME.md` |
| Ghost do arrasto | sempre o `icone-enigma.jpeg` | a capa, quando os tiles estão virados |
| Estante depois do flip | mostra o `?` | mostra a capa do enigma alocado |
| Reordenar | Tirar (×) e colocar de novo | soltar o quadrado **no slot** insere na posição (`moverParaPrateleira(bloco, indice, id)`) |

## Armadilha do `reverse` (medida, não suposta)

`animation-direction: reverse` em `.dvd-capa` **não reinicia** a animação: ao trocar só a duração/direção, o browser preserva o `currentTime` da animação anterior (1750ms da abertura) e a tampa salta direto para o fim. Confirmado no browser: `getAnimations()[0].state === 'finished'`, `currentTime === 2433` aos 200ms do fechamento.

Por isso o fechamento usa keyframes próprios, `dvd-fechar` (`rotateY(-180deg) → rotateY(0deg)`). Nome novo = animação nova = `currentTime` zerado. Medido com os tempos de produção: 180° → 0° em 520ms, e a faixa só começa a encolher depois.

Mesma lição vale para o ORDENAR: `virados` não muda de valor numa segunda ida no botão, então a animação não recomeçaria. Um contador `viradas` no `key` da grade remonta os tiles e refaz a virada.

## Firestore

**Leituras/writes:** nenhuma nova, nenhuma alteração. `escolherOpcao` segue gravando `enigmas.<id>.opcao`; a alocação e a reordenação seguem por `persistirResposta`, com a mesma transação, o mesmo dual-write e o mesmo `entregue` imutável. `virados` e `viradas` são estado de tela, não vão para o Firestore.

## Required reading

1. `specs/033-arrastar-enigma-estante/spec.md`
2. `src/app/tarefas/charadas/page.jsx`
3. `src/app/tarefas/charadas/config.js`
4. `src/app/globals.css`
5. `public/tarefas/charadas/capas/LEIA-ME.md`

## Critérios de aceite

- [x] Faixa com a pergunta acima do DVD, no estilo da referência (moldura escura, painel dourado, texto vinho negrito centralizado)
- [x] Papel pautado mostra a alternativa escolhida; fica vazio sem escolha
- [x] Sair fecha a tampa com rotação 3D e depois leva a faixa + o DVD ao centro até sumir
- [x] `Esc`, clique fora e clique no fundo usam a mesma saída animada
- [x] `prefers-reduced-motion` fecha sem animação
- [x] Tile alocado fica com o vão vazio tracejado, sem "?" translúcido
- [x] ORDENAR desabilitado com contador `n/20`; libera com os 20 marcados
- [x] Clicar em ORDENAR gira os quadrados no próprio eixo e revela as capas
- [x] Segunda ida em ORDENAR repete a animação
- [x] `public/tarefas/charadas/capas/` com 20 capas 3:4 e LEIA-ME
- [x] Arrastar depois do flip move a capa; o ghost mostra a capa
- [x] Soltar no slot reordena dentro do bloco (para a frente e para trás)
- [x] Limite de capacidade continua barrando com a mensagem vermelha
- [x] Sem 404 de imagem e sem erro de console
- [x] `npm run build` código 0
