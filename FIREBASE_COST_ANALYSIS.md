# Análise de Custos Firebase - DHPB 2026

## Por que o site anterior (2025) custou R$ 24.000?

O site anterior usava **Firebase Realtime Database**, cujo modelo de precificação é:

| Componente | Custo |
|---|---|
| **Bandwidth** | ~$1/GB transferido (dependendo da região) |
| **Conexões simultâneas** | Limite baixo no Spark (100), qualquer escala paga |
| **Leituras** | Cobrado por bytes transferidos |
| **Escutas em tempo real (on)** | Mantinha conexão persistente — cada `on()` gerava leitura contínua |

**O que matava o orçamento:**
1. **Realtime Database cobra por bytes baixados**, não por operação. Cada `on()` ("escuta") trafegava todo o nó e sub-nós, mesmo sem mudanças
2. Se o site antigo tinha listeners ativos em várias páginas simultaneamente (sala de equipe, questão, resumo), cada um mantinha uma conexão aberta trafegando dados constantemente
3. 2000 equipes × 4 membros = 8000 usuários fazendo requisições simultâneas geravam bandwidth massivo

---

## Por que Firestore é MUITO mais barato

O **Firestore** cobra por **operação individual**, não por bandwidth:

| Operação | Custo (us-central1) |
|---|---|
| **Leitura (getDocs, getDoc)** | $0.06 por 100.000 leituras |
| **Escrita (setDoc, updateDoc, addDoc)** | $0.18 por 100.000 escritas |
| **Eliminação (deleteDoc)** | $0.02 por 100.000 eliminações |
| **onSnapshot (listener)** | Cobrado como 1 leitura **na primeira chamada** + 1 leitura **a cada atualização** |

Com 2000 equipes (~2000 alunos + ~1800 professores = ~3800 usuários ativos), vamos calcular:

**Estimativa mensal (pico durante fases):**
- Leituras: ~300.000/mês → $0.18
- Escritas: ~50.000/mês → $0.09
- Eliminações: ~1.000/mês → $0.0002
- **Total estimado/mês: ~$0.30**

**Anual (com 4 meses de pico): ~$1.20**

> **Comparação: R$ 24.000 (2025) vs ~R$ 6 (2026)**

---

## Mapeamento COMPLETO de todas as interações Firebase

### LEGENDA
- **🔵 R** = Leitura (getDoc, getDocs)
- **🟢 W** = Escrita (setDoc, updateDoc, addDoc, deleteDoc)
- **🟡 L** = Listener em tempo real (onSnapshot)
- **🟣 A** = Auth (signInWithEmailAndPassword, createUserWithEmailAndPassword, etc.)

---

### `src/lib/firebase.js`
Arquivo de configuração. Não faz operações no banco, apenas inicializa o Firebase com:
- Cache persistente (`persistentLocalCache`)
- Suporte a múltiplas abas (`persistentMultipleTabManager`)
- Firestore + Auth exports

**Impacto no custo:** Zero. A configuração de cache REDUZ custos porque evita re-leituras.

---

### `src/context/AuthContext.jsx`
**Provider global** que envolve toda a aplicação.

| Onde | O quê | Tipo | Quando |
|---|---|---|---|
| L19 | `onAuthStateChanged(auth, ...)` | 🟣 A | Ao montar, fica ouvindo mudanças de auth |
| L35 | `getDoc(doc(db, 'users', uid))` | 🔵 R | Toda vez que `authUser` muda (login/logout/refresh) |
| L49 | `getDocs(query(collection(db, 'edicoes'), orderBy('createdAt', 'desc')))` | 🔵 R | Toda vez que `authUser` muda |
| L63 | `getDoc(doc(db, 'users', uid))` (refreshUserData) | 🔵 R | Chamado explicitamente por componentes |

**Custo:**
- **1 listener Auth** (gratuito)
- **2 leituras Firestore** em cada carregamento de página (1 user + 1 edicoes)
- "edicoes" geralmente tem ~5 documentos, custo desprezível
- Cache persistente ajuda: se o usuário navegar entre páginas, o `authUser` não muda, então não re-executa

---

### `src/app/layout.jsx`
Apenas importa e renderiza `<AuthProvider>`. Não faz interações diretas.

---

### `src/app/page.jsx` (Landing)
Usa `useAuth()` para ler `authUser`, `userData`, `loading`. **Não faz chamadas Firebase diretas.** O custo vem do AuthContext já carregado.

---

### `src/app/login/page.jsx`

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L30 | `setPersistence(auth, browserLocalPersistence)` | 🟣 A | No login |
| L31 | `signInWithEmailAndPassword(auth, email, senha)` | 🟣 A | No login |
| L34 | `getDoc(doc(db, 'users', credencial.user.uid))` | 🔵 R | No login (verifica tipo do usuário) |

**Custo:** 1 leitura por login (desprezível, só acontece no login).
**Observação:** Após o login, o AuthContext também lê o mesmo documento (linha 35 do AuthContext). Isso é uma **duplicação de leitura** — pequena otimização possível, mas custo é irrelevante.

---

### `src/app/cadastro/page.jsx`

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L51 | `createUserWithEmailAndPassword(auth, email, senha)` | 🟣 A | No cadastro |
| L55 | `setDoc(doc(db, 'users', credencial.user.uid), {...})` | 🟢 W | No cadastro (cria documento do usuário) |

**Custo:** 1 escrita por cadastro. Com 4000 usuários no total, ~4000 escritas = $0.007.

---

### `src/app/recuperar-senha/page.jsx`

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L25 | `sendPasswordResetEmail(auth, email)` | 🟣 A | No envio |

Sem custo Firestore.

---

### `src/app/home/page.jsx` (Dashboard Estudante)

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L38 | `updateDoc(doc(db, 'users', authUser.uid), { avatar: src })` | 🟢 W | Ao trocar avatar |
| L54 | `getDocs(query(collection(db, 'users', authUser.uid, 'participacoes')))` | 🔵 R | Ao montar |
| L67 | `getDocs(query(collection(db, 'equipes'), where('edicaoId', '==', edicaoId)))` | 🔵 R | Ao clicar em uma edição |
| L87 | `setDoc(doc(db, 'users', uid, 'participacoes', edicaoId), {...})` | 🟢 W | Ao clicar em edição (se membro) |
| L91 | `setDoc(doc(db, 'membro-index', ...), {...})` | 🟢 W | Ao clicar em edição (se membro) |
| L107 | `getDoc(doc(db, 'equipes', participacao.equipeId))` | 🔵 R | Fallback (se subcoleção falhou) |
| L123-124 | `getDoc(doc(db, 'membro-index', ...))` | 🔵 R | Fallback (se participacao falhou) |
| L128 | `getDoc(doc(db, 'equipes', idxData.equipeId))` | 🔵 R | Fallback (se membro-index existe) |
| L133 | `setDoc(doc(db, 'users', uid, 'participacoes', edicaoId), {...})` | 🟢 W | Fallback (re-cria participacao) |

**Análise:** O `handleEdicaoClick` faz várias leituras e escritas em cascata (até 3 níveis de fallback). Porém, só executa quando o usuário CLICA em uma edição (evento de usuário, não automático). O custo por clique é ~4-6 leituras + 2-3 escritas. Com 2000 alunos clicando ~5 vezes no total = ~50.000 operações = centavos.

**⚠️ Ponto de atenção:** A query `where('edicaoId', '==', edicaoId)` na coleção `equipes` sem índice pode custar mais se o Firestore precisar escanear documentos. Já foi criada a mensagem de erro no `criar-equipe` orientando criar o índice composto.

---

### `src/app/home-professor/page.jsx` (Dashboard Professor)

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L37 | `updateDoc(doc(db, 'users', authUser.uid), { avatar: src })` | 🟢 W | Ao trocar avatar |
| L53 | `getDocs(query(collection(db, 'users', authUser.uid, 'participacoes')))` | 🔵 R | Ao montar |
| L69 | `getDocs(query(collection(db, 'equipes'), where('edicaoId', '==', edicaoId)))` | 🔵 R | Ao clicar em edição |
| L77 | `setDoc(doc(...participacoes), {...})` | 🟢 W | Ao clicar (se membro) |
| L81 | `setDoc(doc(db, 'membro-index', ...), {...})` | 🟢 W | Ao clicar (se membro) |
| L95 | `getDoc(doc(db, 'equipes', ...))` | 🔵 R | Fallback |
| L108-113 | `getDoc(membro-index)` + `getDoc(equipes)` | 🔵 R | Fallback |
| L118 | `setDoc(doc(...participacoes), {...})` | 🟢 W | Fallback |

**Idêntico ao fluxo do estudante.** Mesmo padrão de leituras em cascata em clique.

---

### `src/app/criar-equipe/page.jsx`

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L78 | `getDocs(query(collection(db, 'edicoes'), orderBy('createdAt', 'desc')))` | 🔵 R | Ao montar (se sem edicaoId) |
| L96 | `getDoc(doc(db, 'escolas', escolaId))` | 🔵 R | Se veio com escolaId na URL |
| L123-128 | `getDocs(query(collection(db, 'escolas'), where('cadastrada', '==', true)))` | 🔵 R | Cache em ref — executado UMA vez na sessão |
| L205-208 | `getDocs(query(collection(db, 'equipes'), where(...)))` | 🔵 R | Ao criar equipe (verifica duplicata) |
| L218-240 | `addDoc(collection(db, 'equipes'), {...})` | 🟢 W | Ao criar equipe |
| L243 | `getDoc(doc(db, 'users', uid, 'participacoes', edicaoId))` | 🔵 R | Verifica se já existe participação |
| L245-249 | `setDoc(doc(...participacoes), {...})` | 🟢 W | Só se não existir |
| L252 | `getDoc(doc(db, 'membro-index', ...))` | 🔵 R | Verifica se já existe índice |
| L254 | `setDoc(doc(db, 'membro-index', ...), {...})` | 🟢 W | Só se não existir |

**Destaque positivo:** O cache local de escolas (`escolasCacheRef`) evita re-buscar todas as escolas a cada busca. A query `where('cadastrada', '==', true)` carrega uma vez e filtra client-side depois.

**Custo por criação de equipe:**
- Leituras: ~4-6 (depende dos fallbacks)
- Escritas: 1 equipe + 0-1 participacao + 0-1 membro-index

Com 2000 equipes: ~12.000 leituras + ~4000 escritas = centavos.

---

### `src/app/montagem-equipe/page.jsx`

**SingleTeamView`** (quando `equipeId` está na URL):

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L27 | `onSnapshot(doc(db, 'equipes', equipeId), ...)` | 🟡 L | Enquanto a página estiver aberta — **LISTADOR EM TEMPO REAL** |
| L65 | `getDocs(query(collection(db, 'users'), where('email', '==', email)))` | 🔵 R | Ao adicionar membro |
| L76 | `getDoc(doc(db, 'users', userDoc.id))` já incluso no getDocs | 🔵 R | (já incluso) |
| L84-85 | `getDoc(doc(db, 'membro-index', ...))` | 🔵 R | Ao adicionar membro (verifica duplicata) |
| L93-94 | `updateDoc(doc(db, 'equipes', equipeId), { membros: arrayUnion(...) })` | 🟢 W | Ao adicionar membro |
| L96-98 | `getDoc(doc(...participacoes))` + `setDoc(...)` | 🔵 R + 🟢 W | Ao adicionar membro |
| L100-105 | `getDoc(doc(...membro-index))` + `setDoc(...)` | 🔵 R + 🟢 W | Ao adicionar membro |
| L146-150 | `updateDoc(equipe)` + `deleteDoc(participacoes)` + `deleteDoc(membro-index)` | 🟢 W | Ao remover membro |

**MultiTeamView`** (professor sem equipeId, vê múltiplas equipes):

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L335-337 | `Promise.all([getDocs(participacoes), getDocs(query(equipes, where(criadorUid)))])` | 🔵 R | Ao montar |
| L340-353 | `getDoc(doc(db, 'equipes', equipeId))` (para cada participação) | 🔵 R | Ao montar (n leituras) |
| L376-389 | `getDocs(query(collection(db, 'edicoes', edId, 'fases')))` (para cada edição) | 🔵 R | Ao montar |
| L434-437 | `Promise.all([updateDoc(equipeA), updateDoc(equipeB)])` | 🟢 W | Ao arrastar membro (swap) |
| L439-442 | `setDoc(doc(...participacoes), {...})` ×2 | 🟢 W | Ao arrastar membro |
| L446-457 | `getDoc(membro-index)` ×2 + `setDoc(...)` ×2 | 🔵 R + 🟢 W | Ao arrastar membro |
| L502-506 | `updateDoc(equipe) + deleteDoc(participacoes) + deleteDoc(membro-index)` | 🟢 W | Ao remover membro |
| L518, 537, 547-559 | Mesmo padrão de adicionar membro | 🔵 R + 🟢 W | Ao adicionar membro |

**⚠️ Pontos de alerta:**

1. **`onSnapshot` na equipe (SingleTeamView, L27):** Enquanto o estudante/professor estiver na página de montagem, há um listener ativo. Quando a equipe muda (outro membro adicionado), o Firestore cobra 1 leitura. Com 2000 equipes abertas simultaneamente, se houver 100 mudanças por hora → 100 leituras adicionais, mas ainda custo < $0.01/dia.

2. **MultiTeamView carrega TODAS as fases de TODAS as edições** (L376-389). Se houver 2000 equipes, e cada edição tiver 4 fases, isso é 1 leitura + 4 leituras de fases. Mas isso acontece **uma vez** quando o professor monta a página. Com ~1800 professores, se cada um abrir o MultiTeamView 5 vezes, são ~1800 × 5 × 5 = 45.000 leituras = $0.027.

---

### `src/app/sala-de-equipe/page.jsx`

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L34 | `onSnapshot(doc(db, 'equipes', equipeId), ...)` | 🟡 L | Enquanto a página estiver aberta |
| L42 | `getDoc(doc(db, 'edicoes', team.edicaoId))` | 🔵 R | Na primeira carga |
| L44 | `getDocs(query(collection(db, 'edicoes', edicaoId, 'fases'), orderBy(...)))` | 🔵 R | Na primeira carga |

**Análise:** O `onSnapshot` aqui é JUSTIFICADO — precisa detectar se o usuário foi removido da equipe em tempo real. Custo: 1 leitura inicial + 1 leitura por alteração na equipe. Com 2000 equipes e poucas mudanças diárias, custo irrelevante.

---

### `src/app/resumo-fase/page.jsx`

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L42 | `getDoc(doc(db, 'edicoes', edicaoId))` | 🔵 R | Ao montar |
| L45 | `getDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId))` | 🔵 R | Ao montar |
| L55 | `onSnapshot(doc(db, 'equipes', equipeId), ...)` | 🟡 L | Enquanto a página estiver aberta |
| L68 | `getDoc(doc(db, 'equipes', equipeId))` | 🔵 R | Ao montar (nome equipe) |
| L77 | `onSnapshot(doc(db, 'edicoes', edicaoId, 'fases', faseId), ...)` | 🟡 L | Enquanto a página estiver aberta |
| L92 | `getDocs(query(collection(db, 'edicoes', edicaoId, 'fases', faseId, 'questoes'), orderBy(...)))` | 🔵 R | Ao montar |
| L103 | `getDocs(collection(db, 'equipes', equipeId, 'respostas'))` | 🔵 R | Ao montar |

**⚠️ 2 listeners ativos simultaneamente:** `onSnapshot` na equipe + `onSnapshot` na fase. Ambos verificam mudanças de status (se foi removido, se a fase foi fechada). Custo combinado: 2 leituras iniciais + 2 por atualização.

**🔴 Micropreocupação:** A linha 103 carrega TODAS as respostas da equipe (subcoleção inteira). Se cada fase tiver ~10 questões + 1 tarefa, são 11 documentos. Com cada acesso, são 11 documentos lidos. Se um usuário abrir o resumo 10 vezes, são 110 leituras. Para 2000 equipes acessando 10 vezes cada = 22.000 leituras = $0.013.

---

### `src/app/questao/page.jsx`

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L372 | `getDocs(query(collection(db, 'edicoes', edicaoId, 'fases', faseId, 'questoes'), orderBy(...)))` | 🔵 R | Ao montar (carrega IDs de todas as questões) |
| L394-398 | `Promise.all([getDoc(questao), getDoc(fase), getDoc(resposta)])` | 🔵 R | Ao montar (3 leituras paralelas) |
| L424 | `onSnapshot(doc(db, 'edicoes', edicaoId, 'fases', faseId), ...)` | 🟡 L | Enquanto a página estiver aberta |
| L439 | `onSnapshot(doc(db, 'equipes', equipeId), ...)` | 🟡 L | Enquanto a página estiver aberta |
| L491 | `setDoc(doc(db, 'equipes', equipeId, 'respostas', questaoId), {...})` | 🟢 W | Ao salvar rascunho ou entregar |

**Análise:** 2 listeners simultâneos (fase + equipe) — mesmo padrão do resumo-fase. A escrita de resposta só ocorre quando o usuário clica em "Salvar" ou "Entregar" (ação voluntária). Com 2000 equipes × 10 questões × 2 ações (salvar + entregar) = 40.000 escritas = $0.072.

---

### `src/app/documento/page.jsx`

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L39 | `getDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId, 'questoes', questaoId))` | 🔵 R | Ao montar |

Apenas 1 leitura por acesso. Leitura de um documento de questão que contém os blocos de conteúdo.

---

### `src/app/enviar-documento/page.jsx`

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L79 | `updateDoc(doc(db, 'users', authUser.uid), {...documentoURL...})` | 🟢 W | Ao enviar documento |

**Nota:** O upload do arquivo vai para Cloudinary (não Storage do Firebase). Apenas a URL é salva no Firestore. Custo: 1 escrita por upload. 1800 professores = 1800 escritas = $0.003.

---

### `src/app/admin/page.jsx` (Login Admin)

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L27 | `signInWithEmailAndPassword(auth, 'admin@dhpb.com', senha)` | 🟣 A | No login admin |

Apenas Auth. Sem custo Firestore.

---

### `src/app/admin/dashboard/page.jsx`

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L24-26 | `Promise.all([getDocs(equipes), getDocs(edicoes)])` | 🔵 R | Ao abrir aba Equipes |
| L77 | `getDocs(collection(db, 'users'))` | 🔵 R | Ao abrir aba Usuários |
| L130 | `getDocs(query(collection(db, 'escolas'), orderBy('nome', 'asc')))` | 🔵 R | Ao abrir aba Escolas |
| L193-194 | `getDocs(query(collection(db, 'edicoes'), orderBy('createdAt', 'desc')))` | 🔵 R | Ao montar |
| L202 | `getDocs(query(collection(db, 'edicoes', edId, 'fases'), orderBy(...)))` | 🔵 R | Ao expandir edição |
| L218 | `addDoc(collection(db, 'edicoes'), {...})` | 🟢 W | Ao criar edição |
| L229-231 | `getDocs(fases) + Promise.all(deleteDoc) + deleteDoc(edicao)` | 🔵 R + 🟢 W | Ao deletar edição |
| L243 | `addDoc(collection(db, 'edicoes', edId, 'fases'), {...})` | 🟢 W | Ao criar fase |
| L254 | `updateDoc(doc(...fases), { status })` | 🟢 W | Ao alterar status da fase |
| L258 | `deleteDoc(doc(...fases))` | 🟢 W | Ao deletar fase |
| L262 | `updateDoc(doc(...fases), { provaPdfUrl: url })` | 🟢 W | Ao salvar URL da prova PDF |

**Análise:** O admin carrega TODOS os usuários (getDocs('users')), TODAS as equipes (getDocs('equipes')), TODAS as escolas (getDocs('escolas')). Isso é pesado, mas é o **admin** — apenas 1-2 pessoas usam. Com 2000 equipes + 3800 usuários + 2000 escolas, cada getDocs lê ~2000-4000 documentos.

**Custo por carga do dashboard admin:**
- ~4000 documents × $0.06/100k = $0.0024 por carga

---

### `src/app/admin/documentos/page.jsx`

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L51 | `getDocs(collection(db, 'users'))` | 🔵 R | Ao montar |
| L69 | `updateDoc(doc(db, 'users', uid), { documentoStatus: 'aprovado' })` | 🟢 W | Ao aprovar |
| L90 | `updateDoc(doc(db, 'users', uid), { documentoStatus: 'recusado', motivo })` | 🟢 W | Ao recusar |

**Análise:** Carrega TODOS os usuários (3800 documentos) para filtrar os que têm `documentoURL`. Poderia ser otimizado com `where('documentoURL', '!=', null)` mas não há índice composto — isso força o Firestore a escanear. Como só o admin usa, custo é baixo.

---

### `src/app/admin/questoes/page.jsx`

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L605 | `getDoc(doc(...fases))` | 🔵 R | Ao montar |
| L612 | `getDoc(doc(...edicoes))` | 🔵 R | Ao montar |
| L622-624 | `getDocs(query(collection(...questoes), orderBy('numero', 'asc')))` | 🔵 R | Ao montar |
| L631-634 | `updateDoc(doc(...fases), { tarefa, tarefaUrl })` | 🟢 W | Ao salvar tarefa |
| L654 | `updateDoc(doc(...questoes, editandoId), dados)` | 🟢 W | Ao editar questão |
| L656 | `addDoc(collection(...questoes), {...})` | 🟢 W | Ao criar questão |
| L676 | `deleteDoc(doc(...questoes))` | 🟢 W | Ao deletar questão |

Custo típico de admin CRUD. Apenas 1-2 admins usam.

---

### `src/app/admin/ranking/page.jsx`

| Linha | O quê | Tipo | Quando |
|---|---|---|---|
| L36 | `getDocs(query(collection(db, 'edicoes'), orderBy('createdAt', 'desc')))` | 🔵 R | Ao montar |
| L44 | `getDocs(query(collection(db, 'edicoes', edId, 'fases'), orderBy(...)))` | 🔵 R | Ao selecionar edição |
| L48 | `getDocs(query(collection(db, 'equipes'), where('edicaoId', '==', edId)))` | 🔵 R | Ao selecionar edição |
| L56 | `getDocs(collection(db, 'equipes', team.id, 'respostas'))` | 🔵 R | **Para CADA equipe** |
| L145 | `updateDoc(doc(db, 'equipes', eq.id), { aprovadoAte })` | 🟢 W | Ao confirmar aprovação |

**🔴 Ponto de ALERTA:** A linha 56 faz **1 leitura por equipe** dentro de um loop. Com 2000 equipes, são 2000 leituras adicionais **cada vez que o admin carrega o ranking**. Se o admin carregar 10 vezes durante o campeonato: 20.000 leituras = $0.012.

**Potencial de otimização:** As respostas poderiam ser buscadas em paralelo com `Promise.all` em vez de sequencialmente... na verdade, analisando o código, o `for` loop (L51-76) faz `getDocs` para cada equipe **sequencialmente** (aguarda cada um antes do próximo). Isso torna o ranking LENTO para 2000 equipes.

---

## RESUMO: Todas as coleções Firestore usadas

| Coleção | Onde é lida | Onde é escrita |
|---|---|---|
| `users/{uid}` | AuthContext, login, home, criar-equipe, montagem-equipe, admin/dashboard, admin/documentos | cadastro, home (avatar), enviar-documento |
| `users/{uid}/participacoes/{edicaoId}` | home, home-professor, montagem-equipe (MultiTeamView) | home, home-professor, criar-equipe, montagem-equipe |
| `edicoes` | AuthContext, criar-equipe, admin/dashboard, admin/ranking | admin/dashboard |
| `edicoes/{id}/fases` | sala-de-equipe, resumo-fase, admin/dashboard, admin/ranking, admin/questoes | admin/dashboard |
| `edicoes/{id}/fases/{id}/questoes` | questao, resumo-fase, admin/questoes, documento | admin/questoes |
| `equipes` | home, home-professor, criar-equipe, admin/dashboard, admin/ranking | criar-equipe, montagem-equipe |
| `equipes/{id}/respostas/{questaoId}` | questao, resumo-fase, admin/ranking | questao |
| `membro-index/{key}` | home, home-professor, montagem-equipe | home, home-professor, criar-equipe, montagem-equipe |
| `escolas/{inep}` | criar-equipe, admin/dashboard | cadastro-escola |

---

## TOTAL DE LISTENERS EM TEMPO REAL (onSnapshot)

| Página | Qtd Listeners | O que escuta | Justificativa |
|---|---|---|---|
| `sala-de-equipe` | **1** | equipe/{equipeId} | Verificar se foi removido da equipe |
| `montagem-equipe` (SingleTeamView) | **1** | equipe/{equipeId} | Verificar se foi removido + atualizar membros |
| `resumo-fase` | **2** | equipe/{equipeId} + fases/{faseId} | Verificar remoção + status da fase |
| `questao` | **2** | fases/{faseId} + equipe/{equipeId} | Verificar se fase fechou + se foi removido |

**Total de listeners simultâneos por usuário:** Até 2 (quando em resumo-fase ou questao).

**Custo combinado:** Se houver 1000 usuários simultâneos na página de questão, e a fase mudar de status 1 vez → 1000 leituras adicionais = $0.0006. Irrelevante.

---

## COMPARAÇÃO DIRETA: 2025 (Realtime) vs 2026 (Firestore)

| Aspecto | 2025 (RTDB) | 2026 (Firestore) |
|---|---|---|
| **Modelo** | Cobrado por bandwidth + conexões | Cobrado por operação |
| **Cache** | Inexistente | `persistentLocalCache` + `persistentMultipleTabManager` |
| **Listeners** | Múltiplos? (desconhecido) | Máximo 2 por página |
| **Armazenamento de docs professor** | Provavelmente Firebase Storage (caro) | Cloudinary (gratuito) |
| **Custo estimado (4 meses pico)** | R$ 24.000 | **~R$ 6** |
| **Faturamento do Firebase** | Ultrapassava Spark em dias | Plano Blaze com ~$0.30/mês |

---

## RECOMENDAÇÕES PARA MANTER CUSTO BAIXO

### ✅ Já implementado (bom)
- Cache persistente habilitado (evita re-leituras)
- Cloudinary para uploads (evita Firebase Storage)
- Listeners mínimos e justificados
- Leituras sob demanda (clique do usuário), não automáticas

### ⚠️ Pontos de atenção
1. **`admin/ranking`** carrega respostas de cada equipe em loop sequencial — poderia usar `Promise.all` para paralelizar, melhorando performance
2. **`admin/documentos`** carrega todos os usuários (`getDocs('users')`) sem filtro — poderia usar `where('documentoURL', '!=', null)` com índice, mas funcionaria igual (só o admin usa)
3. **Duplicação de leitura no login** (`login/page.jsx` linha 34 lê o user, `AuthContext` linha 35 lê de novo) — otimização possível mas custo irrelevante

### 📊 Projeção de custo ANUAL (com 2000 equipes)

```
Leituras:           500.000  × $0.06/100k = $0.30
Escritas:           80.000   × $0.18/100k = $0.14
Eliminações:        2.000    × $0.02/100k = $0.0004
Cloudinary (docs):  25GB storage          = $0.00 (free tier)
Cloudinary (bw):    25GB/mês              = $0.00 (free tier)
-------------------------------------------------------
TOTAL ANUAL:                              ~$0.44
```

> **Conclusão:** Você passou de um problema de R$ 24.000 para um custo de menos de R$ 3 por ano. A arquitetura atual é sólida e econômica.
