# Spec: Modal do DVD na tarefa Charadas (fase 3)

| Campo | Valor |
|---|---|
| Slug | `032-modal-dvd-charadas` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

A `031` amarrou a animação de DVD à **renderização dos tiles** da grade: cada `IconeEnigma` nasce com `--dvd-delay = delayMs + index * staggerMs` e a capa gira sozinha ao carregar a página. O resultado é uma cascata de 20 DVDs abrindo antes de o aluno ler qualquer charada — a animação virou ruído de fundo e o grid deixou de ser legível.

O aluno precisa de duas leituras distintas: (1) ver os 20 enigmas fechados para escolher qual abrir; (2) ao escolher, ver **um** DVD abrir, grande, com a charada escrita no papel pautado do verso da tampa. A animação 3D está visualmente aprovada (perspectiva, `preserve-3d`, `backface-visibility`, `rotateY(0 → -180deg)`, lombada no eixo real) e **não** deve ser reescrita — só mudar de gatilho e de lugar.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`) — mesmo acesso à prova que o aluno, se membro ativo
- [ ] Admin principal — nada muda
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `admin/questoes`, `resumo-fase`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`. Não toca `persistirResposta`, `alocacaoCompleta`, `calcularPontosTarefa`, `CAPACIDADES`, `escolherOpcao`, `colocarNaPrateleira`, `removerDaPrateleira`, `selecionadoId`, `alocados`, `ativo`, `status`, `locked`. Não instala dependências. Não usa o Firebase de suporte. Não redesenha a estante, a alocação nem a transação.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Capa fechada | Attached no `button` de cada tile da grade, em 4:3 com a tampa ocupando a metade direita e a metade esquerda vazia | Só o papel pautado (verso), dentro do modal, no lado esquerdo da tampa aberta |
| Gatilho da animação | `animation-delay` por tile no mount: `delayMs + index * staggerMs` (cascata de 20) | Montagem do modal. Sem `index`, sem `staggerMs`; `delayMs` é só a pausa antes da rotação, dentro do modal |
| Estado da grade ao carregar | 20 caixas de DVD que abrem sozinhas | 20 quadrados `?` estáticos, sem qualquer animação |
| Grid | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (drift da `031`, que pede 10 + 10) | `grid-cols-5 sm:grid-cols-10`, proporção `240/312` do `icone-enigma.jpeg` |
| Modal | Barra de título com a charada + `×` no canto; ilustração `midia-*.jpg` dividida em duas metades com chips “Opção A.” / “Opção B.” | DVD como foco: 4:3 grande, canto escuro, tampa girando. Charada no papel pautado. Metades do DVD = A/B. Botão “Fechar” em tira própria, sem título |
| Fechar | `×` na barra de título / clique no fundo | `×` dedicated no canto superior direito + `Esc` + clique no fundo; modal desmonta, grade volta ao normal |
| Reabrir | — | Cada abertura remonta o palco → `FECHADO → ABRINDO → ABERTO` do zero |
| Opção A/B | Escrever `enigmas.<id>.opcao` (preservado) | Idem, agora nas duas metades do DVD; o clique na metade esquerda = A, direita = B, igual ao PDF |

## Firestore

**Leituras:** nenhuma nova. Path do participante segue com 3 `getDoc` (equipe, resposta, fase). Zero full scan. Escolas: nenhuma.

**Writes:** nenhuma nova. `persistirResposta`, dual-write (`respostas/tarefa_{faseId}` + mapas em `equipes`), `runTransaction` + `increment`, `df` só na entrega e `entregue` imutável: **inalterados**. `enigmas.<id>.opcao` continua sendo gravado pelos mesmos dois botões de metade.

## Required reading

1. `Specs/031-tarefa-charadas/spec.md`
2. `src/app/tarefas/charadas/page.jsx`
3. `src/app/tarefas/charadas/config.js`
4. `src/app/globals.css`
5. `public/dvd-aberto.png`, `public/dvd-fechado.png`

## Critérios de aceite

- [x] Carregar a página: 20 quadrados `?`, nenhum DVD, nenhuma animação, nenhum `animation-delay` em cascata, nada abre sozinho
- [x] Grade em 10 + 10 (5 colunas no mobile, sem overflow em 375 px), proporção `240/312`, tile selecionado com anel `#82181A` e tile alocado com opacidade
- [x] `DVD_ANIM` sem `staggerMs`; `delayMs` só a pausa interna do modal
- [x] Clicar no quadrado abre o modal com o DVD **fechado** (frente/capa visível)
- [x] Tampa gira em 3D por `transform` (`rotateY(0deg) → rotateY(-180deg)`), ~1,4 s, easing suave, terminando igual a `public/dvd-aberto.png`
- [x] Lombada em `DVD_GEO.eixoX` (`50.518%`), nunca 50%: a tampa não desliza
- [x] Charada escrita no papel pautado do verso da tampa; sem título de charada na barra superior
- [x] Sem “Opção A” / “Opção B” dominando: o clique é nas duas metades do DVD, com chips discretos no rodapé de cada metade
- [x] `escolherOpcao` continua gravando `enigmas.<id>.opcao`; `locked` (entregue / `correcao`) continua bloqueando
- [x] Fechar (botão, `Esc` ou clique no fundo) desmonta o modal; a grade volta ao normal e nada abre sozinho
- [x] Reabrir reinicia a sequência do estado fechado
- [x] 4:3 preservado em desktop, notebook, tablet e celular; sem distorção e sem cortar o DVD
- [x] `prefers-reduced-motion`: tampa já aberta, sem animação
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0

## Princípios da constitution aplicáveis

Free Tier (só `getDoc` no path da equipe/fase), isolamento Firebase (só `@/lib/firebase`), atomicidade (`runTransaction`/`increment`), `entregue` imutável, dual-write legado, `'use client'` + `Suspense`, sem wrappers novos, imagens locais em `public`, diff mínimo.

## Drift registrado

- `031` descreve o detalhamento como “comando em cima; ilustração dividida em duas metades clicáveis”. O comando migrou para o papel pautado do DVD e a ilustração `midia-*.jpg` saiu do modal (a página `modal.png` aprovada é a do layout antigo). `MIDIA_SRC` e `ENIGMAS[].tipoMidia` continuam em `config.js` como dados, sem uso na UI.
- `031` pede grade 10 + 10; o código estava em 1/2/3 colunas. Esta spec restaura o 10 + 10.
