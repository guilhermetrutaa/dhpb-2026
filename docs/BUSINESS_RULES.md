# DHPB 2026 — Regras de Negócio do Sistema

Este documento consolida as regras de negócio identificadas no código-fonte, separadas rigorosamente por nível de confirmação.

---

## 1. Regras Confirmadas pelo Código

### 1.1. Formação e Composição de Equipes
* **Composição Obrigatória:** Uma equipe completa é formada por **4 membros**:
  * 1 Professor Orientador (conta tipo `professor` com comprovante aprovado).
  * 1 Estudante Responsável (criador ou indicado na equipe).
  * 2 Estudantes Ajudantes.
* **Restrição de Instituição e Nível:** Os estudantes da equipe devem pertencer à mesma escola e à mesma modalidade/nível de ensino (`fundamental` ou `medio`).
* **Unicidade de Estudantes:** Um estudante só pode participar de **uma única equipe** por edição. Essa regra é garantida no código pela coleção `membro-index` via chave `base64(email)_edicaoId`.
* **Multi-Orientação de Professores:** Um professor pode orientar e criar **múltiplas equipes** na mesma edição.
* **Alteração de Nome da Equipe:**
  * Permitida apenas para o Professor Orientador ou Estudante Responsável.
  * Sujeita a um **cooldown de 25 dias** (`ultimoNomeEditadoEm`).
  * Bloqueada se qualquer fase da edição já tiver sido iniciada (status diferente de `pendente`).
  * Verificação rigorosa contra duplicidade usando `nomeLower`.

### 1.2. Questionários Obrigatórios
* **Questionário Individual (Socioeconômico):**
  * Modal exibido na primeira tentativa de acesso a uma edição em `/home` ou `/home-professor`.
  * Salvo em `users/{uid}/questionarios/{edicaoId}`.
  * O preenchimento é pré-requisito mandatório para criar ou entrar em equipes.
* **Questionário da Equipe:**
  * Modal exibido na Sala de Equipe (`/sala-de-equipe`) após a equipe estar completa.
  * Salvo em `equipes/{equipeId}.questionarioEquipe`.
  * Precisa ser respondido apenas uma vez por qualquer um dos membros ativos.

### 1.3. Fases e Provas Online
* **Estrutura da Competição:** 4 Fases Online + 1 Fase Final Presencial.
* **Bloqueio de Acesso à Prova:**
  * Acesso liberado apenas se a fase estiver com status `aberta` ou `correcao`.
  * A equipe deve estar aprovada/liberada para aquela fase (`aprovadoAte`).
* **Regras de Questões:**
  * Cada questão possui alternativas com pesos distintos.
  * **Rascunho:** Pode ser salvo com trava temporal de 60 segundos (`rascunhoBloqueado`).
  * **Entrega Definitiva:** Ao clicar em "Entregar questão", a resposta é travada permanentemente. Não é permitido alterar a alternativa após a entrega.
  * **Anti-Concorrência:** Transação atômica (`runTransaction`) impede que dois alunos entreguem a mesma questão quase simultaneamente e dupliquem a pontuação.

### 1.4. Sistema de Pontuação e Ranqueamento (Fórmula $Df$)
* **Cálculo da Nota da Fase ($d_i$):**
  $$d_i = \left( rac{n_i}{	ext{notaMaxima}_i} ight) 	imes 	ext{peso}_i$$
  Onde $n_i$ é a soma dos pesos das questões entregues e da tarefa da fase.
* **Desempenho Final ($Df$):**
  $$Df = \sum_{i=1}^{k} d_i$$
* **Sistema de Cotas e Aprovação (Admin Ranking):**
  * 4 categorias: Médio Pública, Fundamental Pública, Médio Particular, Fundamental Particular.
  * O administrador define o número de vagas por categoria e aprova os classificados preenchendo o campo `aprovadoAte` nas equipes.

---

## 2. Regras Inferidas pelo Código

* **Ambiente de Desenvolvimento (Localhost Bypass):**
  * O componente `OneSignal.jsx` e os modais de bloqueio de notificação (`NotificationBlockerModal`) detectam `localhost` e pulam a exigência de ativação de notificações push para não travar o desenvolvimento local.
* **Formatos de Mídia e Documentos:**
  * Documentos de questões aceitam múltiplos blocos heterogêneos (`texto`, `imagem`, `video`, `pdf`, `musica`).
  * Vídeos do YouTube são convertidos automaticamente para a URL de embed padrão (`/embed/`).

---

## 3. Regras que Precisam de Confirmação Humana

* **Critérios de Desempate no Ranking:** O código atual faz ordenação decrescente simples por `df` (`b.df - a.df`). Critérios secundários de desempate (ex: tempo de envio, data de criação da equipe, menor pontuação na tarefa) não estão explicitados no código.
* **Critérios de Emissão de Medalhas:** Em `/admin/medalhas` e `/certificado-medalha`, confirmar se a nota de corte para Ouro, Prata e Bronze é definida manualmente pelo admin ou segue percentil estatístico fixo.
