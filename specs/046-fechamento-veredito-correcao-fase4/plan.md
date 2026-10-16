# Plan: Fechamento do veredito da correção da fase 4

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, React 19, Firebase Spark). Não escolhe stack nova, não instala dependência.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/lib/correcao.js` | `mesclarCorrecao` e `decidirVeredito` puros (a lógica que estava na página vira testável), `indiceEscolasPorId`, `campusDaEquipe` como fonte única do campus |
| `src/lib/correcao-firestore.js` | `salvarCorrecao` em `runTransaction` (merge real, devolve o estado mesclado) e `ouvirDistribuicao` (`onSnapshot` do doc único) |
| `src/app/correcao/page.jsx` | Aba travada (Opção A), rascunho em `localStorage`, campus oficial, `autor` = email, consumo das funções puras |
| `src/app/admin/dashboard/page.jsx` | Paridade do campus: troca o trecho inline por `campusDaEquipe` + `indiceEscolasPorId` |
| `docs/DATABASE.md`, `docs/BUSINESS_RULES.md`, `docs/KNOWN_ISSUES.md` | Schema novo (`criteriosPorCorretor`), regra de acesso por aba, verificação manual das regras do console |
| `specs/046-fechamento-veredito-correcao-fase4/` | Spec / plan / tasks / checklist |

Sem arquivo novo em `src/lib/firebase.js`, `AuthContext`, `tarefas/portfolio-artistico/*`, `criterios.js`, `gravarNota`, `distribuir`.

## Reuso (sem duplicar)

- `campusDaEquipe` e `normalizar` de `@/lib/correcao` — o admin passa a usar a função que já existia e estava órfã.
- `precisaTerceira`, `escolherTerceiro`, `notaFinal` — inalterados; só viram entrada de `decidirVeredito`.
- `gravarNota` e `salvarVeredito` de `correcao-firestore.js` — inalterados.
- `CRITERIOS`, `NIVEIS`, `somar`, `pendentes` de `@/lib/criterios` — inalterados.

## Decisão do estado

`correcoes/fase4/correcoes/{equipeId}` continua **um doc por equipe** (não um por corretor): é o que mantém uma escrita por envio em vez de duas e o que faz a query da aba continuar com filtro simples. O que muda é a forma:

| Campo | Antes | Depois |
|---|---|---|
| `enviados` | array sobrescrito | array somado dentro da transação |
| `notas` | `{ [corretorId]: 0-100 }` | igual (o merge do Firestore já somava mapas) |
| `criterios` | um object, último a escrever ganha | **removido**; vira `criteriosPorCorretor: { [corretorId]: { [criterioId]: nivel } }` |
| `zerados` | idem | **removido**; vira `zeradosPorCorretor: { [corretorId]: [criterioId] }` |
| `autorUid` | — | email da conta que enviou |

Por que não usar `arrayUnion`: ele resolveria o `enviados`, mas `criteriosPorCorretor` exige ler o doc dentro da transação de qualquer forma para o `notas`/`enviados` virarem a decisão do veredito. Uma transação só, mais simples de raciocinar.

**Leitura legada.** `correcoes` gravados pela versão anterior têm `criterios`/`zerados` no topo, sem dono registrado. Só são usados quando `enviados` contém o corretor logado (o que prova que ele foi o último a escrever); nos demais casos o rascunho anterior é descartado, porque those respostas eram de outra pessoa e mostrá-las contaminaria a correção.

## Fechamento do veredito

`decidirVeredito({ atrib, notas, campus, carga })` — puro, sem I/O:

1. `registrados` = corretores de `atrib` com nota numérica.
2. `0 ou 1` → `aguardando-par`.
3. `2` com divergência ≥ 20 **e nenhum 3º já designado** (`atrib.length === 2`) → `escolherTerceiro` → `aguardando-terceira`.
4. resto → `fechado` com `notaFinal(valores)`.

O passo 3 ganha a trava `atrib.length === 2` que não existia: sem ela, um envio repetido enquanto o 3º professor ainda não respondeu poderia designar um **4º** corretor, porque `escolherTerceiro` só excluía quem já havia enviado.

A página fica fina: chama `decidirVeredito`, se não for `fechado` grava o veredito e avisa; se for, chama `gravarNota` e grava o veredito com o delta.

## Draft local

`localStorage['correcao-draft:{equipeId}:{corretorId}']`, escrita com debounce de 800 ms (mesmo relógio de hoje), lida na montagem do painel, apagada no "Enviar Correção". Ordem de precedência ao abrir um portfólio: rascunho local → `criteriosPorCorretor[corretorId]` → `criterios` legado **se** `enviados` inclui o corretor.

`localStorage` não tem cota e não é transacional, então o banco continua sendo a única fonte de verdade do que foi **enviado**.

## Opção A — aba travada

`aba` deixa de ser estado: é `corretor.id`, e o `Board` só renderiza quando `corretor` existe (o aviso "não encontramos seu nome na comissão" continua igual). O `<nav>` das 7 abas sai e vira uma faixa de identificação do corretor com o nome, o campus proibido e o tamanho da fila dele. Como a aba é fixa, `notas[e.id]?.enviados.includes(aba)` volta a significar "eu já enviei" sem ambiguidade, e `porColuna` segue igual.

`autorUid` = `sessao.email` (não o `uid`: o campo é lido por humanos no admin). `gravarNota` recebe esse valor em `corrigidoPor`.

## Fila ao vivo

`ouvirDistribuicao(cb, onErro)` = `onSnapshot` do doc `correcoes/fase4/distribuicao/atual`. Um documento, uma query — dentro do orçamento do Spark e fora do "sem listener de coleção". O `useEffect` que hoje faz `getDoc` da distribuição passa a assinar; a lista de equipes continua recarregando por `aba`, que agora nunca muda, então o efeito de carga roda uma vez.

## Risco Spark

Escritas no pior dia: 242 portfólios × 2 corretores + ~30% com 3º ≈ **~630 submissions** + o mesmo número de transações de veredito + `gravarNota` nas fechadas. Ordem de grandeza **~1,5 mil escritas/dia**, contra o teto de 20 mil. Antes eram ~12–18 mil. Leituras: as mesmas de hoje (1 doc + 1 query + 1 `getDoc` por equipe da fila, ~70 por fila).

## Auth

`authUser.uid` do Firebase revalida a sessão (já existia via `onAuthStateChanged`); o `localStorage` só guarda preferências. Nenhum segredo novo, nenhuma chamada a `/api`.

## Docs a atualizar

`docs/DATABASE.md` (§2.5 `correcoes`: campos novos, remoção do `criterios`/`zerados` no topo, correção da premissa errada sobre a query da aba), `docs/BUSINESS_RULES.md` (§ correção do Portfólio: acesso preso na aba do logado e rascunho local) e `docs/KNOWN_ISSUES.md` (regras do console que precisam ser verificadas à mão, já que não há `firestore.rules` no repositório).