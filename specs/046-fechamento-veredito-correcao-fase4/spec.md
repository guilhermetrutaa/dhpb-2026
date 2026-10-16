# Spec: Fechamento do veredito da correção da fase 4 (bug do par que nunca fecha)

| Campo | Valor |
|---|---|
| Slug | `046-fechamento-veredito-correcao-fase4` |
| Status | aprovada |
| Firebase | principal |

## Problema / valor

A spec 044 entregou a página `/correcao`, a distribuição e o painel de 47 critérios — mas **o veredito nunca fecha**. O segundo corretor não enxerga a nota do primeiro, o sistema conclui que "faltou o par" e grava `aguardando-par` para sempre. Consequência: **a nota final nunca vira `peso`, nunca entra em `ni`/`di`/`df`, e o ranking não se move** — mesmo com os 7 professores corrigindo os 242 portfólios. A 3ª correção também nunca é acionada, porque o gatilho só é avaliado depois do par. Não existe tela no admin que revele isso (a spec 044 adiou o painel de conferência).

A spec 044 documentou em `docs/DATABASE.md` a premissa que causes o bug: *"a query da aba (`where('enviados','array-contains', uid)` + `limit`) já entrega o estado do par"*. Não entrega: o filtro é pelo corretor logado, então o doc de quem ainda não enviou fica invisível para o outro.

Junta-se a isso: o `enviados` (array) e o `criterios` (object) são **sobrescritos** no `setDoc(..., {merge:true})`, porque merge não soma arrays; o campus da 3ª correção vem de `equipe.cidade` enquanto a distribuição usa o município oficial da escola; o 3º corretor só vê a fila após recarregar a página; todos veem e podem escrever nas 7 abas dos colegas; e o autosave a cada 800 ms consome ~12–18 mil escritas/dia contra o teto Spark de 20 mil.

**Esta spec não muda a regra de negócio da correção** (2 corretores, 3ª em ≥ 20, veredito descarta a menor). Muda **como o estado é lido e gravado** para que o fluxo já especificado funcione de ponta a ponta.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)
- [x] **Comissão corretora** — 7 professores, contas em `/correcao`

## Decisões de escopo (com humano)

| Tema | Decisão |
|---|---|
| Regra de negócio da correção | **Nenhuma mudança.** 2 corretores por portfólio, 3ª correção em divergência ≥ 20, veredito final descarta a menor e mede as 2 maiores. Confirmado explicitamente pelo solicitante: *"tem que haver 2 correções do mesmo portfolio e se houver uma divergência de 20 pontos é enviado para 3ª correção"*. |
| Escopo da entrega | Pacote completo, **não** só a correção mínima do fechamento. Motivo declarado: sem as demais, o rastro da banca e o campus da 3ª correção continuam errados. |
| Identidade do corretor | **Opção A.** Cada professor fica preso na própria aba: não vê e não pode escrever nas abas dos colegas. Aba inicial deixa de ser `CORRETORES[0]` e passa a ser o `corretor` identificado pelo nome do cadastro. |
| Rastro de autoria | `corrigidoPor` e `autorUid` passam a registrar o **email da conta logada**, não a string da aba. Com a aba travada, `aba` e conta voltam a ser a mesma pessoa. |
| Rascunho | Sai do Firestore e vai para `localStorage`, chaveado por `equipeId + corretorId`. Só o clique em **Enviar Correção** grava no banco. Trade-off aceito: trocar de computador perde o rascunho não enviado. |
| Campus | `campusDaEquipe` de `@/lib/correcao` vira a **fonte única**, usada pela distribuição e pela 3ª correção. O admin passa a chamar a mesma função em vez do trecho inline. |
| Fila do 3º corretor | `onSnapshot` no **documento único** da distribuição. Sem listener de coleção (mantém a constitution). |
| Regras do Firestore | Não há `firestore.rules` no repositório e esta spec **não cria** um (fora do padrão do projeto). Fica registrado em `docs/KNOWN_ISSUES.md` como verificação manual no console, com o desenho exato exigido. |

## Escopo negativo

Não altera a página de entrega `tarefas/portfolio-artistico`, nem `PortfolioWall`, nem `config.js`, nem `questao`, `criar-equipe`, `montagem-equipe`, `resumo-fase`, `respostas-tab`, `admin/ranking`, `admin/questoes`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, chat. Não altera a correção das fases 1–3, nem `gravarNota`, nem `distribuir`, nem `criterios.js`, nem as regras de escala/3ª correção/veredito. Não cria `firestore.rules` (o projeto mantém as regras no console): revisar as regras é item manual, T11. Não converte correções já gravadas no layout da spec 044 — elas eram teste e são descartadas no primeiro envio novo. Não instala dependência nova. `aprovadoAte` e `membro-index` intocados.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Fechamento do par | `fecharVeredito` recebe o mapa local do corretor que acabou de enviar → 1 nota → `aguardando-par` eterno | `salvarCorrecao` devolve os mapas mesclados do banco; `decidirVeredito` decide com todas as notas |
| `enviados` (array) | Sobrescrito a cada envio (`["glayds"]` → `["stenio"]`) | Somado em transação |
| `criterios` / `zerados` | Sobrescritos — o 2º corretor apaga as 47 respostas do 1º | **Removidos**; `criteriosPorCorretor` / `zeradosPorCorretor`, uma divisória por corretor. Doc da spec 044 (só teste) é reescrito do zero |
| Coluna "Corrigidas" | Volta para a fila depois do reload, porque o doc deixou de ter o corretor em `enviados` | Persiste |
| Campus da 3ª correção | `normalizar(equipe.cidade)` na página | `campusDaEquipe(equipe, escolasPorId)` — mesmo da distribuição |
| Fila do 3º corretor | Só após F5 | `onSnapshot` no doc da distribuição |
| Abas | 7 abas editáveis para qualquer logado; `autor` = string da aba | Só a aba do logado; `autor` = email da conta |
| Rascunho | Autosave no Firestore a cada 800 ms | Autosave em `localStorage`; 1 write por envio |
| Query das correções | `where('enviados','array-contains', aba)` + `limit(500)` | Mantida, mas como **cache de exibição** — o fechamento nunca depende dela |

## Firestore

**Leituras.** Nenhuma query nova no path do participante. `/correcao` continua com: 1 doc da distribuição (agora via `onSnapshot`, que custa 1 read por snapshot), 1 query filtrada `where('enviados','array-contains', corretorId)` + `limit(500)` (inalterada, só exibição) e 1 `getDoc` por equipe do corretor. `salvarCorrecao` faz **1 read dentro da transação** (o próprio doc que vai reescrever) — sem read extra no cliente, porque a transação devolve o estado mesclado. `public/escolas-pb.json` local, 1 fetch por sessão, indexado por `escolaId`. Sem `collectionGroup`, sem `getDocs(collection)` sem filtro.

**Writes.** `correcoes/fase4/correcoes/{equipeId}` passa a ser escrito por `runTransaction` (merge de `enviados`/`notas`/`criteriosPorCorretor`/`zeradosPorCorretor`), em vez de `setDoc` avulso — fecha a corrida entre dois corretores que enviam no mesmo instante. `correcoes/fase4/vereditos/{equipeId}` inalterado. `gravarNota` inalterado: `runTransaction` em `equipes/{id}` + `increment` em `df`/`pontuacoes.fase4.ni`/`.di` + dual-write legado dos mapas. Impacto em `df`: **o mesmo da spec 044**, agora efetivamente executado. `membro-index` e `aprovadoAte`: nenhum.

**Conta.** Por dia de correção: escritas caem de ~12–18 mil para **~700** (242 portfólios × 2–3 corretores, 1 write cada + 1 transação de veredito). Leituras inalteradas, ~500 por varredura completa das 7 filas.

## Required reading

1. `docs/CONSTITUTION.md`
2. `specs/044-correcao-portfolio/spec.md`
3. `src/lib/correcao.js`
4. `src/lib/correcao-firestore.js`
5. `src/app/correcao/page.jsx`
6. `src/app/admin/dashboard/page.jsx`

## Critérios de aceite

- [ ] Dois corretores no mesmo portfólio: o 2º envio enxerga a nota do 1º e o veredito **fecha** com a média
- [ ] Divergência ≥ 20 entre as 2 notas: o sistema designa sozinho o 3º corretor, fora do campus da equipe e fora dos 2 primeiros, e o veredito fica `aguardando-terceira`
- [ ] 3ª nota recebida: veredito fecha pelas 2 maiores (80, 55, 70 → 75) e `gravarNota` roda
- [ ] Nota final entra em `peso`, `ni`, `di`, `df` por transação + `increment`, idempotente
- [ ] `enviados` soma em vez de sobrescrever; coluna "Corrigidas" persiste após reload
- [ ] `criteriosPorCorretor` / `zeradosPorCorretor`: o 2º corretor não apaga as respostas do 1º
- [ ] Campus da 3ª correção vem da mesma fonte da distribuição (município oficial por `escolaId`)
- [ ] 3º corretor vê o portfólio sem recarregar a página
- [ ] Cada professor só vê e só escreve na própria aba; `autor` = email da conta logada
- [ ] Rascunho sobrevive a reload em `localStorage` e some do banco até o clique em "Enviar"
- [ ] Critério não respondido continua bloqueando o envio
- [ ] Cota Spark: nenhuma query nova sem filtro no path do participante
- [ ] Autotests cobrem par, 3ª correção, veredito e mesclagem sem sobrescrita
- [ ] `npm run build` código 0
- [ ] Docs em `/docs` atualizados (schema de `correcoes`, regra de acesso, regras do console)

## Princípios da constitution aplicáveis

Free Tier (`where` + `limit` em toda leitura; nada de scan; listener só em documento único); duas instâncias Firebase (só `@/lib/firebase`); atomicidade (`runTransaction` na correção e no veredito, `increment` em `df`/`ni`/`di`); dual-write legado preservado; `entregue` continua imutável no path do participante — a correção escreve em `correcoes/`, não mexe na entrega; `'use client'` + `Suspense` já presentes; segredos só em `src/app/api/*`; sem dependência nova; SDD (spec 046).