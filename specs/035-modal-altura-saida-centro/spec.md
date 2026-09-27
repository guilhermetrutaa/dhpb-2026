# Spec: Modal cabe na tela, saída pelo centro, estante só depois do ORDENAR (fase 3)

| Campo | Valor |
|---|---|
| Slug | `035-modal-altura-saida-centro` |
| Status | implementada |
| Firebase | principal |

Continuidade da `034-faixa-saida-ordenar`. Três correções apontadas em print do desktop.

## Problema / valor

1. O modal tinha largura fixa (`min(96vw, 1100px)`) e altura livre. A 1100px de largura o conteúdo dava **1009px de altura** (palco 825 + faixa 120 + folga 24 + padding 40) e estourava qualquer viewport abaixo de ~1050px: a faixa encostava no topo, cortada, e os rótulos “Opção A”/“Opção B” encostavam embaixo, cortados. A largura precisa ser derivada da **altura** disponível, não só da viewport.
2. Na saída, a caixa encolhia e descia, mas ficava **na metade direita** do palco: a tampa fechada pousa em `eixoX + folha/2 = 74,33%` da largura do palco, então “ir para o meio” exigia um deslocamento horizontal que não existia.
3. A alocação na estante era livre desde o primeiro minuto. A ordem cronológica só faz sentido depois que as capas estão visíveis, então a estante precisa ficar trancada até o ORDENAR.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`) — mesmo acesso, mesmas interações
- [ ] Admin principal — nada muda
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Decisões humanas

- O modal encolhe para caber; o DVD continua grande e confortável, não vira miniatura.
- A caixa fechada vai para o **meio da tela** antes de sair.
- **Só depois do ORDENAR** é possível colocar na estante.

## Escopo negativo

Não altera `persistirResposta`, `alocacaoCompleta`, `calcularPontosTarefa`, `CAPACIDADES`, `escolherOpcao`, `removerDaPrateleira`, `selecionadoId`, `alocados`, `ativo`, `status`, `locked`, `enigmas[].opcao`, a transação, o dual-write, rotas ou schema. Não mexe na animação 3D de abertura, nem no arrasto, nem na virada do ORDENAR.

## As-is vs to-be

| Regra | No código hoje (034) | Depois desta spec |
|---|---|---|
| Largura do modal | `w-[min(96vw,1100px)]` | `min(96vw, 1100px, calc((100vh − 13.5rem) · 4/3), calc((100dvh − 13.5rem) · 4/3))` |
| Altura da faixa | `clamp(0.9rem, 2.4vw, 1.9rem)`, sem limite de linhas | `clamp(0.9rem, 2vw, 1.6rem)` + `line-clamp-[3]`, para a reserva de altura ser previsível |
| Saída: destino | `scale(0.24) translateY(22%)` — descia, não ia ao centro | `scale(0.24) translateX(calc(−1 · var(--dvd-desvio-fechado)))` |
| Saída: a faixa | some junto com a caixa, arrastada para a esquerda | `dvd-apagar` sai de cena em 300ms, antes do deslize |
| Arrasto antes do ORDENAR | permitido, alocava | `gesto.permitido = virados`: o arrasto não inicia, o cursor é `pointer` e o clique ainda abre o DVD |
| Clique na prateleira antes do ORDENAR | alocava | mensagem vermelha “Use o botão ORDENAR…” |
| `INSTRUCAO` | passo 1 marcava, passo 2 arrastava (na ordem inversa) | passo 1 abre e marca os 20, passo 2 ORDENAR, passo 3 arrasta as capas |

## Cálculo da altura

O palco é 4:3, então a largura que cabe é `(altura disponível) · 4/3`. A altura disponível sai de `100vh − 13,5rem`, onde 13,5rem (216px) cobre o padding do overlay (2×20px), a folga entre faixa e palco (12px) e a faixa com 3 linhas no tamanho máximo (≈150px). Medido:

| Viewport | Largura do modal | Altura total | Cabe |
|---|---|---|---|
| 1920×950 | 979px | 918px | sim |
| 1600×900 | 912px | 868px | sim |
| 1440×820 | 805px | 788px | sim |
| 1366×768 | 736px | 719px | sim |
| 1280×700 | 645px | 651px | sim |
| 375×720 | 360px (limitado por 96vw) | 540px | sim |

Ratio do palco conferido em cada tamanho: `1,33335 / 1,33336 / 1,33337 / 1,33333` contra o alvo `1,33333` — desvio máximo de 0,00003 (sub-pixel).

## Desvio da caixa fechada

`--dvd-desvio-fechado` é calculada no JSX a partir de `DVD_GEO`: `eixoX + folha.largura/2 − 50` = `50,518 + 23,8085 − 50` = `24,3265%`. Assim a lombada e a folha continuam sendo a única fonte da geometria; se algum dia a tampa mudar de posição, o deslize acompanha.

**Ordem das funções de `transform` importa.** Com `translateX(… ) scale(0.24)` a caixa terminava a **164px** fora do centro: o `translateX` é somado depois de a escala já ter puxado a caixa para perto do centro, então ela passava direto. Com `scale(0.24) translateX(…)` o deslocamento acontece no espaço pré-escala e a caixa pousa no meio. Medido com o relógio da página: caixa fechada em **+225px** do centro → termina em **+5px**.

## Firestore

**Leituras/writes:** nenhuma nova, nenhuma alteração. `virados` continua sendo estado de tela. O schema `enigmas`/`prateleiras` e as regras de `persistirResposta` seguem idênticos.

## Required reading

1. `specs/034-faixa-saida-ordenar/spec.md`
2. `src/app/tarefas/charadas/page.jsx`
3. `src/app/globals.css`

## Critérios de aceite

- [x] Nada encosta no topo nem embaixo: faixa, palco e rótulos A/B com folga em 6 tamanhos de tela, de 1920×950 a 375×720
- [x] 4:3 preservado (desvio máximo de 0,00003)
- [x] A caixa fechada vai para o meio da tela antes de sair (termina a 5px do centro)
- [x] A faixa some antes do deslize, sem ser arrastada para a esquerda
- [x] Antes do ORDENAR: cursor `pointer`, o arrasto não aloca e a estante fica vazia
- [x] Antes do ORDENAR: clicar no quadrado **continua** abrindo o DVD
- [x] Antes do ORDENAR: clicar na prateleira dá aviso vermelho
- [x] Depois do ORDENAR: cursor `grab`, aloca, reordena dentro do bloco e entre blocos
- [x] `INSTRUCAO` e o texto de apoio do botão descrevem a ordem certa
- [x] Sem erro de console e sem 404
- [x] `npm run build` código 0
