# DHPB 2026 — Database Schema & Operations

Este documento mapeia todas as coleções, subcoleções, modelos de dados e operações do Firestore nos dois projetos Firebase da aplicação.

---

## 1. Topologia dos Bancos de Dados

O DHPB utiliza **duas instâncias separadas do Google Cloud Firestore**:
1. **Instância Principal (`dhpb-main` / `NEXT_PUBLIC_FIREBASE_*`):** Dados acadêmicos, participantes, equipes, provas e resultados.
2. **Instância de Suporte (`dhpb-suporte` / `NEXT_PUBLIC_SUPPORT_FIREBASE_*`):** Tickets de atendimento, mensagens e respostas automáticas.

---

## 2. Esquema do Banco Principal

### 2.1. Coleção `users`
Documento: `users/{uid}` (Criado no cadastro pelo Firebase Auth)

| Campo | Tipo | Descrição |
|---|---|---|
| `nome` | string | Primeiro nome do usuário |
| `sobrenome` | string | Sobrenome do usuário |
| `email` | string | E-mail da conta |
| `tipo` | string | `'estudante'` ou `'professor'` |
| `avatar` | string | Nome do arquivo SVG do avatar (ex: `'avatar.svg'` ou `'joaopessoa.svg'`) |
| `createdAt` | string (ISO) | Data de criação da conta |
| `documentoURL` | string (opcional) | URL do comprovante de vínculo no Cloudinary (apenas professores) |
| `documentoPublicId` | string (opcional) | Public ID do Cloudinary para futuro cleanup |
| `documentoResourceType` | string (opcional) | `'image'` ou `'raw'` (PDF) |
| `documentoStatus` | string (opcional) | `'pendente'`, `'aprovado'` ou `'recusado'` |
| `documentoTipo` | string (opcional) | `'contracheque'`, `'termo_posse'`, `'carteira_trabalho'`, etc. |
| `documentoRecusadoMotivo`| string (opcional) | Motivo da recusa preenchido pelo administrador |

#### Subcoleção `users/{uid}/questionarios/{edicaoId}`
* Guarda as respostas do Questionário Socioeconômico e Cultural individual do participante na edição informada.

#### Subcoleção `users/{uid}/participacoes/{edicaoId}`
* Guarda o vínculo do usuário com equipes daquela edição: `{ equipeId: string, papel: string }`.

---

### 2.2. Coleção `edicoes`
Documento: `edicoes/{edicaoId}`

| Campo | Tipo | Descrição |
|---|---|---|
| `nome` | string | Nome da edição (ex: `"4º DHPB - 2026"`) |
| `status` | string | Status geral da edição (ex: `"ativa"`) |
| `createdAt` | string (ISO) | Timestamp de criação |

#### Subcoleção `edicoes/{edicaoId}/fases/{faseId}`
Documento representativo da Fase da Olimpíada (mantido leve):

| Campo | Tipo | Descrição |
|---|---|---|
| `nome` | string | Nome da fase (ex: `"1ª Fase Online"`) |
| `dataInicio` | string (ISO/date) | Data de abertura da fase |
| `dataFim` | string (ISO/date) | Data de encerramento da fase |
| `status` | string | `'pendente'`, `'aberta'`, `'finalizada'`, `'correcao'` |
| `peso` | number | Peso da fase no cálculo da nota final |
| `notaMaxima` | number | Pontuação máxima da fase (usado como divisor no cálculo do $d_i$) |
| `provaPdfUrl` | string (opcional) | Link do caderno de prova em PDF |
| `questoesIndex` | array | Lista leve com `[{ id: string, numero: number }]` para paginação rápida |
| `tarefa` | object (opcional) | `{ titulo: string, pontuacao: number }` |
| `tarefaUrl` | string (opcional) | Link interno ou externo da atividade interativa |
| `questoes` | array (legado) | Array espelhado de questões mantido para retrocompatibilidade |

#### Subcoleção `edicoes/{edicaoId}/fases/{faseId}/questoes/{questaoId}`
Documento individual com o conteúdo completo de cada questão:

| Campo | Tipo | Descrição |
|---|---|---|
| `numero` | number | Número ordinal da questão na prova |
| `instrucao` | string (HTML) | Enunciado e instruções da questão |
| `comentario` | string (HTML) | Gabarito comentado para fase de correção |
| `alternativas` | array | Lista de alternativas: `[{ letra: "A", texto: string, peso: number }]` |
| `documentos` | array | Fontes históricas associadas: `[{ titulo, subtitulo, origem, creditos, blocos: [{ tipo: 'texto'|'imagem'|'video'|'pdf'|'musica', conteudo: string }] }]` |
| `createdAt` / `updatedAt` | string (ISO) | Datas de auditoria |

---

### 2.3. Coleção `equipes`
Documento: `equipes/{equipeId}`

| Campo | Tipo | Descrição |
|---|---|---|
| `edicaoId` | string | ID da edição correspondente |
| `nome` | string | Nome visível da equipe |
| `nomeLower` | string | Nome em minúsculo (usado para checagem rigorosa de duplicidade) |
| `nomeNormalized` | string | Nome sem acentos e caracteres especiais |
| `escola` | string | Nome da instituição de ensino |
| `escolaId` | string | Código INEP da escola |
| `tipoEscola` | string | `'municipal'`, `'estadual'`, `'federal'`, `'particular'`, `'publica'` |
| `modalidade` | string | `'fundamental'`, `'medio'`, `'eja'`, `'eja_fundamental'`, `'eja_medio'` |
| `criadorUid` | string | UID do criador da equipe |
| `criadorNome` | string | Nome completo do criador |
| `criadorEmail` | string | E-mail do criador |
| `membros` | array | Lista de membros: `[{ uid, nome, email, papel, status: 'ativo' }]` |
| `orientadorUids` | array | Array de UIDs dos orientadores (para queries com `array-contains`) |
| `df` | number | Desempenho Final consolidado da equipe (soma ponderada de todas as fases) |
| `aprovadoAte` | string (opcional) | Qual fase a equipe está liberada (ex: `'fase1'`, `'fase2'`, `'fase3'`, `'fase4'`) |
| `questionarioEquipe` | object (opcional) | Respostas do questionário coletivo da equipe |
| `ultimoNomeEditadoEm` | string (ISO) | Timestamp da última alteração de nome (cooldown de 25 dias) |
| `createdAt` | string (ISO) | Data de criação |

#### Subcoleção `equipes/{equipeId}/respostas/{questaoId}`
| Campo | Tipo | Descrição |
|---|---|---|
| `alternativa` | string | Alternativa selecionada (ex: `'A'`, `'B'`) |
| `status` | string | `'rascunho'` ou `'entregue'` |
| `peso` | number | Pontuação obtida com a alternativa |
| `faseId` | string | ID da fase |
| `numero` | number | Número da questão |
| `atualizadoEm` | string/timestamp | Momento da gravação |
| `atualizadoPor` | string | Nome ou e-mail do integrante que gravou |

#### Subcoleção `equipes/{equipeId}/pontuacoes/{faseId}`
| Campo | Tipo | Descrição |
|---|---|---|
| `ni` | number | Nota bruta da equipe na fase (soma dos pesos das questões entregues) |
| `di` | number | Desempenho ponderado da fase: $(n_i / 	ext{notaMaxima}) 	imes 	ext{peso}$ |

---

### 2.4. Coleção `membro-index`
Documento: `membro-index/{base64(email)_edicaoId}`
* **Finalidade:** Trava atômica de unicidade no Firestore. Garante que um estudante não possa ingressar em duas equipes na mesma edição simultaneamente.
* Campos: `{ equipeId: string, email: string, uid: string, edicaoId: string }`.

---

## 3. Esquema do Banco de Suporte

### 3.1. Coleção `chamados`
Documento: `chamados/{chamadoId}`

| Campo | Tipo | Descrição |
|---|---|---|
| `uid` | string | UID do usuário que abriu o chat |
| `nome` | string | Nome do participante |
| `email` | string | E-mail do participante |
| `status` | string | `'novo'`, `'aguardando_atendente'`, `'em_atendimento'`, `'aguardando_usuario'`, `'resolvido'`, `'arquivado'` |
| `categoria` | string | `'inscricao'`, `'regulamento'`, `'equipes'`, `'fases'`, `'acesso'`, `'certificados'`, `'tecnico'`, `'outros'` |
| `prioridade` | string | `'baixa'`, `'media'`, `'alta'` |
| `atendente` | string (opcional) | Nome do atendente responsável |
| `resumo` | string (opcional) | Resumo gerado pela IA no momento da transferência |
| `criadoEm` | timestamp | Momento da abertura |
| `atualizadoEm` | timestamp | Última mensagem |
| `finalizadoEm` | timestamp (opcional)| Momento do encerramento |
| `avaliacaoCSAT` | object (opcional) | `{ nota: 0-5, justificativa: string, data: timestamp }` |
| `telegramPrivadoMsgIds`| array (opcional) | IDs de mensagens enviadas para limpeza |

#### Subcoleção `chamados/{chamadoId}/mensagens/{msgId}`
| Campo | Tipo | Descrição |
|---|---|---|
| `autor` | string | `'usuario'`, `'ia'` ou `'admin'` |
| `texto` | string | Conteúdo textual da mensagem |
| `timestamp` | timestamp | Hora do envio |
| `imagemUrl` | string (opcional) | Anexo enviado via Cloudinary de suporte |

### 3.2. Coleção `respostas_rapidas`
Documento: `respostas_rapidas/{id}`
* Base de conhecimento de FAQs e atalhos rápidos dos atendentes humanos: `{ titulo, texto, categoria, sugestao, pergunta }`.
