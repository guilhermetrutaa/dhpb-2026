# Prompt e contrato para criar tarefas do DHPB 2026

Cole este arquivo (ou as seções marcadas) no chat da IA que for **implementar uma tarefa interativa**.

**Não use** `MANUAL-PROGRAMADOR-TAREFAS.md`. Ele está obsoleto: a fórmula de `Di` está errada (`pontos * Pi` sem dividir por `notaMaxima`) e o padrão de escrita (só `updateDoc` no documento da equipe, sem transação nem subcoleção) **não é o código atual**.

A fórmula de pontuação da olimpíada **pode mudar**. Até haver spec nova, use o contrato abaixo (igual ao das questões objetivas em `src/app/questao/page.jsx`).

---

## 1. Leitura obrigatória (nessa ordem)

1. `docs/PROJECT_CONTEXT.md` — restrições Spark, matriz §3.2.
2. `docs/CONSTITUTION.md` — regras inegociáveis.
3. `docs/CODE_CONVENTIONS.md` — rotas, Poppins, cores, `'use client'`, `Suspense`.
4. `docs/DATABASE.md` — schema de `edicoes/.../fases`, `equipes`, `respostas`, `pontuacoes`.
5. Este arquivo.

Não explore `src/app` inteiro. Para tarefas, o suficiente é: este contrato, `docs/CODE_CONVENTIONS.md`, e (como referência de entrega) o bloco `runTransaction` em `src/app/questao/page.jsx` (~linhas 523–601). Demos visuais sem Firestore: `src/app/provas-antigas/viagem-no-tempo/page.jsx` e `src/app/provas-antigas/recorte-iconografico/page.jsx`.

---

## 2. O que é uma “tarefa” neste site

O painel `/admin/questoes` **não cria a atividade**. Ele só grava no documento da fase:

- `tarefa.titulo` (string)
- `tarefa.pontuacao` (número = máximo da tarefa)
- `tarefaUrl` (path interno, ex: `/tarefas/cruzadinha-fase-1`)

A atividade é uma **página Next.js** em `src/app/tarefas/<slug>/page.jsx`.

Fluxo:

1. Organizadores definem regras e layout (print).
2. Dev cria a página em `src/app/tarefas/<slug>/`.
3. Admin preenche título, URL `/tarefas/<slug>` e pontuação máxima.
4. Aluno abre a fase em `/resumo-fase` e clica no cartão da tarefa.
5. A página entrega com `runTransaction` + `increment`, igual à questão.

`notaMaxima` da fase é **manual** no dashboard. Ela deve ser a soma do máximo das questões **mais** `tarefa.pontuacao`. Se a fase 1 tiver 8 questões × 5 pontos + tarefa 10, `notaMaxima` = **50**. Se ficar 40, `Di` infla.

---

## 3. Design e Next.js (obrigatório)

- `'use client'` no topo da página interativa.
- `useSearchParams()` **sempre** dentro de um componente envolvido por `<Suspense>`.
- Fonte `Poppins` (400/500/600/700) via `next/font/google`.
- Cores: fundo `#ffffff`, vinho `#82181A`, hover `#631214`, texto preto.
- Status: entregue `#CCFFE6` / verde; rascunho `#F8E3E3`; pendente `#F7F7F7`.
- Botões: `transition-colors`, `cursor-pointer`.
- Pastas de rota em `kebab-case`. Imports com alias `@/`.
- Imagens Cloudinary: `optimizeCloudinaryUrl` de `@/lib/cloudinary`.
- Firebase da olimpíada: `import { db } from '@/lib/firebase'`. **Nunca** `@/lib/support/firebase`.
- Sem wrappers novos, sem libs extras, sem `npm install` sem pedido explícito.

---

## 4. Query params (contrato de URL)

A página deve ler:

- `equipeId`
- `faseId`
- `edicaoId`

Exemplo: `/tarefas/cruzadinha-fase-1?equipeId=...&faseId=...&edicaoId=...`

O admin cadastra só o path (`/tarefas/cruzadinha-fase-1`). Quem deve **acrescentar** os params é o link em `src/app/resumo-fase/page.jsx`. Se o link ainda for só `fase.tarefaUrl`, a tarefa não sabe de qual equipe é — isso é bug do resumo, não da página da tarefa. A página deve recusar seguir sem os três params.

Auth: `useAuth()` de `@/context/AuthContext`. Sem sessão → `/login`. Confirme que o usuário é membro ativo da equipe (`equipes/{equipeId}.membros`) com `getDoc` pontual. Sem `getDocs` da coleção `equipes`.

Acesso à prova: só se a fase estiver `aberta` ou `correcao` (`edicoes/{edicaoId}/fases/{faseId}`). Em `correcao`, a tarefa fica somente leitura.

---

## 5. IDs de resposta e pontuação

Use **um documento de resposta por fase**, com id fixo:

```
equipes/{equipeId}/respostas/tarefa_{faseId}
```

Espelhe no mapa legado: `equipes.respostas.tarefa_{faseId}`.

O resumo hoje lê `respostas['tarefa']` (id literal `tarefa`). **Não invente outro id sem alinhar o resumo.** Preferência:

- Gravar `tarefa_{faseId}` **e**, se o resumo ainda só olhar `tarefa`, também atualizar `respostas.tarefa` no mapa **ou** ajustar o resumo para `tarefa_${faseId}`.
- Uma fase tem no máximo uma tarefa. Não use o id nu `tarefa` se houver risco de duas fases no mesmo documento de equipe.

Pontuação (dual-write obrigatório, constitution §8):

- Subcoleção: `equipes/{equipeId}/pontuacoes/{faseId}` com `ni`, `di`
- Mapa: `equipes.pontuacoes.{faseId}.ni` / `.di`
- `equipes.df`

Ranking lê o **mapa** `equipes.pontuacoes` e `df`.

---

## 6. Fórmula (não use o manual antigo)

```
Ni  = soma dos pesos das questões entregues + pontos da tarefa nesta fase
Di  = (Ni / notaMaxima) * peso
Df  = soma dos Di de todas as fases
```

No código isso é **incremental** (igual à questão):

```
fator   = peso / notaMaxima          // se notaMaxima <= 0, NÃO entregue; avise o admin
delta   = pontosNovos - pontosJaCreditados   // rascunho: pontosNovos = 0
deltaDi = delta * fator
```

Depois: `increment(delta)` em `ni`, `increment(deltaDi)` em `di` e `df`.

**Errado (manual antigo):** `deltaDi = pontosGanhos * pesoDaFase`.

`entregue` é imutável. Se outro membro já entregou, a transação aborta.

`notaMaxima` e `peso` vêm do documento da fase (`getDoc` uma vez). Não recalcule ranking. Não leia a coleção `equipes`.

---

## 7. Snippet de entrega (use isto, não o manual)

Adapte `pontosTarefa` (nota desta entrega), `respostaPesoAnterior` (0 se nunca creditou; se já entregou, nem chegue aqui), e o objeto `respostaObj`.

```javascript
import { doc, getDoc, runTransaction, increment } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const respostaId = `tarefa_${faseId}`
const respostaRef = doc(db, 'equipes', equipeId, 'respostas', respostaId)
const equipeRef = doc(db, 'equipes', equipeId)
const pontuacaoRef = doc(db, 'equipes', equipeId, 'pontuacoes', faseId)

const faseSnap = await getDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId))
const fase = faseSnap.data()
const notaMaxima = fase?.notaMaxima
const pesoFase = fase?.peso || 0
if (!(notaMaxima > 0)) {
  throw new Error('Fase sem notaMaxima. Peça ao admin para corrigir o dashboard.')
}

const novoPeso = status === 'entregue' ? pontosTarefa : 0
const delta = novoPeso - respostaPesoAnterior
const fator = pesoFase / notaMaxima
const deltaDi = delta * fator

const respostaObj = {
  status, // 'rascunho' | 'entregue'
  peso: pontosTarefa,
  faseId,
  tipo: 'tarefa',
  atualizadoEm: new Date().toISOString(),
  atualizadoPor: userData?.nome || authUser.email,
  // campos extras da tarefa (respostas do jogo) podem ir aqui
}

await runTransaction(db, async (transaction) => {
  const rSnap = await transaction.get(respostaRef)
  if (rSnap.exists() && rSnap.data().status === 'entregue') {
    throw new Error('Tarefa já entregue por outro membro.')
  }

  transaction.set(respostaRef, respostaObj, { merge: true })

  if (delta !== 0) {
    transaction.set(pontuacaoRef, {
      ni: increment(delta),
      di: increment(deltaDi),
    }, { merge: true })

    transaction.update(equipeRef, {
      df: increment(deltaDi),
      [`respostas.${respostaId}`]: respostaObj,
      [`pontuacoes.${faseId}.ni`]: increment(delta),
      [`pontuacoes.${faseId}.di`]: increment(deltaDi),
    })
  } else {
    transaction.update(equipeRef, {
      [`respostas.${respostaId}`]: respostaObj,
    })
  }
})
```

Regras do snippet:

- Rascunho **não** incrementa `ni`/`di`/`df` (`novoPeso = 0`).
- Só `entregue` credita pontos.
- Não faça `getDocs(collection)` sem `where` + `limit` no path do aluno.
- Não grave no Firebase de suporte.
- Não remova o dual-write.

---

## 8. Spark (Free Tier)

Limites diários aproximados: 50k reads / 20k writes. ~8.000 alunos no pico.

- Proibido: `getDocs(collection(db, 'equipes'))` sem filtro no path do participante.
- Proibido: listener em coleção de questões ou de todas as equipes.
- `getDoc` da própria equipe, da própria resposta, da fase e (se precisar) da edição: ok.
- Escolas: só `public/escolas-pb.json` (tarefas normalmente não precisam).
- Sem loops de `getDoc`/`updateDoc` por aluno.

---

## 9. Arquivos que a IA NÃO deve alterar

Sem spec completa + aprovação humana:

- `src/app/questao/page.jsx` (pode **ler** o padrão de transação)
- `src/app/criar-equipe/page.jsx`, `src/app/montagem-equipe/page.jsx`
- `src/app/admin/ranking/page.jsx`
- `src/context/AuthContext.jsx`
- `src/lib/firebase.js`, `src/lib/support/firebase.js`, `src/lib/support/server/firestore-rest.js`
- `public/escolas-pb.json`

Não instale dependências. Não rode `specify init`. Não mude a fórmula global.

Arquivos que a IA **pode** criar/editar para uma tarefa nova:

- `src/app/tarefas/<slug>/page.jsx` e componentes locais em `src/components/` só se forem daquela tarefa
- Ajuste pontual em `src/app/resumo-fase/page.jsx` se o link ainda não passar query params ou o status ainda ler só `respostas.tarefa`

Mudança de comportamento (link do resumo, id da resposta): exige spec em `specs/<nnn-slug>/` (SDD). Página nova de tarefa com o contrato deste arquivo é o escopo esperado.

---

## 10. Template de prompt (cole no outro chat)

```
Você é agente no repo dhpb-2026-dev. Leia docs/PROJECT_CONTEXT.md, docs/CONSTITUTION.md,
docs/CODE_CONVENTIONS.md, docs/DATABASE.md e docs/AI_PROMPT_TAREFAS.md.

Tarefa a implementar:
- Slug da rota: tarefas/<SLUG>
- Arquivo: src/app/tarefas/<SLUG>/page.jsx
- [anexe o print / layout]
- Regras do jogo e como calcular pontosTarefa (0 até tarefa.pontuacao da fase):
  <DESCREVA>
- Pontuação máxima prevista desta tarefa: <N>
- Lembre o admin: notaMaxima da fase = max questões + este N

Contrato:
- 'use client' + Suspense em useSearchParams
- Query: equipeId, faseId, edicaoId
- Firebase: @/lib/firebase apenas
- Entrega: runTransaction + increment como no snippet de docs/AI_PROMPT_TAREFAS.md
- Di = delta * (peso / notaMaxima). NÃO use pontos * peso
- Dual-write respostas + pontuacoes (subcoleção e mapa)
- Status entregue imutável
- Sem getDocs sem where/limit no path do aluno
- Cloudinary via optimizeCloudinaryUrl
- NÃO edite questao, AuthContext, firebase.js, ranking, criar-equipe, montagem-equipe
- Sem npm install
- npm run build deve sair código 0

Ignore MANUAL-PROGRAMADOR-TAREFAS.md.
```

---

## 11. Checklist rápido antes de entregar a página

- [ ] Rota `src/app/tarefas/<slug>/page.jsx` com `Suspense`
- [ ] Sem os três query params, mostra erro e link de volta ao resumo
- [ ] Fase não `aberta`/`correcao` redireciona para `/home` ou `/home-professor`
- [ ] Rascunho não soma pontos
- [ ] Segunda entrega aborta
- [ ] `ni`/`di`/`df` atualizados nos dois lugares
- [ ] Admin: URL `/tarefas/<slug>` e `notaMaxima` incluindo a tarefa
- [ ] `npm run build` código 0
