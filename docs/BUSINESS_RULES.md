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
* **Nota bruta da fase ($N_i$):** 0 a 100 (`notaMaxima` é o teto, não o divisor do $d_i$). Fases 1–3: até 80 nas questões (itens 0 / 2 / 8 / 10) + até 20 na tarefa.
* **Cálculo do desempenho da fase ($d_i$):** $d_i = n_i \times peso_i$. Pesos oficiais: 1, 2, 4, 8, 16. Valores arredondados na 2ª casa decimal.
* **Desempenho Final ($Df$):** soma dos $d_i$, máximo 3100.
* **Eliminação e aprovação (Admin Ranking):** o admin gera preview e grava `aprovadoAte`.
  * Fase 1 → 2: $N_1 \ge 25{,}00$; sem teto de vagas.
  * Fase 2 → 3: $N_2 \ge 50{,}00$; sem teto de vagas.
  * Fase 3 → 4: até 125 ampla concorrência + 125 reservadas à rede pública, pelo $Df$ acumulado.
  * Fase 4 → final: até 120; 60 do ranking geral; completa mínimo de 60 públicas; resto na ordem geral.
  * Desempate: $N_3$, depois $N_2$, depois $N_1$. Empate persistente na linha de corte: todas avançam.
  * Rede pública: `municipal`, `estadual`, `federal`, `publica`.

---

## 2. Regras Inferidas pelo Código

* **Ambiente de Desenvolvimento (Localhost Bypass):**
  * O componente `OneSignal.jsx` e os modais de bloqueio de notificação (`NotificationBlockerModal`) detectam `localhost` e pulam a exigência de ativação de notificações push para não travar o desenvolvimento local.
* **Formatos de Mídia e Documentos:**
  * Documentos de questões aceitam múltiplos blocos heterogêneos (`texto`, `imagem`, `video`, `pdf`, `musica`).
  * Vídeos do YouTube são convertidos automaticamente para a URL de embed padrão (`/embed/`).

---

## 3. Regras que Precisam de Confirmação Humana

* **Critérios de Emissão de Medalhas:** Em `/admin/medalhas` e `/certificado-medalha`, confirmar se a nota de corte para Ouro, Prata e Bronze é definida manualmente pelo admin ou segue percentil estatístico fixo.
