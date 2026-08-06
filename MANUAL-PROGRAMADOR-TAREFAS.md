# Manual do DHPB 2026 — Guia Definitivo para Criação de Tarefas

Olá, novo dev! Seja bem-vindo à equipe do **Desafio em História da Paraíba (DHPB)**. 

Este documento foi criado especialmente para você. Ele resume como o nosso site funciona, qual é a nossa maior restrição técnica (custos) e como você deve instruir a Inteligência Artificial (IA) para criar as páginas de Tarefas.

---

## 1. O que é o DHPB?
O DHPB é uma olimpíada online de história. O site recebe **8.000 alunos** em dias de pico.
Os alunos se cadastram, formam equipes (de até 4 pessoas, incluindo um professor) e acessam uma "Sala de Equipe". 
Lá dentro, a competição é dividida em **Fases**. Cada fase pode ter Questões (múltipla escolha) e **Tarefas** (atividades interativas exclusivas).

O seu trabalho principal será atuar nas **Tarefas**.

---

## 2. A Regra de Ouro: O "Free Tier" do Firebase
Em 2025, o projeto gastou R$ 24.000 com o Firebase por causa de uma arquitetura ruim que lia dados sem parar. Em 2026, nós refatoramos TUDO para rodar **100% de graça** no plano Spark (Free Tier) do Google.

**Os seus limites diários (jamais devem ser estourados):**
- 50.000 Leituras (Reads)
- 20.000 Escritas (Writes)

### Como nós resolvemos isso? (E como você deve manter)
- **NUNCA crie subcoleções** para dados que são sempre lidos juntos. 
- As respostas de uma equipe ficam **embutidas** no próprio documento da equipe (`equipes/{id}`).
- Não faça laços de repetição (for/while) disparando `getDoc` ou `updateDoc` desenfreadamente.
- Para atualizar pontos, use **SEMPRE** a função `increment()` do Firebase, pois ela não exige que você "leia" o dado antes de atualizá-lo.

---

## 3. O Fluxo de uma Tarefa

Quando a equipe organizadora inventa uma tarefa nova (ex: "Jogo da Memória" ou "Cruzadinha"), o Administrador cadastra essa tarefa no painel de Admin (`/admin/questoes`). Ele preenche o Título, o Link da Página (ex: `/tarefas/cruzadinha-fase-2`) e a Pontuação Máxima daquela tarefa.

O seu trabalho é **criar a página da tarefa** (`src/app/tarefas/cruzadinha-fase-2/page.jsx`).

### Como você deve trabalhar com a IA:
Você não precisa programar tudo do zero. Você vai usar a IA (Claude, Gemini, ChatGPT) para programar para você, mas precisa dar os comandos (prompts) perfeitamente.

**Siga este passo a passo ao pedir para a IA criar uma tarefa:**

1. **Entregue o Design:** Tire um print (foto) do desenho que a equipe organizadora fez de como a tarefa deve ser visualmente e anexe no chat da IA.
2. **Defina as Regras do Jogo:** Explique detalhadamente como o aluno pontua na tarefa (ex: "Se ele acertar 3 palavras na cruzadinha ganha 10 pontos, se errar perde vida").
3. **Passe o Padrão Visual:** Avise à IA que o nosso site usa fundo branco (`#ffffff`), a cor primária vermelho-bordô (`#82181A`) para botões e detalhes, e a fonte `Poppins`. Todos os botões devem ter `transition-colors`.
4. **Passe o Padrão Firebase (MUITO IMPORTANTE):** 
   Copie e cole o texto abaixo para a IA sempre que pedir para ela finalizar e salvar os pontos da tarefa:

> "IA, quando o aluno clicar no botão de 'Finalizar Tarefa', você deve salvar os pontos ganhos diretamente no documento da equipe dele no Firestore, SEM fazer leituras prévias para calcular o ranking. 
> Use EXATAMENTE este código de updateDoc com increment:
> ```javascript
> import { doc, updateDoc, increment } from 'firebase/firestore'
> import { db } from '@/lib/firebase'
> 
> // Supondo que a variável 'pontosGanhos' tenha a nota calculada na sua tarefa
> // e 'pesoDaFase' seja o peso configurado (você pode buscar isso no documento da fase se precisar)
> const deltaDi = pontosGanhos * pesoDaFase
> 
> await updateDoc(doc(db, 'equipes', equipeId), {
>   [`tarefasFeitas.${faseId}`]: true, // Marca que a tarefa foi feita
>   [`pontuacoes.${faseId}.ni`]: increment(pontosGanhos),
>   [`pontuacoes.${faseId}.di`]: increment(deltaDi),
>   df: increment(deltaDi)
> })
> ```

---

## 4. Onde ficam as Páginas?
- `src/app/admin/dashboard` -> Onde os admins gerenciam edições e fases.
- `src/app/admin/questoes` -> Onde os admins cadastram questões, documentos (agora com upload pro Cloudinary) e a **URL/Pontuação da Tarefa**.
- `src/app/sala-de-equipe` -> A sala onde o aluno clica na fase.
- `src/app/resumo-fase` -> A tela onde o aluno vê as questões que respondeu e tem o botão "Acessar Tarefa da Fase" (que vai jogar o aluno para a página que você vai criar!).

Boa sorte e qualquer dúvida técnica, sempre peça para a IA consultar o arquivo principal de contexto do projeto (`CONTEXTO-SESSAO.md`). Mãos à obra!
