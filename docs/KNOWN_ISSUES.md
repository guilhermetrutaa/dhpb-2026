# DHPB 2026 — Known Issues & Technical Limitations

Este documento registra problemas conhecidos, limitações técnicas e pontos de atenção arquitetural identificados na base de código, sem qualquer alteração de código.

---

## 1. Problemas e Limitações Identificados

### 1.1. Autenticação do Painel de Suporte sem Tela de Login Tradicional
* **Localização:** `src/app/admin/suporte/page.jsx` e `src/app/admin/suporte/chamados/[id]/page.jsx`.
* **Descrição:** O painel administrativo do chat de suporte não possui uma tela de login dedicada. Ele é protegido primariamente pelo isolamento de URL (divulgada apenas no grupo privado do Telegram de atendentes) e validação de claims no backend `/api/support/auth`. O nome do atendente é salvo no `localStorage`.
* **Impacto:** Se a URL vazar, um usuário leigo poderia tentar acessar a interface de suporte (embora a emissão de custom token exija e-mail em `SUPPORT_ADMIN_EMAILS`).
* **Observação:** Esta foi uma decisão deliberada da equipe organizadora para simplificar o fluxo dos voluntários de atendimento.

### 1.2. Criação Manual de Índices Compostos no Firestore de Suporte
* **Localização:** `src/lib/support/server/firestore-rest.js` / Console Firebase.
* **Descrição:** A consulta de chamados por `uid ASC + criadoEm DESC` exige um índice composto no Firestore. Como a Service Account não possui a permissão `datastore.indexes.create`, novos índices compostos devem ser gerados manualmente clicando no link fornecido pelo log do Firebase.

### 1.3. Limpeza de Assets Órfãos no Cloudinary
* **Localização:** `src/app/admin/questoes/page.jsx` e `src/app/enviar-documento/page.jsx`.
* **Descrição:** Quando uma imagem de questão ou documento de professor é substituído ou deletado, a URL é atualizada no Firestore, mas a exclusão física do arquivo antigo no Cloudinary via API `destroy` ainda não ocorre de forma automatizada por webhook ou trigger.
* **Impacto:** Acúmulo gradual de imagens antigas no storage do Cloudinary ao longo dos anos.

### 1.4. Monitoramento da Cota Gratuita (Spark Tier)
* **Descrição:** O projeto foi projetado para operar 100% no Spark Free Tier (50k reads / 20k writes diários).
* **Ponto de Atenção:** Durante a 1ª Fase Online (dias 10 a 15 de Setembro de 2026), com ~8.000 alunos acessando, qualquer alteração no código que reintroduza queries não-indexadas ou loops de `getDocs` pode esgotar a cota diária em poucos minutos.

### 1.5. Bloqueio de Push Notification em Localhost
* **Localização:** `src/components/OneSignal.jsx`.
* **Descrição:** O OneSignal SDK falha por design quando executado em `localhost` ou `http://` sem SSL.
* **Solução em Código:** O código contém um bypass explícito para ignorar a inicialização do OneSignal e os modais bloqueadores quando `window.location.hostname === 'localhost'`, garantindo que o desenvolvimento local não seja interrompido.

### 1.6. Busca admin de pessoa por nome (igualdade exata)
* **Localização:** `src/app/admin/firestore/page.jsx`.
* **Descrição:** A busca por nome completo usa `where('nome','==')` + `where('sobrenome','==')` com `limit(15)`. Não há campo `nomeLower` em `users`; a igualdade é sensível a maiúsculas e acentos, como gravado no cadastro. Busca “contém” exigiria varredura da coleção e não é usada (Spark).
* **Índice:** query composta exige índice `users`: `nome` ASC + `sobrenome` ASC no Console do Firestore.

### 1.7. Busca admin de equipe por prefixo (`nomeNormalized`)
* **Localização:** `src/app/admin/firestore/page.jsx`.
* **Descrição:** A busca por nome usa prefixo em `nomeNormalized` (`limit(15)`). Equipes antigas sem esse campo só são encontradas pelo fallback de igualdade em `nomeLower` (nome inteiro, minúsculas). “Contém no meio” não é usada (Spark).

### 1.8. `membro-index` é 1 equipe por e-mail/edição
* **Localização:** `membro-index/{btoa(email)_edicaoId}`; home do professor e montagem.
* **Descrição:** A chave impede estudante em duas equipes, mas o professor pode orientar várias. O dashboard de reconsolidação **pula** professores. Acesso do professor usa `equipes.orientadorUids` quando `participacoes`/`membro-index` estão ausentes ou desatualizados.
* **Impacto:** Remover o professor de uma equipe não deve apagar o índice se ele ainda orientar outra da mesma edição.

### 1.9. Equipes com mais de 4 membros no array
* **Localização:** `equipes.membros`; botão Sala de Equipe em `src/app/montagem-equipe/page.jsx`.
* **Descrição:** Algumas equipes ficaram com 5+ membros ativos. A sala e as questões só exigem membro ativo. O botão Sala de Equipe aparece com **4 ou mais** ativos; a composição oficial continua 1+1+2. Não há migração que apague o membro extra.

### 1.10. `novos_enigmas.pdf` (tarefa Charadas) com id repetido
* **Localização:** `public/novos_enigmas.pdf`; `src/app/tarefas/galeria-de-enigmas/config.js`.
* **Descrição:** No PDF, A1 e C4 aparecem os dois como `e11 / capa-11`, e o 12 não aparece. Decisão humana (spec 040): C4 = `e12 / capa-12`. O título do C5 diz "Linduarte Noronha e Vladimir Carvalho", mas o texto é sobre Walfredo Rodriguez e Vladimir; o título não aparece na tela.
* **Impacto:** Rascunhos salvos antes da troca guardam `enigmas[id].valor` por id; com os novos enunciados, o valor passa a valer para o texto novo de mesmo id. Não há migração.

### 1.11. Regras do Firestore não versionadas — o acesso à comissão é o nome, e só
* **Localização:** console do Firebase → Firestore → Regras. **Não existe `firestore.rules` no repositório** (padrão do projeto: as regras são editadas no console), então nenhuma spec consegue verificá-las.
* **O que a spec 046 garante por regra:** `correcoes/fase4/correcoes/{equipeId}` e `correcoes/fase4/vereditos/{equipeId}` são graváveis só pela comissão; a distribuição é do admin, e o corretor só consegue acrescentar o 3º nome, sem mexer em `versao`, `carga` ou `geradoEm` (`affectedKeys().hasOnly(['atribuido'])`). Para isso `acrescentarTerceiro` grava o campo `atribuido` inteiro, e não `atribuido.{equipeId}`.
* **O que continua aberto (decisão da spec 044, "sem código de convite"):** `ehCorretor()` olha `users/{uid}.tipo == 'corretor'`, e esse campo é escrito pelo próprio cadastro de `/correcao`. Ou seja, **o nome completo é a única credencial** — quem digitar "Glayds" no formulário de "Criar conta" entra como corrigente. Para qualquer conta nova isso só é closedado pela regra (`create` só aceita `tipo: 'corretor'` e o dono é o próprio uid) e pela checagem do app (`identificarCorretor` exige palavra inteira de um dos 7). Se um dia isso for problema, o caminho é uma lista de e-mails da comissão no admin — me avise que isso vira spec.
* **Limitação que sobrou:** `equipes/{equipeId}` continua `allow read, write: if isAutenticado()`, porque `questao` e as páginas de tarefa gravam resposta pelo navegador. Isso vale para os alunos também, então não foi a correção que abriu a porta, mas significa que nenhuma conta logada (inclusive um suposto corretor) está impedida de alterar `df` ou `aprovadoAte` por ali. Fechar isso exige amarrar escrita à participação (`membro-index`), que é bem maior que a correção da fase 4.
* **Sintoma de regra faltando:** `permission-denied` na hora de fechar o veredito. A página traduz o erro (`explicarErro` em `src/lib/correcao.js`), mas o motivo continua sendo do console.

### 1.13. Peso da fase 4 gravado na rubrica anterior continua na equipe
* **Localização:** `equipes/{id}.respostas.tarefa_fase4.peso`, `pontuacoes.fase4.ni` / `.di`, `df`.
* **Descrição:** a spec 047 ignora correção e veredito sem `rubrica: 'banners-2026-10'`. Não zera o `peso` que a banca antiga já fechou. O número só muda quando um veredito novo fecha (`gravarNota` aplica o delta).
* **Impacto:** a fila do professor volta vazia; o ranking ainda mostra a nota antiga até a banca fechar de novo, ou até um reset explícito.

### 1.12. Nenhuma tela do admin mostra o andamento da correção da fase 4
* **Localização:** `src/app/admin/dashboard/page.jsx` só tem a geração da distribuição; `correcoes/fase4/vereditos` não é lido em lugar nenhum do admin.
* **Descrição:** não há como ver, no admin, quantos pares estão fechados, quantos aguardam o segundo corretor ou quantos estão parados na 3ª correção. Foi o que escondeu o bug da spec 044 por dias: o sistema seemed funcionar e o ranking simplesmente não subia.
* **Impacto:** hoje só se descobre o estado andando pela `/correcao` de cada professor. Um painel de conferência é a próxima speccandidate (ver `specs/046-.../tasks.md`, seção "Fora").
