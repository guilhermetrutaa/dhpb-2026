# DHPB 2026 — Agent Constitution & Engineering Principles

> **Este documento define os princípios inegociáveis, restrições e regras de ouro que QUALQUER agente de Inteligência Artificial ou desenvolvedor deve respeitar ao trabalhar no repositório do DHPB 2026.**

---

## 1. Princípios Fundamentais de Engenharia

### 1. Preservação Absoluta do "Free Tier" do Firebase
* **Princípio:** O DHPB opera no plano gratuito Google Cloud Firebase Spark.
* **Regra:** Nunca introduza queries sem filtro ou varreduras completas de coleção (`getDocs(collection(...))`). Toda busca ou listagem deve possuir `where()` ou `limit()`.
* **Regra:** Para busca de escolas, utilize exclusivamente o dataset estático local `public/escolas-pb.json`. Nunca volte a consultar a coleção de escolas no Firestore durante o autocomplete.
* **Regra:** Nunca volte a embutir todas as questões no documento da Fase ou todas as respostas no documento da Equipe. Mantenha as subcoleções granulares `fases/{fId}/questoes/{qId}` e `equipes/{eqId}/respostas/{qId}`.

### 2. Otimização de Banda e Mídia (Cloudinary)
* **Princípio:** O plano gratuito do Cloudinary possui limite de 25 créditos compartilhados.
* **Regra:** Todas as imagens exibidas no frontend devem passar pelo helper `@/lib/cloudinary` (`optimizeCloudinaryUrl`), aplicando `f_auto,q_auto,c_limit,w_820`. Nunca sirva imagens originais pesadas diretamente no `<img>`.
* **Regra:** Trave uploads de imagem no admin em no máximo 2 MB e tipos MIME válidos.

### 3. Escopo Cirúrgico e Mudanças Controladas
* **Princípio:** Modifique estritamente os arquivos necessários para a tarefa solicitada.
* **Regra:** Não faça refatorações cosméticas em módulos não relacionados.
* **Regra:** Não crie abstrações, wrappers ou bibliotecas extras sem necessidade comprovada.
* **Regra:** Reutilize sempre os serviços, constantes e componentes existentes (ex: `AuthContext`, `constants.js`, `SupportWidget`).

### 4. Isolamento dos Ambientes Firebase
* **Princípio:** O DHPB possui duas instâncias distintas do Firebase.
* **Regra:** Nunca misture o Firebase Principal (`@/lib/firebase`) com o Firebase do Suporte (`@/lib/support/firebase`). O chat de suporte não deve realizar leituras nem escritas no banco da olimpíada.

### 5. Atomicidade e Segurança nas Respostas
* **Princípio:** A integridade dos resultados da olimpíada não pode ser comprometida por concorrência.
* **Regra:** Atualizações de pontuação da equipe (`ni`, `di`, `df`) e entrega de respostas devem utilizar `runTransaction` ou `increment()` do Firestore.
* **Regra:** Uma vez com status `entregue`, uma questão nunca pode ser sobrescrita.

### 6. Padrão Client-Side e Compatibilidade Next.js 16
* **Princípio:** A aplicação roda como SPA com Next.js 16 e Turbopack.
* **Regra:** Mantenha `'use client'` em componentes interativos.
* **Regra:** Páginas que utilizam `useSearchParams()` devem sempre estar encapsuladas em `<Suspense>`.
* **Regra:** Nunca quebre o comando `npm run build`.

### 7. Tratamento de Segredos e Chaves
* **Princípio:** Nenhuma credencial ou chave privada pode ser exposta no frontend.
* **Regra:** Variáveis como `SUPPORT_SERVICE_ACCOUNT`, `GROQ_API_KEY`, `TELEGRAM_BOT_TOKEN` e `ONESIGNAL_REST_API_KEY` são de uso estritamente restrito a Route Handlers (`src/app/api/*`).

### 8. Dual-Write Legado em Equipe
* **Princípio:** A pontuação e as respostas ainda são gravadas na subcoleção **e** em mapas embutidos no documento da equipe (`src/app/questao/page.jsx`).
* **Regra:** Não remova o dual-write nem o array legado `fases.questoes` sem spec explícita. Ranking lê `equipes.pontuacoes` embutido.

### 9. Trava de Unicidade (`membro-index`)
* **Princípio:** Um estudante só entra em uma equipe por edição via `membro-index/{btoa(email)_edicaoId}`.
* **Regra:** Qualquer inclusão, troca ou remoção de membro deve manter `writeBatch` ou transação alinhada a `membro-index`. Não invente outra chave de unicidade.

### 10. Dataset Estático de Escolas
* **Princípio:** `public/escolas-pb.json` existe para zerar leituras de autocomplete no Firestore.
* **Regra:** Não edite esse arquivo manualmente. Não recrie coleção de escolas no Firestore para busca.

### 11. Spec-Driven Development
* **Princípio:** Mudança de comportamento passa por `specs/<nnn-slug>/` (spec → plan → tasks) antes de `src/`.
* **Regra:** Se docs e código divergirem, o código vence até uma spec mandar o contrário. Processo em `docs/SDD_ADOPTION_PLAN.md`.

---

## 2. Checklist Obrigatório Pré-Finalização de Qualquer Tarefa

Antes de concluir qualquer modificação no repositório, o agente deve verificar:

- [ ] A alteração manteve a regra do Firebase Free Tier (leituras/escritas mínimas)?
- [ ] As imagens utilizam `optimizeCloudinaryUrl`?
- [ ] Não há vazamento de chaves secretas ou credenciais?
- [ ] O comando `npm run build` foi executado e concluiu com **código 0 (sucesso)**?
- [ ] A documentação em `/docs` foi atualizada se houver nova rota ou mudança de schema?
- [ ] Se houve mudança de comportamento, existem `spec.md` / `plan.md` / `tasks.md` em `specs/<nnn-slug>/` e os critérios da spec foram verificados?
- [ ] Se a tarefa tocou membros ou pontuação, `membro-index` e o dual-write legado foram preservados?
