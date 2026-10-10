# Spec: Sistema de correção da tarefa Portfólio Artístico (fase 4)

| Campo | Valor |
|---|---|
| Slug | `044-correcao-portfolio` |
| Status | aprovada |
| Firebase | principal |

## Problema / valor

A fase 4 entrega um portfólio que hoje **não é corrigido**: a spec 042 gravou a entrega com `peso: 0` e deixou "correção é feita pela banca" sem sistema. Os 7 professores da comissão (Glayds, Leonardo, Maxsuel, Stênio, Fabrício, Cristina, Lício) corrigem hoje em planilha, com distribuição balanced à mão e sem rastro em banco.

Esta spec entrega a página `/correcao`: acesso restrito por link, conta própria no banco principal, board com uma aba por professor e 5 colunas, e o painel de correção dos 47 critérios de `public/Avaliação_dos portfólio_DHPB_EDITAVEL.xlsx` com nota automática de 0 a 100 pontos. Fecha o gap que a spec 042 e a 043 deixaram aberto.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal — gera a distribuição e monitora
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)
- [x] **Comissão corretora** — 7 professores, contas criadas em `/correcao`

## Escopo negativo

Não altera a página de entrega `tarefas/portfolio-artistico`, nem `PortfolioWall`, nem `config.js`, nem `questao`, `criar-equipe`, `montagem-equipe`, `resumo-fase`, `respostas-tab`, `admin/ranking`, `admin/questoes`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, chat. Não altera a correção das fases 1–3. Não instala `react-trello` nem nenhuma dependência nova. `aprovadoAte` intocado.

## Fonte da pontuação

`public/Avaliação_dos portfólio_DHPB_EDITAVEL.xlsx` traz 47 critérios em 11 blocos com pesos fixos que somam **100 pontos**. O bloco de fórmulas do Excel é inconsistente e o total `=SUM(F3:F43)` ignora o bloco das linhas 46–49. Esta spec **não copia o Excel**: reconstrói os pesos e aplica a regra do `Explicacao-Sistema-Correcao.pdf` de forma uniforme.

Escala por peso `p`, confirmada com o solicitante:

| Nível | Fator | Pontos |
|---|---|---|
| Concordo Totalmente | 1,00 | `p` |
| Concordo Parcialmente | 0,75 | `0,75p` |
| Neutro / não tenho certeza | 0,50 | `0,50p` |
| Discordo Parcialmente | 0,25 | `0,25p` |
| Discordo Totalmente | 0 | `0` |

Regra do cabeçalho do Excel (B1), preservada: item com imagem produzida por IA vale **0** independentemente do nível. Critério não respondido conta como 0 e bloqueia o fechamento.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Correção do portfólio | Não existe | `/correcao` (link direto, fora do admin) |
| Peso da entrega fase 4 | `peso: 0` (spec 042) | `peso` = nota final 0–100 |
| Distribuição de corretores | Planilha à mão | Determinística, respeita restrição de campus |
| Nota | Não existe | Média dos 2; 3ª correção se a divergência ≥ 20 |
| `df` | Não recebe a tarefa da fase 4 | `increment` de `notaFinal × fase.peso` |
| Sessão do corretor | Não existe | Firebase Auth, `browserLocalPersistence`, "manter conectado" ligado por padrão |

## Regras de negócio

**Corretores e campus.** Sete, com campus proibido: Glayds (Campina Grande), Leonardo (Picuí), Maxsuel (Monteiro), Lício (Cabedelo), Stênio, Fabrício e Cristina (João Pessoa). Um corretor **nunca** recebe portfólio de equipe do próprio campus. Campus vem de `equipe.escola` casada com `public/escolas-pb.json` por `escolaId` (INEP); sem match, sem restrição.

**Identidade.** O nome completo digitado no cadastro é normalizado (minúsculas, sem acento) e casado com a lista dos 7. Nome fora da lista: conta criada, board vazio com aviso. Sem código de convite (decisão do solicitante).

**Distribuição.** Determinística e estável: equipes ordenadas por `nomeLower`, round-robin sobre a lista de corretores elegíveis para o campus da equipe, pulando quem já corrigiu aquela equipe. Cada portfólio vai para 2 corretores distintos; o balanceamento busca a carga por professor da tabela do PDF (44/43 em Pública Médio). Nenhum corretor se autoatribui.

**3ª correção.** Quando as 2 primeiras notas diferem em **≥ 20 pontos**, o sistema designa sozinho um 3º corretor (mesma regra de campus, nunca um dos dois primeiros, menor carga primeiro). O veredito fecha automático: **descarta a menor das 3 notas e tira a média das 2 restantes**. Exemplo do solicitante: 80, 55, 70 → descarta 55 → (80+70)/2 = **75**.

**Nota final.** Com 2 notas: média simples. Com 3: média das 2 maiores. Arredondado a 2 casas (`round2`).

**Pontuação.** Ao fechar o veredito, `peso` da resposta passa a ser a nota final (0–100). `ni` da fase 4 soma `peso`, `di = ni × fase.peso` e `df` acumula — pelas mesmas regras de `calcularEquipe`. Delta idempotente: `delta = notaFinal − pesoAtual`; se 0, não grava.

## Firestore

**Leituras.** Path do participante: zero. `/correcao` lê `where('tipo','==','corretor')` com `limit` para resolver a identidade; `correcoes/fase4` com `where('corretoresUid','array-contains',uid)` e `limit` para o board; `equipes/{id}` individual no clique; `public/escolas-pb.json` local para campus. Admin: `equipes` com `where('edicaoId','==',edId)` e `fases` com `orderBy('dataInicio')` + `limit`. Sem `collectionGroup` e sem listener em coleção.

**Writes.** Nova coleção top-level `correcoes` (doc por equipe, id = `equipeId`): `fase4/distribuicao` (uid de quem corrige, `versao`), `fase4/correcoes/{uid}` (notas, critérios, nota, data). Cadastro: `users/{uid}` com `tipo: 'corretor'`, `nomeCompleto`, `campus`, `ativo`. Veredito: `runTransaction` em `equipes/{id}` relendo ao vivo + `increment` em `df`, `pontuacoes.{faseId}.ni/.di` (doc e mapa) + `set` merge em `respostas/tarefa_{faseId}`; dual-write legado dos mapas preservado. `membro-index` e `aprovadoAte`: nenhum impacto.

## Required reading

1. `docs/CONSTITUTION.md`
2. `specs/042-tarefa-portfolio-artistico/spec.md`
3. `specs/043-admin-nota-tarefa-fase3/spec.md`
4. `src/app/admin/page.jsx`
5. `src/app/tarefas/portfolio-artistico/PortfolioWall.jsx`
6. `src/lib/fixarNotaTarefaFase3.js`

## Critérios de aceite

- [x] `/correcao` com login e cadastro (email, senha, nome completo) no visual do admin; "manter conectado" ligado por padrão
- [x] Header mostra a conta logada e traz sair
- [x] Aba por professor; 5 colunas (Públicas Médio, Públicas Fundamental, Privadas Médio, Privadas Fundamental, Corrigidas)
- [x] Distribuição respeita campus em todas as atribuições, incluindo a 3ª correção
- [x] Painel abre o portfólio à direita e os 47 critérios à esquerda com seleção e soma automática
- [x] Escala 100/75/50/25/0 por peso; total máximo 100
- [x] Item zerado por IA vale 0
- [x] 3ª correção a ≥ 20 de divergência; veredito automático descarta a menor e mede as 2 maiores
- [x] Nota final vira `peso` da resposta e soma em `df`/`pontuacoes.fase4` por transação + `increment`; idempotente
- [x] Queda: `tarefas/portfolio-artistico` entrega e lê igual
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs` atualizados (rota nova + schema novo)

## Princípios da constitution aplicáveis

Free Tier (`where` + `limit` em toda leitura nova; nada de scan); atomicidade (`runTransaction` + `increment` para `df`/`ni`/`di`); dual-write legado preservado; `entregue` continua imutável no path do participante — a correção escreve em `correcoes/`, não mexe na entrega; isolamento Firebase (só `@/lib/firebase`); `'use client'` + `Suspense` onde houver `useSearchParams`; Cloudinary via `optimizeCloudinaryUrl`; segredos só em `src/app/api/*`; sem dependência nova; SDD (spec 044).